<?php

namespace App\Mail;

use App\Models\Quotation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class QuotationSubmittedAdminMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Quotation $quotation)
    {
    }

    public function build(): self
    {
        $subject = 'New Quotation Request #'.$this->quotation->id.' - '.$this->quotation->product->name;

        return $this->subject($subject)
            ->view('emails.quotation-submitted-admin', [
                'quotation' => $this->quotation,
                'subject' => $subject,
            ]);
    }
}

