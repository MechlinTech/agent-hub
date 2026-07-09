const DEFAULT_SITE_URL = "http://localhost:3040";

/** Canonical app URL used for auth email links and post-login redirects. */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url) return DEFAULT_SITE_URL;
  return url.replace(/\/$/, "");
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Public origin for server-side redirects behind a reverse proxy. */
export function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost.split(",")[0].trim()}`;
  }

  const requestOrigin = new URL(request.url).origin;
  const siteUrl = getSiteUrl();

  // Proxy passed loopback but app is configured for a public URL.
  if (isLoopbackOrigin(requestOrigin) && !isLoopbackOrigin(siteUrl)) {
    return siteUrl;
  }

  return requestOrigin;
}

/** Supabase auth callback URL (must be allowlisted in Supabase Auth settings). */
export function getAuthCallbackUrl(next = "/dashboard", origin?: string): string {
  const nextPath = next.startsWith("/") ? next : `/${next}`;
  const base = (origin ?? getSiteUrl()).replace(/\/$/, "");
  return `${base}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
