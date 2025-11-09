<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\GenericNotification;
use Illuminate\Support\Facades\Notification;

class NotificationService
{
    /**
     * Dispatch a notification to the given user across configured channels.
     *
     * @param  User  $user
     * @param  string  $template
     * @param  array<string, mixed>  $data
     */
    public function send(User $user, string $template, array $data = []): void
    {
        Notification::send($user, new GenericNotification($template, $data));
    }
}

