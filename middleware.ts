import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/login", "/unauthorized", "/forgot-password", "/reset-password", "/portal", "/guide"];
const supabaseConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!supabaseConfigured) {
    return NextResponse.next();
  }

  // @supabase/ssr stores the session in cookies named sb-<project-ref>-auth-token
  // Also check legacy sb-access-token for backwards compatibility
  const cookieNames = request.cookies.getAll().map(c => c.name);
  const hasAuthCookie = cookieNames.includes("sb-access-token") ||
    cookieNames.some(k => k.startsWith("sb-") && k.includes("auth-token"));
  if (!hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons).*)"]
};
