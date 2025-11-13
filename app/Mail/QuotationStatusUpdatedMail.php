<?php

namespace App\Mail;

use App\Models\Quotation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class QuotationStatusUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Quotation $quotation,
        public string $previousStatus,
        public ?string $notes = null
    ) {
    }

    public function build(): self
    {
        $statusLabels = [
            'pending' => 'Pending Review',
            'pending_customer_confirmation' => 'Awaiting Your Confirmation',
            'customer_confirmed' => 'Customer Confirmed',
            'customer_declined' => 'Customer Declined',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
        ];

        $statusLabel = $statusLabels[$this->quotation->status] ?? ucfirst(str_replace('_', ' ', $this->quotation->status));
        $subject = 'Quotation #'.$this->quotation->id.' Status Updated - '.$statusLabel;

        return $this->subject($subject)
            ->view('emails.quotation-status-updated', [
                'quotation' => $this->quotation,
                'previousStatus' => $this->previousStatus,
                'statusLabel' => $statusLabel,
                'notes' => $this->notes,
                'subject' => $subject,
            ]);
    }
}

