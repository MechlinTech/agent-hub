const DEFAULT_SITE_URL = "http://localhost:3040";

/** Canonical app URL used for auth email links and post-login redirects. */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url) return DEFAULT_SITE_URL;
  return url.replace(/\/$/, "");
}

/** Supabase auth callback URL (must be allowlisted in Supabase Auth settings). */
export function getAuthCallbackUrl(next = "/dashboard"): string {
  const nextPath = next.startsWith("/") ? next : `/${next}`;
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
