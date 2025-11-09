<?php

namespace App\Listeners;

use App\Mail\AdminNewUserMail;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Mail;

class NotifyAdminOfRegistration
{
    public function handle(Registered $event): void
    {
        $adminEmail = config('demo.admin_email');

        if (! $adminEmail) {
            return;
        }

        Mail::to($adminEmail)->send(new AdminNewUserMail($event->user));
    }
}
