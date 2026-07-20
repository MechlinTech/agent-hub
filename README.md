# Agent Hub

Production-ready web app for **JMeter Script Review** before BlazeMeter execution.

## Features

| Area | Details |
|------|---------|
| Auth | Sign up, login, email verification, protected routes |
| Storage | Supabase `script-assets` bucket, per-user paths, signed downloads |
| Review engine | 20 rules, weighted scoring, built-in templates + optional OpenAI enhancement |
| Exports | Markdown, HTML, JSON download + PDF via print |
| UI | Dashboard, New Review, Analyzing, Results, Findings, Report, History, Test Assets, Settings |

## Quick start

```bash
cp .env.local.example .env.local
# Edit with Supabase URL + anon key
npm install
npm run dev
```

Open http://localhost:3040 → landing page → **Sign up** → **New Review** → upload `public/sample-checkout.jmx`.

Landing assets live in `website/public/` and sync to `public/` on `npm run dev` / `npm run build`. Recapture with `npm run capture-landing-media` (requires `CAPTURE_EMAIL` / `CAPTURE_PASSWORD` and a running dev server).

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon/public key |
| `NEXT_PUBLIC_SITE_URL` | Prod | Used for auth redirects |
| `NEXT_PUBLIC_PRODUCT_ENABLED` | No | Default `true`. Set `false` for landing-only mode (disables login, signup, and app routes) |
| `OPENAI_API_KEY` | For AI mode | OpenAI API key (server-only) |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |
| `GEMINI_API_KEY` | For AI mode | Google Gemini API key |
| `GEMINI_MODEL` | No | Default `gemini-2.0-flash` |
| `GROQ_API_KEY` | For AI mode | Groq API key |
| `GROQ_MODEL` | No | Default `llama-3.3-70b-versatile` |
| `AI_PROVIDER` | No | `openai`, `gemini`, `groq`, or `auto` (default) |

## Production deploy

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for Supabase auth URLs, storage, Vercel, and smoke tests.

```bash
npm run build
npm run start
```

Health: `GET /api/health`

## Mobile & PWA

The app is mobile-responsive with a slide-out navigation menu on small screens. To install as a PWA:

1. Deploy over **HTTPS** (required for service workers)
2. Run `npm run build && npm start` (PWA is enabled in production builds only)
3. On mobile: **Add to Home Screen** (iOS Safari) or **Install app** (Chrome/Android)

The manifest and service worker are generated automatically via `@ducanh2912/next-pwa`.

## AI Recommendation Mode

**Disabled by default.** Rules + built-in templates always run first.

To enable AI enhancements:

1. Add **at least one** API key to `.env.local`: `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `GROQ_API_KEY`
2. Restart the dev server (`npm run dev`) so env vars load
3. Open **Settings** → enable **AI Recommendation Mode**, or override per review on **New Review**

Optional: set `AI_PROVIDER=openai|gemini|groq` to force a provider when multiple keys are set.

If AI is enabled but the API key is missing or the call fails, findings fall back to built-in templates.

## Project structure

```
website/            # Extractable landing page (see website/README.md)
src/
  app/              # Routes (auth, dashboard, agents, landing shell at page.tsx)
  components/       # Layout, exports, test assets
  lib/
    jmx/            # Parser, rules, scoring, templates
    reports/        # Markdown/HTML/JSON generators
    review-service.ts
    storage.ts
```

## Supabase project

Connected to project `aqrcuwgwwpwijgugdhrk` (jmxagent). Schema includes:

- `profiles`, `user_settings`, `script_reviews`, `review_findings`
- `test_assets`, `report_exports`, `review_activity_logs`
- Storage bucket `script-assets` with RLS

## License

Private. Mechlin / performance engineering use.
