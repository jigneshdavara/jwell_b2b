@extends('emails.layout')

@section('content')
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;">Hello Operations,</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.4;color:#0f172a;">New order ready for production triage</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        A customer has completed checkout and locked rates. Please route the job to merchandising and production.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
            <td style="padding:10px 12px;background-color:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#475569;font-weight:600;width:35%;">Order</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;">{{ $order->reference }}</td>
        </tr>
        <tr>
            <td style="padding:10px 12px;background-color:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#475569;font-weight:600;">Customer</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;">{{ $order->user->name }} ({{ $order->user->email }})</td>
        </tr>
        <tr>
            <td style="padding:10px 12px;background-color:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#475569;font-weight:600;">Value</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;">₹ {{ number_format($order->total_amount, 2) }}</td>
        </tr>
        <tr>
            <td style="padding:10px 12px;background-color:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#475569;font-weight:600;">Payment Ref</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;">{{ $payment->provider_reference }}</td>
        </tr>
    </table>
    <h2 style="margin:0 0 12px;font-size:17px;color:#0f172a;">Line items</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        @foreach ($order->items as $item)
            <tr>
                <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;width:55%;font-weight:600;">{{ $item->name }}</td>
                <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#475569;">SKU {{ $item->sku }}</td>
                <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#475569;">Qty {{ $item->quantity }}</td>
            </tr>
        @endforeach
    </table>
    <p style="margin:0;font-size:14px;color:#0f172a;font-weight:600;">Elvee Automations</p>
@endsection
