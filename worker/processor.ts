import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { logger } from "./utils/logger";
import { downloadVideo, getMetadata } from "./utils/downloader";
import { processClip, generateThumbnail } from "./utils/ffmpeg_processor";
import uploadFileToSupabase from "./utils/supabase";
import { getTranscriptData } from "./utils/transcript";
import { getAITimestamps } from "../lib/openrouter";
import { generateSRT, generateApproximateSRT, writeSRTFile } from "./utils/captions";


async function updateProgress(videoId: string, progress: number, status = "processing") {
  await prisma.video.update({
    where: { id: videoId },
    data: { progress, status },
  });
}

export async function processJob(videoId: string) {
  const outputDir = path.join(process.cwd(), "temp");
  const sourceFile = path.join(outputDir, `${videoId}-source.mp4`);

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  try {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new Error("Video not found in database.");

    // 1. Download & Metadata
    await updateProgress(videoId, 5);
    logger.info(`📊 Fetching metadata for Video ${videoId}...`);
    const metadata = await getMetadata(video.youtubeUrl);
    
    if (metadata.title) {
        await prisma.video.update({ where: { id: videoId }, data: { title: metadata.title.slice(0, 50) } });
    }

    await updateProgress(videoId, 20);
    logger.info(`📥 Downloading source for Video ${videoId}...`);
    await downloadVideo(video.youtubeUrl, sourceFile);

    // 2. AI Timestamps & Transcript
    await updateProgress(videoId, 40);
    logger.info(`📜 Processing AI Timestamps for Video ${videoId}...`);

    // Fetch transcript + timed segments in one go
    const { text: transcript, segments: timedSegments } = await getTranscriptData(video.youtubeUrl);

    if (!transcript || transcript.length < 100) {
      logger.warn(`⚠️ Transcript too short or unavailable for ${videoId}. Using fallback clips.`);
    }

    const aiClips = transcript
      ? await getAITimestamps(transcript).catch(() => [])
      : [];

    const clipsToProcess = aiClips.length > 0 ? aiClips : [
        { start: "00:00:10", end: "00:00:45", label: "Highlights" }
    ];

    // 3. Clip Generation
    await updateProgress(videoId, 50);
    const processedClips = [];
    for (let i = 0; i < clipsToProcess.length; i++) {
      const clip = clipsToProcess[i];
      const clipId = `${videoId}-clip-${i + 1}`;
      const clipOutput = path.join(outputDir, `${clipId}.mp4`);

      // Per-clip progress: 50% -> 85%
      const clipProgress = 50 + Math.floor(((i + 1) / clipsToProcess.length) * 35);
      await updateProgress(videoId, clipProgress);
      logger.info(`🎬 Processing Clip ${i + 1}/${clipsToProcess.length}: ${clip.label}`);
      
      let srtPath: string | null = null;
      if (timedSegments.length > 0) {
          // Use precise timed segments
          const srtContent = generateSRT(timedSegments, clip.start, clip.end);
          srtPath = writeSRTFile(srtContent, outputDir, clipId);
      } else if (transcript) {
          // Fallback: generate approximate captions from plain transcript text
          logger.warn(`⚠️ Using approximate captions for clip ${i + 1} (no timed segments available)`);
          const srtContent = generateApproximateSRT(transcript, clip.start, clip.end);
          srtPath = writeSRTFile(srtContent, outputDir, clipId);
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
    }

    // 4. Thumbnail & Finalize
    await updateProgress(videoId, 90);
    logger.info(`🖼 Generating thumbnail for Video ${videoId}...`);
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
      data: { status: "failed", progress: 0, errorMessage: error.message }
    });
    throw error;
  } finally {
    if (fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
  }
}
