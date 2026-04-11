import "dotenv/config";
import { prisma } from "../lib/prisma";
import { processJob } from "./processor";
import { logger } from "./utils/logger";

const POLL_INTERVAL = 5000; // Check for new jobs every 5 seconds

async function pollForJobs() {
  try {
    // Find the oldest queued job
    const job = await prisma.video.findFirst({
      where: { status: "queued" },
      orderBy: { createdAt: "asc" },
    });

    if (!job) return;

    // Mark as processing immediately to prevent double-pickup
    // The where clause acts as an optimistic lock — if another worker
    // already claimed it, this update will match 0 rows silently.
    const claimed = await prisma.video.updateMany({
      where: { id: job.id, status: "queued" },
      data: { status: "processing", progress: 0 },
    });

    if (claimed.count === 0) return; // Another worker claimed it

    logger.info(`🎯 Picked up job for Video ${job.id}`);
    await processJob(job.id);

  } catch (err: any) {
    logger.error(`💀 Poll cycle error: ${err.message}`);
  }
}

async function main() {
  logger.success("🚀 SnapReel Production Worker is ready for jobs!");

  // Poll forever
  while (true) {
    await pollForJobs();
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
}

main().catch(err => {
  logger.error(`Fatal worker error: ${err.message}`);
  process.exit(1);
});
