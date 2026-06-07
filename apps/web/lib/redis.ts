import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
