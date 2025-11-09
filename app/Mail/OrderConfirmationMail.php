<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order, public Payment $payment)
    {
    }

    public function build(): self
    {
        $subject = 'Order '.$this->order->reference.' confirmed';

        return $this->subject($subject)
            ->view('emails.order-confirmation', [
                'order' => $this->order,
                'payment' => $this->payment,
                'subject' => $subject,
            ]);
    }
}
