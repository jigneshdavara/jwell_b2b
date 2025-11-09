<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $subject ?? config('demo.brand_name') }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:'Helvetica Neue',Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb;padding:32px 0;">
    <tr>
        <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.12);">
                <tr>
                    <td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 40px;">
                        <table width="100%">
                            <tr>
                                <td align="left" style="font-size:20px;font-weight:600;color:#ffffff;letter-spacing:0.08em;text-transform:uppercase;">
                                    {{ config('demo.brand_name') }}
                                </td>
                                <td align="right" style="color:rgba(255,255,255,0.7);font-size:13px;">
                                    {{ now()->format('d M Y') }}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding:40px 48px;">
                        @yield('content')
                    </td>
                </tr>
                <tr>
                    <td style="padding:24px 48px;background-color:#0f172a;color:#e2e8f0;font-size:13px;">
                        <p style="margin:0 0 8px;font-weight:600;color:#f8fafc;">Need assistance?</p>
                        <p style="margin:0;color:#cbd5f5;">Reach our concierge desk at <a href="mailto:support@aurumcraft.test" style="color:#38bdf8;text-decoration:none;">support@aurumcraft.test</a> or call +91 22 4000 1234.</p>
                    </td>
                </tr>
            </table>
            <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">© {{ now()->year }} {{ config('demo.brand_name') }}. All rights reserved.</p>
        </td>
    </tr>
</table>
</body>
</html>
