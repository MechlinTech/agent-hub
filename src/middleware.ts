import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProductEnabled } from "@/lib/product-enabled";

const authPublicRoutes = [
  "/login",
  "/signup",
  "/auth/callback",
  "/verify-email",
];

const marketingRoutes = ["/", "/about", "/privacy", "/terms"];

function isMarketingRoute(path: string): boolean {
  return marketingRoutes.some((route) => (route === "/" ? path === "/" : path === route));
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const productEnabled = isProductEnabled();

  if (!productEnabled) {
    if (isMarketingRoute(path) || path.startsWith("/api/health")) {
      return NextResponse.next();
    }
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Product disabled" }, { status: 503 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPublic = authPublicRoutes.some((r) => path.startsWith(r));
  const isMarketing = isMarketingRoute(path);

  if (!user && !isAuthPublic && !isMarketing) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (user && !user.email_confirmed_at && path !== "/verify-email" && !path.startsWith("/auth/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/verify-email";
    return NextResponse.redirect(url);
  }

  if (user?.email_confirmed_at && path === "/verify-email") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp4|ico|js|json|webmanifest|css|woff2?)$).*)",
  ],
};
