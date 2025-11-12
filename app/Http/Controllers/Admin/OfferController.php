<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreOfferRequest;
use App\Http\Requests\Admin\UpdateOfferRequest;
use App\Models\CustomerGroup;
use App\Models\Offer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OfferController extends Controller
{
    public function index(): Response
    {
        $offers = Offer::query()
            ->latest()
            ->paginate(20)
            ->through(function (Offer $offer) {
                return [
                    'id' => $offer->id,
                    'code' => $offer->code,
                    'name' => $offer->name,
                    'description' => $offer->description,
                    'type' => $offer->type,
                    'type_label' => Str::headline($offer->type),
                    'value' => $offer->value,
                    'constraints' => $offer->constraints,
                    'starts_at' => optional($offer->starts_at)?->toDateString(),
                    'ends_at' => optional($offer->ends_at)?->toDateString(),
                    'is_active' => $offer->is_active,
                    'updated_at' => optional($offer->updated_at)?->toDateTimeString(),
                ];
            });

        return Inertia::render('Admin/Offers/Index', [
            'offers' => $offers,
            'offerTypes' => ['percentage', 'fixed', 'making_charge'],
            'customerTypes' => collect([UserType::Retailer, UserType::Wholesaler])
                ->map(fn (UserType $type) => [
                    'value' => $type->value,
                    'label' => Str::title(str_replace('-', ' ', $type->value)),
                ])
                ->values(),
            'customerGroups' => CustomerGroup::query()
                ->select('id', 'name')
                ->where('is_active', true)
                ->orderBy('position')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(StoreOfferRequest $request): RedirectResponse
    {
        Offer::create($request->validated());

        return redirect()
            ->route('admin.offers.index')
            ->with('success', 'Offer created successfully.');
    }

    public function update(UpdateOfferRequest $request, Offer $offer): RedirectResponse
    {
        $offer->update($request->validated());

        return redirect()
            ->route('admin.offers.index')
            ->with('success', 'Offer updated successfully.');
    }

    public function destroy(Offer $offer): RedirectResponse
    {
        $offer->delete();

        return redirect()
            ->route('admin.offers.index')
            ->with('success', 'Offer removed.');
    }
}
