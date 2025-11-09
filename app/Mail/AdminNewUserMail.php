<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminNewUserMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user)
    {
    }

    public function build(): self
    {
        $subject = 'New partner registration: '.$this->user->name;

        return $this->subject($subject)
            ->view('emails.admin-registration', [
                'user' => $this->user,
                'subject' => $subject,
            ]);
    }
}
