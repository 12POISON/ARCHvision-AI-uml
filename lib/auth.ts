import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "demo",
    name: "Demo Access",
    credentials: {},
    async authorize() {
      return {
        id: "demo-user",
        name: "Demo Explorer",
        email: "demo@archvision.ai",
        image: null,
      };
    },
  }),
];

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

export const authConfig: NextAuthConfig = {
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = (token.userId as string) ?? session.user.id;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "archvision-dev-secret-change-me",
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);