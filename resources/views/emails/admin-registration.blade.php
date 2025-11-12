@extends('emails.layout')

@section('content')
    <p style="margin:0 0 18px;font-size:14px;color:#64748b;">Hello Team,</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.4;color:#0f172a;">New partner registration received</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        A new organisation has completed the onboarding form and is pending KYC validation.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
            <td style="padding:10px 12px;background-color:#f8fafc;border:1px solid #e2e8f0;font-size:14px;color:#475569;width:35%;font-weight:600;">Name</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{ $user->name }}</td>
        </tr>
        <tr>
            <td style="padding:10px 12px;background-color:#f8fafc;border:1px solid #e2e8f0;font-size:14px;color:#475569;font-weight:600;">Email</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{ $user->email }}</td>
        </tr>
        <tr>
            <td style="padding:10px 12px;background-color:#f8fafc;border:1px solid #e2e8f0;font-size:14px;color:#475569;font-weight:600;">Phone</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{ $user->phone ?? 'n/a' }}</td>
        </tr>
        <tr>
            <td style="padding:10px 12px;background-color:#f8fafc;border:1px solid #e2e8f0;font-size:14px;color:#475569;font-weight:600;">User Type</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{ ucfirst(str_replace('-', ' ', $user->type)) }}</td>
        </tr>
    </table>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">
        Visit the admin portal &rsaquo; Users to review and approve their KYC dossier.
    </p>
    <p style="margin:0;font-size:14px;color:#0f172a;font-weight:600;">Elvee Automations</p>
@endsection
