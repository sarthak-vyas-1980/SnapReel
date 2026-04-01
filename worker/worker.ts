import "dotenv/config";
import { Worker } from "bullmq";
import { prisma } from "../lib/prisma";
import path from "path";
import fs from "fs";

import { getAITimestamps } from "../lib/openrouter";
import execPromise from "./utils/ffmpeg";
import uploadFileToSupabase from "./utils/supabase";
import getTranscript, { getTimedTranscript, TimedSegment } from "./utils/transcript";
import { generateSRT, writeSRTFile } from "./utils/captions";
import { 
  getYoutubeVideoId, 
  getRapidApiVideoInfo, 
  extractDownloadUrls 
} from "./utils/youtube";

const connection = {
  host: process.env.UPSTASH_REDIS_REST_URL ? new URL(process.env.UPSTASH_REDIS_REST_URL).hostname : process.env.REDIS_HOST,
  port: process.env.UPSTASH_REDIS_REST_URL ? 6379 : Number(process.env.REDIS_PORT),
  password: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_PASSWORD,
  tls: process.env.UPSTASH_REDIS_REST_URL ? {} : undefined,
};

const worker = new Worker(
  "reel-processing",
  async job => {
    const { videoId } = job.data;

    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      console.log("Video not found in DB");
      return;
    }
    if (video.status === "processing") {
      console.log("⚠️ Already processing, skipping duplicate job");
      return;
    }
    await job.updateProgress(10);
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "processing", progress: 10 }
    });

    try {
      console.log(`\n▶️ Starting processing for video ID: ${videoId}`);
      
      const ytVideoId = getYoutubeVideoId(video.youtubeUrl);
      if (!ytVideoId) throw new Error("Invalid YouTube URL");

      // 1. Fetch Video Info via RapidAPI
      const videoInfo = await getRapidApiVideoInfo(ytVideoId);
      
      // 2. Extract best formatting
      const { videoUrl, audioUrl, duration } = extractDownloadUrls(videoInfo);
      
      console.log(`🔗 Extracted Video URL: ${videoUrl.slice(0, 100)}...`);

      if (duration && duration > 1200) {
        throw new Error("Video exceeds 20 minute limit");
      }

      await job.updateProgress(20);
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "processing", progress: 20 }
      });

      console.log("📜 Extracting transcript and AI timestamps...");
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "processing", progress: 30 }
      });

      let clipsToProcess = [];

      const formatSec = (s: number) => new Date(s * 1000).toISOString().substring(11, 19);

      const setFallbackTimestamps = () => {
        const durationVal = typeof duration === "number" ? duration : parseFloat(String(duration || "0"));
        if (durationVal > 0) {
          clipsToProcess = [
            { start: formatSec(Math.floor(durationVal * 0.2)), end: formatSec(Math.min(Math.floor(durationVal * 0.2) + 35, durationVal)), label: "Clip 1", hook_score: 85, engagement: "Medium" },
            { start: formatSec(Math.floor(durationVal * 0.5)), end: formatSec(Math.min(Math.floor(durationVal * 0.5) + 35, durationVal)), label: "Clip 2", hook_score: 80, engagement: "Medium" },
            { start: formatSec(Math.floor(durationVal * 0.75)), end: formatSec(Math.min(Math.floor(durationVal * 0.75) + 35, durationVal)), label: "Clip 3", hook_score: 75, engagement: "Medium" }
          ];
        } else {
          clipsToProcess = [
            { start: "00:00:10", end: "00:00:45", label: "Clip 1", hook_score: 85, engagement: "Medium" }
          ];
        }
      };

      // Fetch timed transcript for captions
      let timedSegments: TimedSegment[] = [];
      try {
        timedSegments = await getTimedTranscript(ytVideoId);
        console.log(`📝 Fetched ${timedSegments.length} timed transcript segments for captions`);
      } catch (err: any) {
        console.log(`⚠️ Timed transcript unavailable: ${err.message}. Clips will have no captions.`);
      }

      try {
        const transcript = await getTranscript(ytVideoId);
        const aiResult = await getAITimestamps(transcript);

        if (Array.isArray(aiResult) && aiResult.length > 0) {
          clipsToProcess = aiResult;
        } else {
          console.log("⚠️ AI returned invalid structure, using fallback");
          setFallbackTimestamps();
        }
      } catch (error: any) {
        console.log(`⚠️ AI/Transcript failed: ${error.message}. Using fallback timestamps.`);
        setFallbackTimestamps();
      }

      console.log(`⏱️ Processing ${clipsToProcess.length} clips...`);

      const outputDir = "temp";
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      const generatedClips = [];

      for (let i = 0; i < clipsToProcess.length; i++) {
        const clip = clipsToProcess[i];
        const clipId = `${videoId}-clip-${i + 1}`;
        const clipOutput = path.join(outputDir, `${clipId}.mp4`);
        
        console.log(`🎬 Processing Clip ${i + 1}/${clipsToProcess.length}: ${clip.label} (${clip.start} - ${clip.end})`);
        
        await prisma.video.update({
          where: { id: videoId },
          data: { progress: 40 + Math.floor((i / clipsToProcess.length) * 40) }
        });

        // Generate SRT captions for this clip
        let srtPath: string | null = null;
        if (timedSegments.length > 0) {
          try {
            const srtContent = generateSRT(timedSegments, clip.start, clip.end);
            srtPath = writeSRTFile(srtContent, outputDir, clipId);
            if (srtPath) console.log(`📝 Generated captions: ${srtPath}`);
          } catch (err: any) {
            console.log(`⚠️ Caption generation failed for clip ${i + 1}: ${err.message}`);
          }
        }

        // Build FFmpeg command
        const scaleFilter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";
        // Escape backslashes and colons in srt path for FFmpeg on Windows
        const escapedSrtPath = srtPath ? srtPath.replace(/\\/g, '/').replace(/:/g, '\\:') : null;
        const subtitleFilter = escapedSrtPath
          ? `,subtitles='${escapedSrtPath}':force_style='FontSize=14,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,Alignment=2,MarginV=70'`
          : "";
        const vf = `"${scaleFilter}${subtitleFilter}"`;

        let command = "";
        if (audioUrl) {
          command = `ffmpeg -y -ss ${clip.start} -to ${clip.end} -i "${videoUrl}" -ss ${clip.start} -to ${clip.end} -i "${audioUrl}" -vf ${vf} -c:v libx264 -c:a aac "${clipOutput}"`;
        } else {
          command = `ffmpeg -y -ss ${clip.start} -to ${clip.end} -i "${videoUrl}" -vf ${vf} -c:v libx264 -c:a aac "${clipOutput}"`;
        }

        try {
          await execPromise(command);
          const uploadedUrl = await uploadFileToSupabase(clipOutput, `${clipId}.mp4`, "video/mp4");
          generatedClips.push({
            url: uploadedUrl,
            start: clip.start,
            end: clip.end,
            label: clip.label || `Clip ${i + 1}`,
            hookScore: clip.hookScore || clip.hook_score || 85,
            engagementLevel: clip.engagementLevel || clip.engagement || "Medium"
          });
          if (fs.existsSync(clipOutput)) fs.unlinkSync(clipOutput);
        } catch (err: any) {
          console.error(`❌ Failed to process clip ${i + 1}:`, err.message);
        }

        // Clean up SRT file
        if (srtPath && fs.existsSync(srtPath)) {
          try { fs.unlinkSync(srtPath); } catch {}
        }
      }

      if (generatedClips.length === 0) {
        throw new Error("Failed to generate any clips.");
      }

      await job.updateProgress(90);
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "processing", progress: 90 }
      });

      console.log("🖼 Generating thumbnail from first clip...");
      const thumbnailPath = path.join(outputDir, `${videoId}-thumb.jpg`);
      let thumbnailUrl = null;
      try {
        const thumbCommand = `ffmpeg -y -ss ${generatedClips[0].start} -i "${videoUrl}" -frames:v 1 -q:v 2 "${thumbnailPath}"`;
        await execPromise(thumbCommand);
        if (fs.existsSync(thumbnailPath)) {
          thumbnailUrl = await uploadFileToSupabase(thumbnailPath, `${videoId}.jpg`, "image/jpeg");
          fs.unlinkSync(thumbnailPath);
        }
      } catch (err) {
        console.log("⚠️ Thumbnail generation failed, skipping...");
      }

      await job.updateProgress(100);
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: "completed",
          progress: 100,
          reelUrl: generatedClips[0].url, // Compatibility
          thumbnailUrl,
          clips: generatedClips as any,
          timestamps: { start: generatedClips[0].start, end: generatedClips[0].end } as any
        }
      });

      await prisma.notification.create({
        data: {
          userId: video.userId,
          title: "Reel Ready 🎉",
          message: "Your reel has been generated successfully.",
          type: "success",
        },
      });

      console.log("✅ Processing completed successfully for:", videoId);
    } catch (error: any) {
      console.error(`❌ Worker Error for video ${videoId}:`, error.message);

      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: "failed",
          errorMessage: error.message
        }
      });

      await prisma.notification.create({
        data: {
          userId: video.userId,
          title: "Reel Failed ❌",
          message: "Something went wrong. You can retry.",
          type: "error",
        },
      });
    }
  },
  { connection }
);

console.log("SnapReel Worker running...");
