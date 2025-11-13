@extends('emails.layout')

@section('content')
    <p style="margin:0 0 18px;font-size:14px;color:#64748b;">Hi {{ $quotation->user->name }},</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.4;color:#0f172a;">Action Required: Review Updated Quotation</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        Our team has updated your quotation for <strong>{{ $quotation->product->name }}</strong> with revised details. Please review and confirm to proceed.
    </p>
    
    <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:20px;margin:24px 0;border-radius:8px;">
        <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">⚠️ Your Confirmation Required</p>
        <p style="margin:8px 0 0;font-size:13px;color:#78350f;line-height:1.6;">
            We've made some updates to your quotation based on current availability and pricing. Please review the changes and confirm if you'd like to proceed.
        </p>
    </div>

    <div style="background-color:#f8fafc;border-left:4px solid #3b82f6;padding:20px;margin:24px 0;border-radius:8px;">
        <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">Updated Quotation Details</h2>
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
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Quantity</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $quotation->quantity }}</td>
            </tr>
            @if($quotation->admin_notes)
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Admin Notes</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $quotation->admin_notes }}</td>
            </tr>
            @endif
            @if($message)
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Message</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $message }}</td>
            </tr>
            @endif
        </table>
    </div>

    <p style="margin:24px 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        Please log in to your dashboard to review the updated quotation details and confirm or decline the changes.
    </p>
    
    <div style="margin:24px 0;text-align:center;">
        <a href="{{ route('frontend.quotations.index') }}" style="display:inline-block;padding:12px 32px;background-color:#f59e0b;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Review & Confirm</a>
    </div>

    <p style="margin:24px 0 0;font-size:14px;color:#0f172a;font-weight:600;">Best regards,<br>The {{ config('demo.brand_name') }} Team</p>
@endsection

