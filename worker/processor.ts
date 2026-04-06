import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { logger } from "./utils/logger";
import { downloadVideo, getMetadata } from "./utils/downloader";
import { processClip, generateThumbnail } from "./utils/ffmpeg_processor";
import uploadFileToSupabase from "./utils/supabase";
import getTranscript, { getTimedTranscript } from "./utils/transcript";
import { getAITimestamps } from "../lib/openrouter";
import { generateSRT, writeSRTFile } from "./utils/captions";

/** Helper to update progress in the database so the frontend can see it */
async function updateProgress(videoId: string, progress: number, status = "processing") {
  await prisma.video.update({
    where: { id: videoId },
    data: { progress, status },
  });
}

export async function processJob(job: any) {
  const { videoId } = job.data;
  const outputDir = path.join(process.cwd(), "temp");
  const sourceFile = path.join(outputDir, `${videoId}-source.mp4`);

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  try {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new Error("Video not found in database.");

    // Mark as processing immediately
    await updateProgress(videoId, 5);

    // 1. Metadata
    logger.info(`📊 Fetching metadata for Video ${videoId}...`);
    const metadata = await getMetadata(video.youtubeUrl);
    
    if (metadata.title) {
        await prisma.video.update({ where: { id: videoId }, data: { title: metadata.title.slice(0, 50) } });
    }

    // 2. Download
    await updateProgress(videoId, 15);
    logger.info(`📥 Downloading source for Video ${videoId}...`);
    await downloadVideo(video.youtubeUrl, sourceFile);
    await updateProgress(videoId, 30);

    // 3. AI Timestamps
    logger.info(`📜 Processing AI Timestamps for Video ${videoId}...`);
    const transcript = await getTranscript(video.youtubeUrl);

    const timedSegments = await getTimedTranscript(video.youtubeUrl).catch((err) => {
      logger.warn(`⚠️ Timed transcript failed for ${videoId}: ${err.message} — captions will be skipped.`);
      return [];
    });

    const aiClips = await getAITimestamps(transcript).catch((err) => {
      logger.warn(`⚠️ AI timestamps failed for ${videoId}: ${err.message} — using default clip.`);
      return [];
    });

    const clipsToProcess = aiClips.length > 0 ? aiClips : [
        { start: "00:00:10", end: "00:00:45", label: "Highlights" }
    ];

    await updateProgress(videoId, 40);

    // 4. Clip Generation
    const processedClips = [];
    const clipProgressStart = 40;
    const clipProgressEnd = 85;
    const clipProgressRange = clipProgressEnd - clipProgressStart;

    for (let i = 0; i < clipsToProcess.length; i++) {
      const clip = clipsToProcess[i];
      const clipId = `${videoId}-clip-${i + 1}`;
      const clipOutput = path.join(outputDir, `${clipId}.mp4`);

      logger.info(`🎬 Processing Clip ${i + 1}/${clipsToProcess.length}: ${clip.label}`);
      
      // SRT caption generation
      let srtPath: string | null = null;
      if (timedSegments.length > 0) {
          const srtContent = generateSRT(timedSegments, clip.start, clip.end);
          srtPath = writeSRTFile(srtContent, outputDir, clipId);
          if (srtPath) {
            logger.info(`📝 Captions generated for clip ${i + 1}`);
          } else {
            logger.warn(`⚠️ No caption segments overlap clip ${i + 1} range (${clip.start}–${clip.end})`);
          }
      } else {
          logger.warn(`⚠️ No timed segments available — clip ${i + 1} will have no captions.`);
      }

      await processClip(sourceFile, clipOutput, clip.start, clip.end, srtPath);
      const url = await uploadFileToSupabase(clipOutput, `${clipId}.mp4`, "video/mp4");
      
      processedClips.push({
        url,
        start: clip.start,
        end: clip.end,
        label: clip.label,
        hookScore: clip.hook_score || 85,
        engagementLevel: clip.engagement || "High"
      });

      if (fs.existsSync(clipOutput)) fs.unlinkSync(clipOutput);
      if (srtPath && fs.existsSync(srtPath)) fs.unlinkSync(srtPath);

      // Update progress per clip
      const clipProgress = Math.round(clipProgressStart + ((i + 1) / clipsToProcess.length) * clipProgressRange);
      await updateProgress(videoId, clipProgress);
    }

    // 5. Thumbnail & Finalize
    logger.info(`🖼 Generating thumbnail for Video ${videoId}...`);
    await updateProgress(videoId, 90);
    const thumbPath = path.join(outputDir, `${videoId}-thumb.jpg`);
    await generateThumbnail(sourceFile, thumbPath, processedClips[0].start);
    const thumbnailUrl = await uploadFileToSupabase(thumbPath, `${videoId}.jpg`, "image/jpeg");
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "completed",
        progress: 100,
        thumbnailUrl,
        clips: processedClips as any,
        reelUrl: processedClips[0].url
      }
    });

    await prisma.notification.create({
      data: {
        userId: video.userId,
        title: "Reel Ready 🎉",
        message: `Your reel "${video.title}" is generated.`,
        type: "success"
      }
    });

    logger.success(`✅ Completed processing for Video ${videoId}`);

  } catch (error: any) {
    logger.error(`❌ Process error for ${videoId}: ${error.message}`);
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "failed", errorMessage: error.message }
    });
    throw error;
  } finally {
    if (fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
  }
}
