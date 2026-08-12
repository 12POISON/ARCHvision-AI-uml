import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import type { NextAuthRequest } from "next-auth";

// Edge-safe auth wrapper: uses the adapter-free config (JWT session),
// so the middleware bundle never touches Prisma.
const { auth } = NextAuth(authConfig);

// Only these prefixes require a session (matches the pre-existing behavior
// exactly). Everything else — landing, legal, 404s — stays public.
const PROTECTED_PREFIXES = ["/dashboard", "/editor", "/settings", "/projects"];

export default auth((request: NextAuthRequest) => {
  const path = request.nextUrl.pathname;

  if (PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    if (!request.auth) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  const accepts = request.headers.get("accept") ?? "";
  if (accepts.includes("text/html")) {
    // Defensive: guarantee the charset on every HTML document even if a
    // hosting layer / proxy / CDN strips or overrides the Content-Type.
    response.headers.set("Content-Type", "text/html; charset=utf-8");
  }
  return response;
});

export const config = {
  // Everything except API routes and static assets.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|json|txt|xml|woff2?|map)$).*)",
  ],
};
