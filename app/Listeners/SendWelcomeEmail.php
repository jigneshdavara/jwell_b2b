<?php

namespace App\Listeners;

use App\Mail\WelcomeCustomerMail;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Mail;

class SendWelcomeEmail
{
    public function handle(Registered $event): void
    {
        if (! $event->user?->email) {
            return;
        }

        Mail::to($event->user->email)->send(new WelcomeCustomerMail($event->user));
    }
}
