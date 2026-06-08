/**
 * Idempotent OKBET tenant bootstrap.
 *
 * Finds the first tenant with slug starting "okbet" and promotes it to GROWTH.
 * The Tenant model requires a userId FK — cannot create without an existing User.
 * Run after the OKBET admin has signed up at /signup.
 *
 * Usage: bun run setup:okbet
 */
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Required for neon serverless driver in Node/Bun scripts (not Edge/Next.js)
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const existing = await db.tenant.findFirst({
    where: { slug: { startsWith: "okbet" } },
  });

  if (!existing) {
    console.log(
      "⚠️  No tenant with slug starting 'okbet' found.\n" +
      "   Have the OKBET admin sign up at /signup first — a tenant is auto-provisioned on first login.\n" +
      "   Then re-run this script to promote them to GROWTH tier."
    );
    process.exit(0);
  }

  const tenant = await db.tenant.update({
    where: { id: existing.id },
    data: {
      name: "OKBET (Gavin Ventures, Inc.)",
      tier: "GROWTH",
      authorizedIps: ["153.53.253.81", "89.117.176.115", "103.170.173.26"],
    },
  });

  console.log("✅ OKBET tenant:", tenant.id, "| slug:", tenant.slug, "| tier:", tenant.tier);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
