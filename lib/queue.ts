import { Queue } from "bullmq"

export const reelQueue = new Queue("reel-processing", {
  connection: {
    host: process.env.UPSTASH_REDIS_REST_URL ? new URL(process.env.UPSTASH_REDIS_REST_URL).hostname : (process.env.REDIS_HOST || "127.0.0.1"),
    port: process.env.UPSTASH_REDIS_REST_URL ? 6379 : (Number(process.env.REDIS_PORT) || 6379),
    password: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_PASSWORD,
    tls: process.env.UPSTASH_REDIS_REST_URL ? {} : undefined,
  },
})
