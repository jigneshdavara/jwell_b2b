<?php

namespace App\Services;

use App\Models\PriceRate;
use Illuminate\Support\Facades\Http;

class RateSyncService
{
    /**
     * Fetch live metal/diamond rates from the configured provider and persist them.
     */
    public function syncLiveRates(): void
    {
        // TODO: Replace with real integration logic.
        $endpoint = config('services.rates.endpoint');

        if (! $endpoint) {
            return;
        }

        $response = Http::get($endpoint, array_filter([
            'token' => config('services.rates.token'),
        ]));

        if ($response->successful()) {
            foreach ($response->json('rates', []) as $item) {
                PriceRate::updateOrCreate(
                    [
                        'metal' => $item['metal'],
                        'purity' => $item['purity'],
                    ],
                    [
                        'price_per_gram' => $item['price_per_gram'],
                        'source' => $item['source'] ?? 'api',
                        'effective_at' => now(),
                    ]
                );
            }
        }
    }
}

