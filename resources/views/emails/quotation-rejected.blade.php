@extends('emails.layout')

@section('content')
    <p style="margin:0 0 18px;font-size:14px;color:#64748b;">Hi {{ $quotation->user->name }},</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.4;color:#0f172a;">Quotation Update</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        We regret to inform you that we are unable to proceed with your quotation request for <strong>{{ $quotation->product->name }}</strong> at this time.
    </p>
    
    <div style="background-color:#fef2f2;border-left:4px solid #ef4444;padding:20px;margin:24px 0;border-radius:8px;">
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
        </table>
    </div>

    @if($reason || $quotation->admin_notes)
    <div style="background-color:#fff7ed;border-left:4px solid #f59e0b;padding:20px;margin:24px 0;border-radius:8px;">
        <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">Reason</p>
        <p style="margin:8px 0 0;font-size:13px;color:#78350f;line-height:1.6;">
            {{ $reason ?? $quotation->admin_notes ?? 'Please contact our team for more details.' }}
        </p>
    </div>
    @endif

    <p style="margin:24px 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        If you have any questions or would like to discuss alternative options, please don't hesitate to reach out to our team. We're here to help you find the perfect solution.
    </p>
    
    <div style="margin:24px 0;text-align:center;">
        <a href="{{ route('frontend.quotations.index') }}" style="display:inline-block;padding:12px 32px;background-color:#3b82f6;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Quotation</a>
    </div>

    <p style="margin:24px 0 0;font-size:14px;color:#0f172a;font-weight:600;">Best regards,<br>The {{ config('demo.brand_name') }} Team</p>
@endsection

