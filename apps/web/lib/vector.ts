import { Index } from "@upstash/vector";
import { env } from "@/lib/env";

const globalForVector = globalThis as unknown as { vector: Index };

export const vector =
  globalForVector.vector ??
  new Index({
    url: env.UPSTASH_VECTOR_REST_URL,
    token: env.UPSTASH_VECTOR_REST_TOKEN,
  });

if (env.NODE_ENV !== "production") {
  globalForVector.vector = vector;
}
