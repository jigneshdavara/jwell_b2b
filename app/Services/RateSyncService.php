<?php

namespace App\Services;

use App\Models\PriceRate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RateSyncService
{
    /**
     * Troy ounce → gram conversion factor.
     */
    private const TROY_OUNCE_TO_GRAMS = 31.1034768;

    /**
     * Supported metals, their market symbols and purity multipliers.
     *
     * @var array<string, array<string, mixed>>
     */
    private const METAL_MAP = [
        'gold' => [
            'symbol' => 'XAU',
            'purities' => [
                '24K' => 1.0,
                '22K' => 22 / 24,
                '18K' => 18 / 24,
                '14K' => 14 / 24,
            ],
        ],
        'silver' => [
            'symbol' => 'XAG',
            'purities' => [
                '999' => 0.999,
                '958' => 0.958,
                '925' => 0.925,
            ],
        ],
    ];

    /**
     * Fetch live metal rates for the configured metals and persist them.
     *
     * @return array<string, array<int, array<string, mixed>>> keyed by metal name
     */
    public function syncLiveRates(?string $metal = null): array
    {
        $metalsToSync = $metal ? [$metal] : array_keys(self::METAL_MAP);
        $synced = [];

        foreach ($metalsToSync as $targetMetal) {
            $snapshot = $this->fetchSnapshot($targetMetal);

            if ($snapshot === null) {
                continue;
            }

            $records = [];

            foreach ($snapshot['purity_rates'] as $purity => $pricePerGram) {
                $record = PriceRate::updateOrCreate(
                    [
                        'metal' => $targetMetal,
                        'purity' => $purity,
                    ],
                    [
                        'price_per_gram' => $pricePerGram,
                        'currency' => $snapshot['currency'],
                        'source' => $snapshot['provider'],
                        'metadata' => [
                            'origin' => $snapshot['provider'],
                            'base_price_per_gram' => $snapshot['base_price_per_gram'],
                        ],
                        'effective_at' => now(),
                    ],
                );

                $records[] = [
                    'purity' => $record->purity,
                    'price_per_gram' => $record->price_per_gram,
                    'currency' => $record->currency,
                    'effective_at' => optional($record->effective_at)?->toIso8601String(),
                    'source' => $record->source,
                ];
            }

            $synced[$targetMetal] = $records;
        }

        return $synced;
    }

    /**
     * Fetch live rate snapshot for a metal.
     */
    protected function fetchSnapshot(string $metal): ?array
    {
        $metal = strtolower($metal);

        if (! array_key_exists($metal, self::METAL_MAP)) {
            return null;
        }

        return match (config('services.rates.driver', 'metals-api')) {
            'metals-api' => $this->fetchFromMetalsApi($metal),
            default => null,
        };
    }

    /**
     * Retrieve rates from metals-api.com.
     */
    protected function fetchFromMetalsApi(string $metal): ?array
    {
        $token = config('services.rates.token');

        if (! $token) {
            Log::warning('RateSyncService: no API token configured for metals-api driver.');
            return null;
        }

        $endpoint = config('services.rates.endpoint') ?: 'https://metals-api.com/api/latest';
        $symbol = self::METAL_MAP[$metal]['symbol'];
        $currency = strtoupper(config('services.rates.currency', 'INR'));

        $response = Http::timeout(10)->get($endpoint, [
            'access_key' => $token,
            'base' => $symbol,
            'symbols' => $currency,
        ]);

        if (! $response->successful()) {
            Log::warning('RateSyncService: metals-api request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        }

        $rate = data_get($response->json(), "rates.{$currency}");

        if (! is_numeric($rate)) {
            Log::warning('RateSyncService: metals-api response missing numeric rate', [
                'response' => $response->json(),
            ]);
            return null;
        }

        $basePricePerGram = round(((float) $rate) / self::TROY_OUNCE_TO_GRAMS, 2);

        $purityRates = collect(self::METAL_MAP[$metal]['purities'])
            ->map(fn (float $multiplier) => round($basePricePerGram * $multiplier, 2))
            ->all();

        return [
            'metal' => $metal,
            'provider' => 'metals-api',
            'currency' => $currency,
            'base_price_per_gram' => $basePricePerGram,
            'purity_rates' => $purityRates,
        ];
    }
}

