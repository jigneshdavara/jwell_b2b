<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WelcomeCustomerMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user)
    {
    }

    public function build(): self
    {
        $subject = 'Welcome to '.config('demo.brand_name');

        return $this->subject($subject)
            ->view('emails.welcome-customer', [
                'user' => $this->user,
                'subject' => $subject,
            ]);
    }
}
