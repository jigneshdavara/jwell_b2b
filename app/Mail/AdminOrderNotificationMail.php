<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminOrderNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order, public Payment $payment)
    {
    }

    public function build(): self
    {
        $subject = 'New order received: '.$this->order->reference;

        return $this->subject($subject)
            ->view('emails.admin-order-notification', [
                'order' => $this->order,
                'payment' => $this->payment,
                'subject' => $subject,
            ]);
    }
}
