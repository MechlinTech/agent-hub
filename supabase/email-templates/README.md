# Agent Hub auth email templates

Branded HTML templates for Supabase Authentication emails.

## Files

| File | Supabase template | Subject |
|------|-------------------|---------|
| `confirm-signup.html` | Confirm signup | Confirm your Agent Hub account |
| `reset-password.html` | Reset password | Reset your Agent Hub password |
| `magic-link.html` | Magic link | Sign in to Agent Hub |
| `invite-user.html` | Invite user | You are invited to Agent Hub |
| `base-layout.html` | Wrapper (header + footer) | — |

Each body file is wrapped inside `base-layout.html` at the `{{BODY}}` placeholder.

## Apply via script (recommended)

1. Create a [Supabase personal access token](https://supabase.com/dashboard/account/tokens).
2. Run from the project root:

```bash
SUPABASE_ACCESS_TOKEN=your_token SUPABASE_PROJECT_REF=aqrcuwgwwpwijgugdhrk node scripts/apply-email-templates.mjs
```

This updates:

- Site URL → `https://agenthub.mechlintech.com`
- Redirect allow list (production + local dev)
- All four email templates with branded HTML

## Apply via Dashboard (manual)

1. Open **Supabase Dashboard → Authentication → Email Templates**.
2. For each template, set the subject from the table above.
3. Paste the combined HTML (base layout + body) into the message body.

## App configuration

Set in your hosting provider (Vercel, etc.):

```
NEXT_PUBLIC_SITE_URL=https://agenthub.mechlintech.com
```

For local development only:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3040
```

Auth signup/resend flows use `NEXT_PUBLIC_SITE_URL` for confirmation links, not `window.location.origin`.
