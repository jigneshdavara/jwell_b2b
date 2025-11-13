@extends('emails.layout')

@section('content')
    <p style="margin:0 0 18px;font-size:14px;color:#64748b;">Hello Admin Team,</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.4;color:#0f172a;">New Quotation Request Received</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        A new quotation request has been submitted and requires your review.
    </p>
    
    <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:20px;margin:24px 0;border-radius:8px;">
        <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">Quotation Information</h2>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;width:40%;">Quotation ID</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;font-weight:600;">#{{ $quotation->id }}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Customer</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $quotation->user->name }} ({{ $quotation->user->email }})</td>
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
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Mode</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">
                    <span style="display:inline-block;padding:4px 12px;background-color:{{ $quotation->mode === 'jobwork' ? '#dbeafe' : '#f3e8ff' }};color:{{ $quotation->mode === 'jobwork' ? '#1e40af' : '#6b21a8' }};border-radius:4px;font-weight:600;font-size:12px;">
                        {{ $quotation->mode === 'jobwork' ? 'Jobwork' : 'Jewellery Purchase' }}
                    </span>
                </td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Quantity</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $quotation->quantity }}</td>
            </tr>
            @if($quotation->notes)
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Customer Notes</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $quotation->notes }}</td>
            </tr>
            @endif
            <tr>
                <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;">Submitted</td>
                <td style="padding:8px 0;font-size:13px;color:#0f172a;">{{ $quotation->created_at->format('d M Y, h:i A') }}</td>
            </tr>
        </table>
    </div>

    <p style="margin:24px 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        Please review this quotation and respond to the customer within 24-48 hours.
    </p>
    
    <div style="margin:24px 0;text-align:center;">
        <a href="{{ route('admin.quotations.show', $quotation->id) }}" style="display:inline-block;padding:12px 32px;background-color:#3b82f6;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Review Quotation</a>
    </div>

    <p style="margin:24px 0 0;font-size:14px;color:#0f172a;font-weight:600;">Best regards,<br>{{ config('demo.brand_name') }} System</p>
@endsection

