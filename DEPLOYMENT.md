# Production Deployment Guide

## Supabase configuration

### 1. Authentication URLs

In **Supabase Dashboard → Authentication → URL Configuration**:

| Setting       | Value                                            |
| ------------- | ------------------------------------------------ |
| Site URL      | `https://agenthub.mechlintech.com`               |
| Redirect URLs | `https://agenthub.mechlintech.com/auth/callback` |

For local dev, also add:

- `http://localhost:3040/auth/callback`

### 2. Email templates

Professional HTML templates live in `supabase/email-templates/`. Apply them in either of these ways:

**Option A - Dashboard (manual)**  
Authentication → Email Templates → paste each template body and subject from the files:

| Template       | Subject                        | Body file                                            |
| -------------- | ------------------------------ | ---------------------------------------------------- |
| Confirm signup | Confirm your Agent Hub account | `confirm-signup.html` (wrap with `base-layout.html`) |
| Reset password | Reset your Agent Hub password  | `reset-password.html`                                |
| Magic link     | Sign in to Agent Hub           | `magic-link.html`                                    |
| Invite user    | You are invited to Agent Hub   | `invite-user.html`                                   |

**Option B - Management API (automated)**

```bash
SUPABASE_ACCESS_TOKEN=your_pat SUPABASE_PROJECT_REF=aqrcuwgwwpwijgugdhrk node scripts/apply-email-templates.mjs
```

This also sets Site URL and redirect allow list to `agenthub.mechlintech.com`.

### 3. Email provider (recommended for production)

- Enable **Confirm email** under Authentication → Providers → Email
- Configure SMTP (Authentication → Email Templates → SMTP) or use Supabase built-in mail
- Users land on `/verify-email` until confirmed

### 3. Storage

Bucket `script-assets` is created via migration with RLS:

- Path pattern: `{user_id}/{review_id}/{filename}`
- Private bucket; downloads use signed URLs

### 4. Environment variables

Set in Vercel / your host:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://agenthub.mechlintech.com
NEXT_PUBLIC_PRODUCT_ENABLED=true
```

Set `NEXT_PUBLIC_PRODUCT_ENABLED=false` to serve only the public landing page at `/` (login, signup, dashboard, and APIs except `/api/health` are disabled).

## Landing page

- Public URL: `/` on your site host (e.g. `https://agenthub.mechlintech.com/`)
- Extractable module: `website/` (see `website/README.md`)
- Smoke test with product enabled: `/` → Sign up → `/dashboard`
- Smoke test with product disabled: `/` loads; `/login` redirects to `/`; `GET /api/health` OK; other `/api/*` returns 503

## Deploy to Vercel

```bash
npm install -g vercel
vercel link
vercel env pull
# Add env vars in Vercel dashboard
vercel --prod
```

## Health check

`GET /api/health` returns service status for load balancers and monitoring.

## Security checklist

- [x] RLS on all tables
- [x] Storage policies per user folder
- [x] Auth middleware on app routes
- [x] Security headers (next.config)
- [x] No service role key in client
- [x] AI mode disabled by default (no external API keys)

## Post-deploy smoke test

1. Sign up → confirm email (if enabled)
2. New Review → upload `public/sample-checkout.jmx`
3. Wait for analysis → Results + Export Markdown
4. Test Assets → download JMX from storage
5. Settings → confirm AI mode disabled
