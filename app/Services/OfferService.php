<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Collection;

class OfferService
{
    /**
     * Resolve applicable offers for a given order or cart context.
     *
     * @param  User  $user
     * @param  array<string, mixed>  $context
     * @return Collection<int, array{code: string, description: string, amount: float}>
     */
    public function resolveOffers(User $user, array $context = []): Collection
    {
        // TODO: Implement offer resolution rules.
        return collect();
    }

    /**
     * Attach resolved offers to an order instance.
     */
    public function applyOffersToOrder(Order $order, Collection $offers): void
    {
        // TODO: Persist offer relationships and price adjustments.
    }
}

