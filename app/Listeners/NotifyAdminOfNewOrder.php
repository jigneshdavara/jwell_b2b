<?php

namespace App\Listeners;

use App\Events\OrderConfirmed;
use App\Mail\AdminOrderNotificationMail;
use Illuminate\Support\Facades\Mail;

class NotifyAdminOfNewOrder
{
    public function handle(OrderConfirmed $event): void
    {
        $adminEmail = config('demo.admin_email');

        if (! $adminEmail) {
            return;
        }

        Mail::to($adminEmail)->send(new AdminOrderNotificationMail(
            $event->order->loadMissing('user', 'items'),
            $event->payment
        ));
    }
}
