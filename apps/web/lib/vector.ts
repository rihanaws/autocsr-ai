import { Index } from "@upstash/vector";

const globalForVector = globalThis as unknown as { vector: Index };

export const vector =
  globalForVector.vector ??
  new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
  });

if (process.env.NODE_ENV !== "production") {
  globalForVector.vector = vector;
}
