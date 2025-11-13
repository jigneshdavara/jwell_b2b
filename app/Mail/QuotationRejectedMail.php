<?php

namespace App\Mail;

use App\Models\Quotation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class QuotationRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Quotation $quotation, public ?string $reason = null)
    {
    }

    public function build(): self
    {
        $subject = 'Quotation Update - '.$this->quotation->product->name;

        return $this->subject($subject)
            ->view('emails.quotation-rejected', [
                'quotation' => $this->quotation,
                'reason' => $this->reason,
                'subject' => $subject,
            ]);
    }
}

