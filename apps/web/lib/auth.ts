import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { db } from "@/lib/db";
import { resend } from "@/lib/resend";
import { env } from "@/lib/env";
import WelcomeEmail from "@/emails/welcome";
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
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: "AutoCSR <noreply@techsci.co>",
    }),
  ],
  events: {
    async createUser({ user }) {
      // Auto-provision a Tenant for every new sign-up
      if (!user.id || !user.email) return;
      const slug = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
      const tenant = await db.tenant.create({
        data: {
          userId: user.id,
          name: user.name ?? user.email,
          slug: `${slug}-${user.id.slice(-6)}`,
        },
      });

      try {
        const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard`;
        await resend.emails.send({
          from: "AutoCSR <noreply@techsci.co>",
          to: user.email,
          subject: "Welcome to AutoCSR — your pilot is ready",
          react: WelcomeEmail({ tenantName: tenant.name, dashboardUrl }),
        });
      } catch {
        // email failure must not block user creation
      }
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
  secret: env.AUTH_SECRET,
});
