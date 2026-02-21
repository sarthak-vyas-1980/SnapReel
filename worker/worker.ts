import { Worker } from "bullmq"
import { prisma } from "../lib/prisma"
import { exec } from "child_process"
import path from "path"
import fs from "fs"
import { createClient } from "@supabase/supabase-js"
import { getAITimestamps } from "../lib/openrouter"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --------------------
// Redis Connection
// --------------------
const connection = {
  host: "localhost",
  port: 6379,
}

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
          console.error("Command failed:")
          console.error(stderr)
          return reject(error)
        }
        resolve(stdout)
      }
    )
  })
}


// 🔹 Extract transcript
const getTranscript = async (url: string): Promise<string> => {
  const command = `"./yt-dlp.exe" --write-auto-sub --sub-lang en --skip-download --sub-format vtt -o - "${url}"`

  const stdout = await execPromise(command)

  const cleaned = stdout
    .replace(/WEBVTT/g, "")
    .replace(/\d+:\d+:\d+\.\d+ --> .*$/gm, "")
    .replace(/<[^>]+>/g, "")
    .trim()

  if (!cleaned || cleaned.length < 200) {
    throw new Error("Transcript unavailable or too short")
  }

  return cleaned
}

// 🔹 Get duration using JSON metadata
const getVideoDuration = async (url: string): Promise<number> => {
  const command = `"./yt-dlp.exe" -J "${url}"`
  const stdout = await execPromise(command)

  const data = JSON.parse(stdout)
  const duration = data.duration

  if (!duration || typeof duration !== "number") {
    throw new Error("Invalid duration received")
  }

  return duration
}
// 🔹 Download video
const downloadVideo = async (url: string, videoId: string): Promise<string> => {
  const outputDir = "temp"
  const outputPath = path.join(outputDir, `${videoId}.mp4`)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  const command = `"./yt-dlp.exe" -f mp4 -o "${outputPath}" "${url}"`

  await execPromise(command)

  return outputPath
}

const trimVideo = async (
  inputPath: string,
  outputPath: string,
  start: string,
  end: string
) => {
  const command = `ffmpeg -y -i "${inputPath}" -ss ${start} -to ${end} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:a copy "${outputPath}"`

  console.log("Running FFmpeg:", command)

  await execPromise(command)
}

const generateThumbnail = async (
  inputPath: string,
  outputPath: string,
  time: string
) => {
  const command = `ffmpeg -y -ss ${time} -i "${inputPath}" -frames:v 1 -q:v 2 "${outputPath}"`

  console.log("Generating thumbnail:", command)

  await execPromise(command)
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
    await job.updateProgress(10)

    await prisma.video.update({
      where: { id: videoId },
      data: { 
        status: "processing",
        progress: 10 
      }
    })

    try {
    console.log("🔎 Checking duration...")
    const duration = await getVideoDuration(video.youtubeUrl)

    if (duration > 1200) {
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: "failed",
          errorMessage: "Video exceeds 20 minute limit"
        }
      })
      return ;
    }
  await job.updateProgress(20)
  await prisma.video.update({
    where: { id: videoId },
    data: { 
        status: "processing",
        progress: 20 
      }
  })

  console.log("🤖 Generating mock timestamps...")

  console.log("📜 Extracting transcript...")
  await prisma.video.update({
    where: { id: videoId },
    data: { 
        status: "processing",
        progress: 30 
      }
  })

  
  let start = "00:00:10";
  let end = "00:00:45";
  let timestamps = null;

  try {
    const transcript = await getTranscript(video.youtubeUrl);

    const aiResult = await getAITimestamps(transcript);

    if (aiResult && aiResult.start && aiResult.end) {
      timestamps = aiResult;
      start = timestamps.start;
      end = timestamps.end;
    } else {
      console.log("AI returned invalid structure, using fallback");
    }

    } catch (error) {
      console.log("AI failed, using fallback timestamps");
    }

    console.log("AI selected:", start, end);

    await prisma.video.update({
      where: { id: videoId },
      data: {
        timestamps, // will be null if fallback
      }
    });

  await job.updateProgress(50)
  await prisma.video.update({
    where: { id: videoId },
    data: { 
        status: "processing",
        progress: 50 
      }
  })

  console.log("⬇️ Downloading video...")
  const filePath = await downloadVideo(video.youtubeUrl, videoId)

  const reelOutput = path.join("temp", `${videoId}-reel.mp4`)

  console.log("🎬 Trimming reel...")
  await trimVideo(filePath, reelOutput, start, end)
  
  await job.updateProgress(75)
  await prisma.video.update({
    where: { id: videoId },
    data: { 
        status: "processing",
        progress: 75 
      }
  })

  console.log("☁️ Uploading to Supabase...")
  // Thumbnail path
  const thumbnailPath = path.join("temp", `${videoId}-thumb.jpg`)

  console.log("🖼 Generating thumbnail...")
  await generateThumbnail(filePath, thumbnailPath, start)

  console.log("☁️ Uploading reel...")
  const reelUrl = await uploadFileToSupabase(
    reelOutput,
    `${videoId}.mp4`,
    "video/mp4"
  )

  await job.updateProgress(90)
  await prisma.video.update({
    where: { id: videoId },
    data: { 
        status: "processing",
        progress: 90 
      }
  })

  console.log("☁️ Uploading thumbnail...")
  const thumbnailUrl = await uploadFileToSupabase(
    thumbnailPath,
    `${videoId}.jpg`,
    "image/jpeg"
  )

  // Cleanup
  fs.unlinkSync(filePath)
  fs.unlinkSync(reelOutput)
  fs.unlinkSync(thumbnailPath)

  await prisma.video.update({
    where: { id: videoId },
    data: {
      status: "completed",
      reelUrl,
      thumbnailUrl
    }
})
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

  console.log("✅ Processing completed")

} catch (error: any) {
  console.error("Worker Error:", error.message)

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

