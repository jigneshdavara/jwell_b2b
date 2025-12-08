<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateMetalRatesRequest;
use App\Models\PriceRate;
use App\Services\RateSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RateController extends Controller
{
    private const PURITY_ORDER = [
        'gold' => ['24K', '22K', '18K', '14K'],
        'silver' => ['999', '958', '925'],
    ];

    public function __construct(
        protected RateSyncService $rateSyncService
    ) {}

    public function index(): Response
    {
        $rates = PriceRate::query()
            ->latest('effective_at')
            ->paginate(20)
            ->through(function (PriceRate $rate) {
                return [
                    'id' => $rate->id,
                    'metal' => $rate->metal,
                    'purity' => $rate->purity,
                    'price_per_gram' => $rate->price_per_gram,
                    'currency' => $rate->currency,
                    'source' => Str::headline($rate->source ?? 'system'),
                    'effective_at' => optional($rate->effective_at)?->toDateTimeString(),
                    'metadata' => $rate->metadata,
                ];
            });

        // Get all available metals from the database
        $availableMetals = \App\Models\Metal::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(function ($metal) {
                return [
                    'id' => $metal->id,
                    'name' => $metal->name,
                    'value' => Str::lower($metal->name), // Use name as value for matching
                ];
            })
            ->all();

        // Get purities for each metal
        $metalPuritiesMap = [];
        foreach ($availableMetals as $metal) {
            $metalModel = \App\Models\Metal::find($metal['id']);
            if ($metalModel) {
                $metalPuritiesMap[$metal['value']] = $metalModel->purities()
                    ->where('is_active', true)
                    ->orderBy('display_order')
                    ->orderBy('name')
                    ->get()
                    ->map(function ($purity) {
                        return [
                            'id' => $purity->id,
                            'name' => $purity->name,
                        ];
                    })
                    ->all();
            }
        }

        // Build summaries for ALL active metals (not just those with rates)
        $metalSummaries = [];
        foreach ($availableMetals as $metal) {
            $metalValue = $metal['value'];
            // Build summary for all active metals, even if they don't have rates yet
            $metalSummaries[$metalValue] = $this->buildMetalSummary($metalValue);
        }

        return Inertia::render('Admin/Rates/Index', [
            'rates' => $rates,
            'defaultCurrency' => config('app.currency', 'INR'),
            'availableMetals' => $availableMetals,
            'metalSummaries' => $metalSummaries,
            'metalPurities' => $metalPuritiesMap, // Purities grouped by metal slug
        ]);
    }

    public function sync(?string $metal = null): RedirectResponse
    {
        $normalizedMetal = $metal ? Str::lower($metal) : null;
        $synced = $this->rateSyncService->syncLiveRates($normalizedMetal);

        $hasUpdates = collect($synced)
            ->flatten(1)
            ->isNotEmpty();

        if (! $hasUpdates) {
            return redirect()
                ->route('admin.rates.index')
                ->with('error', 'Could not fetch live rates. Check API credentials and try again.');
        }

        $message = $normalizedMetal
            ? Str::headline("{$normalizedMetal} rates pulled from provider. Review and save to apply.")
            : 'Live rate synchronization has been queued. Refresh in a moment.';

        return redirect()
            ->route('admin.rates.index')
            ->with('success', $message);
    }

    public function storeMetal(UpdateMetalRatesRequest $request, string $metal): RedirectResponse
    {
        $normalizedMetal = Str::lower($metal);
        $currency = Str::upper($request->input('currency', config('app.currency', 'INR')));

        collect($request->input('rates', []))
            ->map(function ($rate) {
                return [
                    'purity' => isset($rate['purity']) ? trim((string) $rate['purity']) : '',
                    'price_per_gram' => isset($rate['price_per_gram']) ? (float) $rate['price_per_gram'] : 0.0,
                ];
            })
            ->filter(fn($rate) => $rate['purity'] !== '' && $rate['price_per_gram'] > 0)
            ->each(function (array $rate) use ($normalizedMetal, $currency): void {
                PriceRate::updateOrCreate(
                    [
                        'metal' => $normalizedMetal,
                        'purity' => $rate['purity'],
                    ],
                    [
                        'price_per_gram' => $rate['price_per_gram'],
                        'currency' => $currency,
                        'source' => 'manual',
                        'metadata' => [
                            'origin' => 'manual',
                        ],
                        'effective_at' => now(),
                    ],
                );
            });

        return redirect()
            ->route('admin.rates.index')
            ->with('success', Str::headline("{$metal} rates saved."));
    }

    protected function buildMetalSummary(string $metal): array
    {
        $rates = PriceRate::query()
            ->whereRaw('LOWER(metal) = ?', [$metal])
            ->latest('effective_at')
            ->get();

        $latest = $rates->first();

        /** @var \Illuminate\Support\Collection<int, \App\Models\PriceRate> $latestByPurity */
        $latestByPurity = $rates
            ->unique('purity')
            ->sortBy(function (PriceRate $rate) use ($metal) {
                $order = self::PURITY_ORDER[$metal] ?? [];
                $index = array_search($rate->purity, $order, true);

                return $index === false ? PHP_INT_MAX : $index;
            })
            ->values();

        return [
            'metal' => $metal,
            'label' => Str::title($metal),
            'latest' => $latest ? [
                'purity' => $latest->purity,
                'price_per_gram' => $latest->price_per_gram,
                'currency' => $latest->currency ?? config('app.currency', 'INR'),
                'effective_at' => optional($latest->effective_at)?->toIso8601String(),
                'source' => $latest->source,
            ] : null,
            'rates' => $latestByPurity
                ->values()
                ->map(function (PriceRate $rate) {
                    return [
                        'purity' => $rate->purity,
                        'price_per_gram' => $rate->price_per_gram,
                        'currency' => $rate->currency ?? config('app.currency', 'INR'),
                    ];
                })
                ->all(),
        ];
    }
}
