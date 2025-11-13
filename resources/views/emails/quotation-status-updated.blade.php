@extends('emails.layout')

@section('content')
    <p style="margin:0 0 18px;font-size:14px;color:#64748b;">Hi {{ $quotation->user->name }},</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.4;color:#0f172a;">Quotation Status Updated</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        The status of your quotation for <strong>{{ $quotation->product->name }}</strong> has been updated.
    </p>
    
    <div style="background-color:#f0fdf4;border-left:4px solid #22c55e;padding:20px;margin:24px 0;border-radius:8px;">
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
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Previous Status</td>
                <td style="padding:8px 0;font-size:13px;color:#64748b;">{{ ucfirst(str_replace('_', ' ', $previousStatus)) }}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Current Status</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">
                    <span style="display:inline-block;padding:4px 12px;background-color:#dcfce7;color:#166534;border-radius:4px;font-weight:600;font-size:12px;">
                        {{ $statusLabel }}
                    </span>
                </td>
            </tr>
            @if($notes)
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Admin Notes</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $notes }}</td>
            </tr>
            @endif
        </table>
    </div>

    @if($quotation->status === 'pending_customer_confirmation')
    <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:20px;margin:24px 0;border-radius:8px;">
        <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">Action Required</p>
        <p style="margin:8px 0 0;font-size:13px;color:#78350f;line-height:1.6;">
            Our team has updated your quotation details. Please review and confirm the changes to proceed.
        </p>
    </div>
    @endif

    <p style="margin:24px 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        You can view the full details and respond from your quotation dashboard.
    </p>
    
    <div style="margin:24px 0;text-align:center;">
        <a href="{{ route('frontend.quotations.index') }}" style="display:inline-block;padding:12px 32px;background-color:#3b82f6;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Quotation</a>
    </div>

    <p style="margin:24px 0 0;font-size:14px;color:#0f172a;font-weight:600;">Best regards,<br>The {{ config('demo.brand_name') }} Team</p>
@endsection

