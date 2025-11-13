@extends('emails.layout')

@section('content')
    <p style="margin:0 0 18px;font-size:14px;color:#64748b;">Hi {{ $quotation->user->name }},</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.4;color:#0f172a;">🎉 Your Quotation Has Been Approved!</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        Great news! Your quotation request for <strong>{{ $quotation->product->name }}</strong> has been approved by our merchandising desk.
    </p>
    
    <div style="background-color:#f0fdf4;border-left:4px solid #22c55e;padding:20px;margin:24px 0;border-radius:8px;">
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
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Mode</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">
                    {{ $quotation->mode === 'jobwork' ? 'Jobwork' : 'Jewellery Purchase' }}
                </td>
            </tr>
            @if($quotation->order)
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Order Reference</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;font-weight:600;">{{ $quotation->order->reference }}</td>
            </tr>
            @endif
            @if($quotation->admin_notes)
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Admin Notes</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $quotation->admin_notes }}</td>
            </tr>
            @endif
        </table>
    </div>

    @if($quotation->mode === 'jobwork')
    <div style="background-color:#dbeafe;border-left:4px solid #3b82f6;padding:20px;margin:24px 0;border-radius:8px;">
        <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">Jobwork Process Started</p>
        <p style="margin:8px 0 0;font-size:13px;color:#1e3a8a;line-height:1.6;">
            Your jobwork request has been approved. Our team will now proceed with the material sending process. You'll receive updates at each stage of the jobwork process.
        </p>
    </div>
    @elseif($quotation->order)
    <div style="background-color:#dbeafe;border-left:4px solid #3b82f6;padding:20px;margin:24px 0;border-radius:8px;">
        <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">Order Created</p>
        <p style="margin:8px 0 0;font-size:13px;color:#1e3a8a;line-height:1.6;">
            An order has been created from your approved quotation. You can track the production progress from your orders dashboard.
        </p>
    </div>
    @endif

    <p style="margin:24px 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        You can view the complete details and track progress from your dashboard.
    </p>
    
    <div style="margin:24px 0;text-align:center;">
        <a href="{{ route('frontend.quotations.index') }}" style="display:inline-block;padding:12px 32px;background-color:#22c55e;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Quotation</a>
    </div>

    <p style="margin:24px 0 0;font-size:14px;color:#0f172a;font-weight:600;">Best regards,<br>The {{ config('demo.brand_name') }} Team</p>
@endsection

