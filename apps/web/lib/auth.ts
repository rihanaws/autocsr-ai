import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
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
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: "AutoCSR <noreply@techsci.co>",
    }),
  ],
  events: {
    async createUser({ user }) {
      // Auto-provision a Tenant for every new sign-up
      if (!user.id || !user.email) return;
      const slug = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
      await db.tenant.create({
        data: {
          userId: user.id,
          name: user.name ?? user.email,
          slug: `${slug}-${user.id.slice(-6)}`,
        },
      });
    },
  },
  callbacks: {
    async session({ session, user }) {
      const tenant = await db.tenant.findUnique({
        where: { userId: user.id },
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
