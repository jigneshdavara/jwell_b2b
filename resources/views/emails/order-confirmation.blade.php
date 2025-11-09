@extends('emails.layout')

@section('content')
    <p style="margin:0 0 18px;font-size:14px;color:#64748b;">Hi {{ $order->user->name }},</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.4;color:#0f172a;">We’ve confirmed your order {{ $order->reference }}</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        Thank you for trusting {{ config('demo.brand_name') }}. Our merchandising desk has locked in your bullion rates
        and the production planning team will begin allocation shortly. A copy of the key details is included below.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
            <td style="padding:10px 12px;background-color:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#475569;font-weight:600;width:35%;">Reference</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;">{{ $order->reference }}</td>
        </tr>
        <tr>
            <td style="padding:10px 12px;background-color:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#475569;font-weight:600;">Amount</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;">{{ number_format($order->total_amount, 2) }} {{ $order->currency }}</td>
        </tr>
        <tr>
            <td style="padding:10px 12px;background-color:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#475569;font-weight:600;">Payment Intent</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;">{{ $payment->provider_reference }}</td>
        </tr>
    </table>
    <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Items</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        @foreach ($order->items as $item)
            <tr>
                <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;width:65%;font-weight:600;">
                    {{ $item->name }} <span style="display:block;color:#64748b;font-weight:400;">SKU {{ $item->sku }}</span>
                </td>
                <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#475569;">Qty {{ $item->quantity }}</td>
                <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;text-align:right;">₹ {{ number_format($item->total_price, 2) }}</td>
            </tr>
        @endforeach
    </table>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        You can follow live production milestones and logistics updates from your dashboard anytime.
    </p>
    <p style="margin:0;font-size:14px;color:#0f172a;font-weight:600;">With gratitude,<br>The AurumCraft Production Desk</p>
@endsection
