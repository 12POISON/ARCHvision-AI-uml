import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { authConfig as edgeSafeConfig } from "@/lib/auth.config";

/**
 * Server-only NextAuth bundle: the Prisma adapter persists durable
 * User/Account rows on OAuth sign-in. Session strategy stays JWT: the jwt
 * callback copies the real DB user id (created by the adapter) into the
 * token, so session.user.id === repository userId.
 *
 * NOT for edge runtimes (middleware) — those use the adapter-free config.
 */
export const authConfig: NextAuthConfig = {
  ...edgeSafeConfig,
  adapter: PrismaAdapter(db),
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
