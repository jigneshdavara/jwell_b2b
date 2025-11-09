<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $code,
        public readonly string $expiresIn
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your AurumCraft login code'
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.auth.login-otp',
            with: [
                'code' => $this->code,
                'expiresIn' => $this->expiresIn,
                'brand' => config('demo.brand_name', 'AurumCraft'),
            ],
        );
    }
}
