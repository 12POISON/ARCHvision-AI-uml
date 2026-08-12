import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import type { NextAuthRequest } from "next-auth";

// Edge-safe auth wrapper: uses the adapter-free config (JWT session),
// so the middleware bundle never touches Prisma.
const { auth } = NextAuth(authConfig);

export default auth((request: NextAuthRequest) => {
  if (!request.auth) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/editor/:path*", "/settings/:path*", "/projects/:path*"],
};
