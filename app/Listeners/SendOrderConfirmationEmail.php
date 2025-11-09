<?php

namespace App\Listeners;

use App\Events\OrderConfirmed;
use App\Mail\OrderConfirmationMail;
use Illuminate\Support\Facades\Mail;

class SendOrderConfirmationEmail
{
    public function handle(OrderConfirmed $event): void
    {
        $order = $event->order->loadMissing('user', 'items');

        if (! $order->user?->email) {
            return;
        }

        Mail::to($order->user->email)->send(new OrderConfirmationMail($order, $event->payment));
    }
}
