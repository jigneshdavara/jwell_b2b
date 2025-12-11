@extends('emails.layout')

@section('content')
    <p style="margin:0 0 18px;font-size:14px;color:#64748b;">Hi {{ $quotation->user->name }},</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.4;color:#0f172a;">We've received your quotation request</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        Thank you for your interest in <strong>{{ $quotation->product->name }}</strong>. Our merchandising desk has received your quotation request and will review it shortly. We'll get back to you with pricing and availability within 24-48 hours.
    </p>
    
    <div style="background-color:#f8fafc;border-left:4px solid #3b82f6;padding:20px;margin:24px 0;border-radius:8px;">
        <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">Quotation Details</h2>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;width:40%;">Quotation ID</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">#{{ $quotation->id }}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Product</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $quotation->product->name }}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">SKU</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $quotation->product->sku }}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Quantity</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $quotation->quantity }}</td>
            </tr>
            @if($quotation->notes)
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Your Notes</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $quotation->notes }}</td>
            </tr>
            @endif
        </table>
    </div>

    <p style="margin:24px 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        You can track the status of your quotation and communicate with our team directly from your dashboard.
    </p>
    
    <div style="margin:24px 0;text-align:center;">
        <a href="{{ route('frontend.quotations.index') }}" style="display:inline-block;padding:12px 32px;background-color:#3b82f6;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Quotation</a>
    </div>

    <p style="margin:24px 0 0;font-size:14px;color:#0f172a;font-weight:600;">Best regards,<br>The {{ config('demo.brand_name') }} Team</p>
@endsection

