import "dotenv/config"
import { Worker } from "bullmq"
import { prisma } from "../lib/prisma"
import { exec } from "child_process"
import path from "path"
import fs from "fs"
import { createClient } from "@supabase/supabase-js"
import { getAITimestamps } from "../lib/openrouter"
import { YoutubeTranscript } from "youtube-transcript"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --------------------
// Redis Connection
// --------------------
const connection = {
  host: process.env.UPSTASH_REDIS_REST_URL ? new URL(process.env.UPSTASH_REDIS_REST_URL).hostname : process.env.REDIS_HOST,
  port: process.env.UPSTASH_REDIS_REST_URL ? 6379 : Number(process.env.REDIS_PORT),
  password: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_PASSWORD,
  tls: process.env.UPSTASH_REDIS_REST_URL ? {} : undefined,
};

// --------------------
// Helpers
// --------------------

const execPromise = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(
      command,
      { maxBuffer: 1024 * 1024 * 50 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("FFmpeg Command failed:")
          console.error(stderr)
          return reject(error)
        }
        resolve(stdout)
      }
    )
  })
}

// 🔹 Extract YouTube ID
const getYoutubeVideoId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
}

// 🔹 Fetch from RapidAPI with Retry
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const getRapidApiVideoInfo = async (videoId: string): Promise<any> => {
  const res = await fetch(
    `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${videoId}`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY!,
        "x-rapidapi-host": "ytstream-download-youtube-videos.p.rapidapi.com"
      }
    }
  );

  console.log("📡 Status:", res.status);

  if (!res.ok) {
    throw new Error(`RapidAPI Error: ${res.status}`);
  }

  return res.json();
};

// 🔹 Extract Best URL
const extractDownloadUrls = (videoInfo: any) => {
  const allFormats = [
    ...(videoInfo.formats || []),
    ...(videoInfo.adaptiveFormats || [])
  ];

  if (allFormats.length === 0) {
    throw new Error("No formats found in API response");
  }

  // Filter out invalid or ciphered formats
  let validVideos = allFormats.filter(f => 
    f.mimeType?.includes("video/mp4") && f.url && !f.signatureCipher
  );

  if (validVideos.length === 0) {
    throw new Error("No valid downloadable mp4 URL found in API response");
  }

  // Sort descending by height, then bitrate
  validVideos.sort((a, b) => {
    const heightA = a.height || 0;
    const heightB = b.height || 0;
    if (heightA !== heightB) return heightB - heightA;
    return (b.bitrate || 0) - (a.bitrate || 0);
  });

  const bestVideo = validVideos[0];

  // Try to find a separate audio stream if needed
  let audioUrl = null;
  if (!bestVideo.audioChannels && !bestVideo.audioQuality && !bestVideo.mimeType?.includes("audio")) {
    const validAudios = allFormats.filter(f => 
      f.mimeType?.includes("audio/mp4") && f.url && !f.signatureCipher
    );
    if (validAudios.length > 0) {
      validAudios.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      audioUrl = validAudios[0].url;
    }
  }

  return {
    videoUrl: bestVideo.url,
    audioUrl,
    duration: videoInfo.lengthSeconds || videoInfo.duration || (bestVideo.approxDurationMs ? bestVideo.approxDurationMs / 1000 : 0) || 0
  };
}

// 🔹 Extract transcript
const getTranscript = async (videoId: string): Promise<string> => {
  const transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
  const text = transcriptList.map(t => t.text).join(" ");
  
  if (!text || text.length < 200) {
    throw new Error("Transcript unavailable or too short");
  }
  
  return text;
}

const uploadFileToSupabase = async (
  filePath: string,
  fileName: string,
  contentType: string
) => {
  const fileBuffer = fs.readFileSync(filePath)

  const { error } = await supabase.storage
    .from("reels")
    .upload(fileName, fileBuffer, {
      contentType,
      upsert: true,
    })

  if (error) throw error

  const { data } = supabase.storage
    .from("reels")
    .getPublicUrl(fileName)

  return data.publicUrl
}

// --------------------
// Worker Definition
// --------------------

const worker = new Worker(
  "reel-processing",
  async job => {
    const { videoId } = job.data

    const video = await prisma.video.findUnique({
      where: { id: videoId }
    })

    if (!video) {
      console.log("Video not found in DB")
      return
    }
    if (video.status === "processing") {
      console.log("⚠️ Already processing, skipping duplicate job");
      return;
    }
    await job.updateProgress(10)

    await prisma.video.update({
      where: { id: videoId },
      data: { status: "processing", progress: 10 }
    })

    try {
      console.log(`\n▶️ Starting processing for video ID: ${videoId}`);
      
      const ytVideoId = getYoutubeVideoId(video.youtubeUrl)
      if (!ytVideoId) throw new Error("Invalid YouTube URL")

      // 1. Fetch Video Info via RapidAPI
      const videoInfo = await getRapidApiVideoInfo(ytVideoId)
      
      // 2. Extract best formatting
      const { videoUrl, audioUrl, duration } = extractDownloadUrls(videoInfo);
      
      console.log(`🔗 Extracted Video URL: ${videoUrl.slice(0, 100)}...`);

      if (duration && duration > 1200) {
        throw new Error("Video exceeds 20 minute limit");
      }

      await job.updateProgress(20)
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "processing", progress: 20 }
      })

      console.log("📜 Extracting transcript and AI timestamps...");
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "processing", progress: 30 }
      })

      let start = "00:00:10"
      let end = "00:00:45"
      let timestamps = null

      const setFallbackTimestamps = () => {
        const durationVal = typeof duration === "number" ? duration : parseFloat(duration || "0")
        if (durationVal > 0) {
          const startSec = Math.floor(durationVal * 0.2)
          const endSec = Math.min(startSec + 35, durationVal)
          const formatSec = (s: number) => new Date(s * 1000).toISOString().substring(11, 19)
          start = formatSec(startSec)
          end = formatSec(endSec)
        } else {
          start = "00:00:10"
          end = "00:00:45"
        }
      }

      try {
        const transcript = await getTranscript(ytVideoId)
        const aiResult = await getAITimestamps(transcript)

        if (aiResult && aiResult.start && aiResult.end) {
          timestamps = aiResult
          start = timestamps.start
          end = timestamps.end
        } else {
          console.log("⚠️ AI returned invalid structure, using fallback")
          setFallbackTimestamps()
        }
      } catch (error: any) {
        console.log(`⚠️ AI/Transcript failed: ${error.message}. Using fallback timestamps.`)
        setFallbackTimestamps()
      }

      console.log(`⏱️ Timestamps selected: ${start} to ${end}`);

      await prisma.video.update({
        where: { id: videoId },
        data: { timestamps }
      })

      await job.updateProgress(50)
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "processing", progress: 50 }
      })

      // Ensure output directory exists
      const outputDir = "temp"
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir)
      }

      const reelOutput = path.join(outputDir, `${videoId}-reel.mp4`)
      const thumbnailPath = path.join(outputDir, `${videoId}-thumb.jpg`)

      // 3. FFMPEG Processing (Streaming directly from URL)
      console.log("🎬 Starting FFmpeg execution...");
      let command = "";
      if (audioUrl) {
        command = `ffmpeg -y -ss ${start} -to ${end} -i "${videoUrl}" -ss ${start} -to ${end} -i "${audioUrl}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -c:a aac "${reelOutput}"`
      } else {
        command = `ffmpeg -y -ss ${start} -to ${end} -i "${videoUrl}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -c:a aac "${reelOutput}"`
      }
      
      try {
        await execPromise(command)
        console.log("✅ FFmpeg execution finished successfully");
      } catch (err: any) {
        throw new Error(`FFmpeg processing failed: ${err.message}`);
      }

      await job.updateProgress(75)
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "processing", progress: 75 }
      })

      console.log("🖼 Generating thumbnail...");
      try {
        const thumbCommand = `ffmpeg -y -ss ${start} -i "${videoUrl}" -frames:v 1 -q:v 2 "${thumbnailPath}"`
        await execPromise(thumbCommand)
      } catch (err) {
        console.log("⚠️ Thumbnail generation failed, skipping...");
      }

      console.log("☁️ Uploading reel and thumbnail to Supabase...");
      let reelUrl = null;
      let thumbnailUrl = null;
      try {
        reelUrl = await uploadFileToSupabase(reelOutput, `${videoId}.mp4`, "video/mp4")
        if (fs.existsSync(thumbnailPath)) {
          thumbnailUrl = await uploadFileToSupabase(thumbnailPath, `${videoId}.jpg`, "image/jpeg")
        }
      } catch (err: any) {
        throw new Error(`Upload failed: ${err.message}`);
      }

      // Cleanup temp files safely
      if (fs.existsSync(reelOutput)) fs.unlinkSync(reelOutput);
      if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);

      await job.updateProgress(100)
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: "completed",
          progress: 100,
          reelUrl,
          thumbnailUrl
        }
      })

      console.log("✅ Processing completed successfully for:", videoId);
    } catch (error: any) {
      console.error(`❌ Worker Error for video ${videoId}:`, error.message)

      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: "failed",
          errorMessage: error.message
        }
      })
    }
  },
  { connection }
)

console.log("SnapReel Worker running...")
