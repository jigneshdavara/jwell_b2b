<?php

namespace App\Mail;

use App\Models\Quotation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class QuotationSubmittedCustomerMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Quotation $quotation)
    {
    }

    public function build(): self
    {
        $subject = 'Quotation Request Received - '.$this->quotation->product->name;

        return $this->subject($subject)
            ->view('emails.quotation-submitted-customer', [
                'quotation' => $this->quotation,
                'subject' => $subject,
            ]);
    }
}

