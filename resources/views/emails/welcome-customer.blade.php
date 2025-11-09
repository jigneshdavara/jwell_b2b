@extends('emails.layout')

@section('content')
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Hi {{ $user->name }},</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.4;color:#0f172a;">Welcome to {{ config('demo.brand_name') }}</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#475569;">
        Thank you for joining our B2B jewellery ecosystem. Your account is now active and ready for catalogue access,
        live bullion-linked pricing, and collaborative jobwork workflows. Our onboarding team will review your KYC
        details and reach out if additional information is required.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#475569;">
        To get started quickly:
    </p>
    <ul style="margin:0 0 20px 20px;padding:0;color:#475569;font-size:15px;line-height:1.6;">
        <li>Browse curated Indian fine jewellery collections tailored for retailers and wholesalers.</li>
        <li>Lock live metal rates before confirming cart checkouts.</li>
        <li>Submit jobwork or custom manufacturing briefs with digital references.</li>
    </ul>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475569;">
        If you need any assistance, just reply to this email—our concierge desk is on standby.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#0f172a;font-weight:600;">Warm regards,<br>The AurumCraft Partnerships Team</p>
@endsection
