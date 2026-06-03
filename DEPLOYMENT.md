# Production Deployment Guide

## Supabase configuration

### 1. Authentication URLs

In **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Value |
|---------|--------|
| Site URL | `https://your-production-domain.com` |
| Redirect URLs | `https://your-production-domain.com/auth/callback` |

For local dev, also add:

- `http://localhost:3000/auth/callback`

### 2. Email (recommended for production)

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
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

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
