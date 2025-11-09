<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRateOverrideRequest;
use App\Models\PriceRate;
use App\Services\RateSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RateController extends Controller
{
    public function __construct(
        protected RateSyncService $rateSyncService
    ) {
    }

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

        return Inertia::render('Admin/Rates/Index', [
            'rates' => $rates,
            'metals' => PriceRate::query()->select('metal')->distinct()->orderBy('metal')->pluck('metal'),
            'defaultCurrency' => config('app.currency', 'INR'),
        ]);
    }

    public function sync(): RedirectResponse
    {
        $this->rateSyncService->syncLiveRates();

        return redirect()
            ->route('admin.rates.index')
            ->with('success', 'Live rate synchronization has been queued. Refresh in a moment.');
    }

    public function storeOverride(StoreRateOverrideRequest $request): RedirectResponse
    {
        PriceRate::create([
            'metal' => $request->input('metal'),
            'purity' => $request->input('purity'),
            'price_per_gram' => $request->input('price_per_gram'),
            'currency' => $request->input('currency', config('app.currency', 'INR')),
            'source' => 'manual',
            'effective_at' => $request->date('effective_at', now()),
            'metadata' => array_filter([
                'notes' => $request->input('notes'),
            ]),
        ]);

        return redirect()
            ->route('admin.rates.index')
            ->with('success', 'Manual override saved.');
    }
}
