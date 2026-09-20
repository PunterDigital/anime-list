<x-mail::message>
# New contact form message

**From:** {{ $contactMessage->name }} &lt;{{ $contactMessage->email }}&gt;
@if ($contactMessage->user)

**Account:** {{ $contactMessage->user->username }} (user #{{ $contactMessage->user->id }})
@else

**Account:** not signed in
@endif

**Subject:** {{ $contactMessage->subject }}

---

{{ $contactMessage->message }}

---

Sent {{ $contactMessage->created_at?->toDayDateTimeString() }} UTC from {{ $contactMessage->ip_address ?? 'unknown IP' }}.
Reply to this email to answer the sender directly.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
