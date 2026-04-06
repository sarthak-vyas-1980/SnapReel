import "dotenv/config";
import { Worker } from "bullmq";
import { processJob } from "./processor";
import { logger } from "./utils/logger";

const connection = {
  host: process.env.UPSTASH_REDIS_REST_URL ? new URL(process.env.UPSTASH_REDIS_REST_URL).hostname : process.env.REDIS_HOST,
  port: process.env.UPSTASH_REDIS_REST_URL ? 6379 : Number(process.env.REDIS_PORT),
  password: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_PASSWORD,
  tls: process.env.UPSTASH_REDIS_REST_URL ? {} : undefined,
  maxRetriesPerRequest: null,
};

const worker = new Worker(
  "reel-processing",
  async (job) => {
    logger.info(`🎯 Received job ${job.id} for Video ${job.data.videoId}`);
    return processJob(job);
  },
  { 
    connection,
    concurrency: 1,
  }
);

worker.on("ready", () => {
  logger.success("🚀 SnapReel Production Worker is ready for jobs!");
});

worker.on("completed", (job) => {
  logger.success(`✅ Job ${job?.id} completed successfully.`);
});

worker.on("failed", (job, err) => {
  logger.error(`❌ Job ${job?.id} failed ultimately: ${err.message}`);
});

worker.on("error", (err) => {
  logger.error(`💀 Worker connection error: ${err.message}`);
});
