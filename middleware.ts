import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { NextAuthRequest } from "next-auth";

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