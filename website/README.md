# Agent Hub website (landing)

Self-contained marketing site for Agent Hub. This folder has **no imports** from `agent-hub/src` (`@/…`). You can copy `website/` into its own repository or Next.js app with minimal changes.

## Contents

| Path                         | Purpose                                                |
| ---------------------------- | ------------------------------------------------------ |
| `src/LandingPage.tsx`        | Home page composition                                  |
| `src/AboutPage.tsx`          | About page                                             |
| `src/PrivacyPage.tsx`        | Privacy policy page                                    |
| `src/TermsPage.tsx`          | Terms of use page                                      |
| `src/content/agents.ts`      | Copy + media URLs for the three active agents          |
| `src/content/about.ts`       | About page copy                                        |
| `src/content/privacy.ts`     | Privacy policy sections                                |
| `src/content/terms.ts`       | Terms of use sections                                  |
| `src/components/`            | Shell, header, footer, hero, legal layout, agent UI    |
| `public/media/`              | Screenshots and demo videos (canonical asset location) |

## Public routes (embedded app)

| Route      | App shell                         | Website component   |
| ---------- | --------------------------------- | ------------------- |
| `/`        | `src/app/page.tsx`                | `LandingPage`       |
| `/about`   | `src/app/about/page.tsx`          | `AboutPage`         |
| `/privacy` | `src/app/privacy/page.tsx`        | `PrivacyPage`       |
| `/terms`   | `src/app/terms/page.tsx`          | `TermsPage`         |

All marketing pages use `MarketingShell` (header + footer). The host app resolves `productEnabled` and `isAuthenticated` via `getMarketingPageProps()` in `src/lib/marketing-page-props.ts`.

When `NEXT_PUBLIC_PRODUCT_ENABLED=false`, middleware still allows `/`, `/about`, `/privacy`, and `/terms` (plus `/api/health`).

## Integration (current repo)

The main app imports this module via the `@website/*` path alias and renders it from the app routes above.

Static files under `public/media/` are synced into `agent-hub/public/media/` before build:

```bash
npm run sync-website-public
```

## Media assets

Each agent uses:

- `hero.png` - primary screenshot
- `screen-*.png` - gallery thumbnails
- `demo.webm` - short walkthrough (optional `demo.mp4` if ffmpeg converts during capture)

Replace files under `website/public/media/{agent-id}/` and re-run the sync script.

To recapture from a running dev server:

```bash
npm run dev
npm run capture-landing-media
```

## Standalone extraction

1. Copy this `website/` folder.
2. Add `react`, `react-dom`, `next`, `lucide-react`, and Tailwind with the same `brand-*` colors as Agent Hub (see root `tailwind.config.ts`).
3. Copy relevant utilities from `src/app/globals.css` (`brand-gradient`, `btn-primary`, `btn-secondary`, mesh background) or inline equivalent styles.
4. Serve `public/media` from your app’s `public/` directory.
5. Mount marketing pages on `/`, `/about`, `/privacy`, and `/terms` with the same props as the host app.

## Environment (when embedded)

The host app passes:

- `productEnabled` - from `NEXT_PUBLIC_PRODUCT_ENABLED`
- `isAuthenticated` - from Supabase session on the server

When `productEnabled` is false, login/signup CTAs are hidden and the host middleware blocks product routes except marketing pages listed above.
