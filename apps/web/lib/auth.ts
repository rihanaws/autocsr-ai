import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import type { Tier } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      tenantId: string;
      tier: Tier;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: implement credential auth with password hashing
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      const tenant = await db.tenant.findFirst({
        where: { id: user.id },
        select: { id: true, tier: true },
      });

      session.user.id = user.id;
      session.user.tenantId = tenant?.id ?? "";
      session.user.tier = tenant?.tier ?? "FREE";

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "database" },
  secret: process.env.AUTH_SECRET,
});
