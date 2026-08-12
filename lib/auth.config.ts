import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const oauthConfigured = Boolean(
  (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) ||
    (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
);

/**
 * Demo provider: zero-config evaluation identity. Always available in dev;
 * in production it is disabled once real OAuth is configured, so a real
 * deployment can never silently share the demo workspace.
 */
const demoDisabled = process.env.NODE_ENV === "production" && oauthConfigured;

const providers: NextAuthConfig["providers"] = [];
if (!demoDisabled) {
  providers.push(
    Credentials({
      id: "demo",
      name: "Demo Access",
      credentials: {},
      async authorize() {
        // Shared demo identity — exists as a real User row via ensureSeeded().
        return {
          id: "demo-user",
          name: "Demo Explorer",
          email: "demo@archvision.ai",
          image: null,
        };
      },
    })
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET must be set in production. Generate one with: openssl rand -base64 32");
}

/**
 * Edge-safe NextAuth config (no Prisma/database imports) so the auth wrapper
 * can run in middleware. The server bundle (lib/auth.ts) adds the Prisma
 * adapter on top for durable User/Account rows.
 */
export const authConfig: NextAuthConfig = {
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // user.id is the durable DB user id (adapter-created for OAuth, or the
      // demo identity). Never hardcode DEMO_USER_ID downstream — it flows here.
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};
