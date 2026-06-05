import { NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { db } from "@/lib/db";
import type { Tier } from "@prisma/client";

export const runtime = "nodejs";

const PRODUCT_TIER_MAP: Record<string, Tier> = {
  [process.env.POLAR_PRODUCT_ID_STARTER ?? ""]: "STARTER",
  [process.env.POLAR_PRODUCT_ID_GROWTH ?? ""]: "GROWTH",
  [process.env.POLAR_PRODUCT_ID_ENTERPRISE ?? ""]: "ENTERPRISE",
};

function tierFromProductId(productId: string | undefined): Tier {
  if (!productId) return "FREE";
  return PRODUCT_TIER_MAP[productId] ?? "FREE";
}

export async function POST(req: Request): Promise<NextResponse> {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(rawBody, headers, webhookSecret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    return NextResponse.json({ error: "Webhook parse error" }, { status: 400 });
  }

  console.log('[Polar Sandbox]', event.type, JSON.stringify((event as { data: unknown }).data, null, 2))

  try {
    switch (event.type) {
      case "subscription.created":
      case "subscription.active":
      case "subscription.updated":
      case "subscription.uncanceled": {
        const sub = event.data;
        const externalId = (sub.customer as { externalId?: string | null } | null)?.externalId;
        const polarCustomerId = sub.customerId;
        const productId = sub.productId;
        const tier = tierFromProductId(productId);

        if (externalId) {
          // externalId = tenantId set during checkout
          await db.tenant.updateMany({
            where: { id: externalId },
            data: { tier, stripeCustomerId: polarCustomerId, stripeSubId: sub.id },
          });
        } else {
          // fallback: match by stored Polar customer ID
          await db.tenant.updateMany({
            where: { stripeCustomerId: polarCustomerId },
            data: { tier, stripeSubId: sub.id },
          });
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.revoked": {
        const sub = event.data;
        const externalId = (sub.customer as { externalId?: string | null } | null)?.externalId;
        if (externalId) {
          await db.tenant.updateMany({
            where: { id: externalId },
            data: { tier: "FREE" },
          });
        } else {
          await db.tenant.updateMany({
            where: { stripeSubId: sub.id },
            data: { tier: "FREE" },
          });
        }
        break;
      }

      default:
        // Unhandled event types — acknowledge receipt
        break;
    }
  } catch {
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
