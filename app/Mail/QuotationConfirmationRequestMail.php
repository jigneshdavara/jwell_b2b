<?php

namespace App\Mail;

use App\Models\Quotation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class QuotationConfirmationRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Quotation $quotation, public ?string $message = null)
    {
    }

    public function build(): self
    {
        $subject = 'Action Required: Please Review Updated Quotation #'.$this->quotation->id;

        return $this->subject($subject)
            ->view('emails.quotation-confirmation-request', [
                'quotation' => $this->quotation,
                'message' => $this->message,
                'subject' => $subject,
            ]);
    }
}

