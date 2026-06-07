import { z } from "zod"

const server = z.object({
  DATABASE_URL:                z.string().url(),
  AUTH_SECRET:                 z.string().min(32),
  AUTH_GOOGLE_ID:              z.string().min(1),
  AUTH_GOOGLE_SECRET:          z.string().min(1),
  UPSTASH_REDIS_REST_URL:      z.string().url(),
  UPSTASH_REDIS_REST_TOKEN:    z.string().min(1),
  UPSTASH_VECTOR_REST_URL:     z.string().url(),
  UPSTASH_VECTOR_REST_TOKEN:   z.string().min(1),
  QSTASH_TOKEN:                z.string().min(1),
  QSTASH_CURRENT_SIGNING_KEY:  z.string().min(1),
  QSTASH_NEXT_SIGNING_KEY:     z.string().min(1),
  RESEND_API_KEY:              z.string().startsWith("re_"),
  POLAR_ACCESS_TOKEN:          z.string().min(1),
  POLAR_WEBHOOK_SECRET:        z.string().startsWith("polar_whs_"),
  POLAR_PRODUCT_ID_STARTER:    z.string().uuid(),
  POLAR_PRODUCT_ID_GROWTH:     z.string().uuid(),
  POLAR_PRODUCT_ID_ENTERPRISE: z.string().uuid(),
  INFERENCE_API_SECRET:        z.string().min(32),
  INFERENCE_SERVICE_URL:       z.string().url(),
  NODE_ENV:                    z.enum(["development", "test", "production"]),
})

const client = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const env = {
  ...server.parse(process.env),
  ...client.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  }),
}

export type Env = typeof env
