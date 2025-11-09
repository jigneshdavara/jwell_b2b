@component('mail::message')
# Your login code

Use the code below to finish signing in to {{ $brand }}.

@component('mail::panel')
**{{ $code }}**
@endcomponent

This code expires in {{ $expiresIn }}. If you did not request this code, you can ignore this email.

Thanks,<br>
{{ $brand }} Team
@endcomponent
