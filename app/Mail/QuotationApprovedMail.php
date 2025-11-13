<?php

namespace App\Mail;

use App\Models\Quotation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class QuotationApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Quotation $quotation)
    {
    }

    public function build(): self
    {
        $subject = 'Quotation Approved - '.$this->quotation->product->name;

        return $this->subject($subject)
            ->view('emails.quotation-approved', [
                'quotation' => $this->quotation,
                'subject' => $subject,
            ]);
    }
}

