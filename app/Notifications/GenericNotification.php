<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GenericNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  string  $template
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        protected string $template,
        protected array $payload = []
    ) {
        //
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->payload['subject'] ?? config('app.name').' Notification')
            ->greeting($this->payload['greeting'] ?? 'Hello '.$notifiable->name)
            ->line($this->payload['message'] ?? 'You have a new notification.');

        if (isset($this->payload['action'])) {
            $mail->action(
                $this->payload['action']['label'] ?? 'View details',
                $this->payload['action']['url'] ?? url('/')
            );
        }

        return $mail;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'template' => $this->template,
            'payload' => $this->payload,
        ];
    }
}
