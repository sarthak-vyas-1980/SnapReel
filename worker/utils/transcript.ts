import { exec } from "child_process";
import fs from "fs";
import path from "path";

export type TimedSegment = {
  text: string;
  offset: number; // seconds
  duration: number; // seconds
};

function execPromise(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve(stdout);
    });
  });
}

/** Build cookie flags if available */
function getCookieArgs(): string {
  const cookieContent = process.env.YOUTUBE_COOKIES_BASE64
    ? Buffer.from(process.env.YOUTUBE_COOKIES_BASE64, "base64").toString(
        "utf-8",
      )
    : null;

  if (!cookieContent) return "";

  const cookiePath = path.join(
    process.cwd(),
    "temp",
    "yt-cookies-transcript.txt",
  );
  fs.writeFileSync(cookiePath, cookieContent);
  return `--cookies "${cookiePath}"`;
}

function cleanupCookieFile() {
  const cookiePath = path.join(
    process.cwd(),
    "temp",
    "yt-cookies-transcript.txt",
  );
  if (fs.existsSync(cookiePath)) fs.unlinkSync(cookiePath);
}

function cleanupSubtitleFiles(prefix: string) {
  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) return;

  const subFiles = fs
    .readdirSync(tempDir)
    .filter(
      (f) => f.startsWith(prefix) && (f.endsWith(".vtt") || f.endsWith(".srt")),
    );

  subFiles.forEach((f) => {
    const p = path.join(tempDir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
}

/**
 * Parse VTT/SRT subtitle content into timed segments.
 * Handles both VTT and SRT formats.
 */
function parseSubtitleFile(content: string): TimedSegment[] {
  const segments: TimedSegment[] = [];

  // Remove VTT header
  const cleaned = content
    .replace(/^WEBVTT.*$/m, "")
    .replace(/^Kind:.*$/m, "")
    .replace(/^Language:.*$/m, "")
    .trim();

  // Match timestamp blocks: either VTT (00:00:01.234 --> 00:00:05.678) or SRT (00:00:01,234 --> 00:00:05,678)
  const blockRegex =
    /(\d{1,2}:?\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:?\d{2}:\d{2}[.,]\d{3})\s*\n([\s\S]*?)(?=\n\n|\n\d+\n|\s*$)/g;

  let match;
  while ((match = blockRegex.exec(cleaned)) !== null) {
    const startTime = parseVTTTimestamp(match[1]);
    const endTime = parseVTTTimestamp(match[2]);
    const text = match[3]
      .replace(/<[^>]+>/g, "") // strip HTML tags
      .replace(/\n/g, " ")
      .trim();

    if (text && endTime > startTime) {
      segments.push({
        text,
        offset: startTime,
        duration: endTime - startTime,
      });
    }
  }

  return segments;
}

/** Parse VTT/SRT timestamp to seconds */
function parseVTTTimestamp(ts: string): number {
  // Normalize comma to dot (SRT uses comma, VTT uses dot)
  ts = ts.replace(",", ".");
  const parts = ts.split(":");
  if (parts.length === 3) {
    return (
      parseFloat(parts[0]) * 3600 +
      parseFloat(parts[1]) * 60 +
      parseFloat(parts[2])
    );
  } else if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return 0;
}

/**
 * Fetch timed subtitle segments and transcript text in a single yt-dlp call.
 */
export async function getTranscriptData(
  videoUrl: string,
): Promise<{ text: string | null; segments: TimedSegment[] }> {
  const cookieArgs = getCookieArgs();
  const prefix = "transcript-";
  const outputTemplate = path.join(process.cwd(), "temp", `${prefix}%(id)s`);

  try {
    const cmd = `yt-dlp --no-check-certificates ${cookieArgs} --write-auto-sub --write-sub --sub-lang "en,hi" --sub-format vtt --skip-download -o "${outputTemplate}" "${videoUrl}"`;
    await execPromise(cmd);

    const tempDir = path.join(process.cwd(), "temp");
    const subFiles = fs
      .readdirSync(tempDir)
      .filter(
        (f) =>
          f.startsWith(prefix) && (f.endsWith(".vtt") || f.endsWith(".srt")),
      );

    if (subFiles.length === 0) {
      cleanupSubtitleFiles(prefix);
      cleanupCookieFile();
      return { text: null, segments: [] };
    }

    const enFile = subFiles.find((f) => f.includes(".en.")) || subFiles[0];
    const subPath = path.join(tempDir, enFile);
    const content = fs.readFileSync(subPath, "utf-8");
    const segments = parseSubtitleFile(content);
    const text = segments.map((s) => s.text).join(" ");

    cleanupSubtitleFiles(prefix);
    cleanupCookieFile();

    if (!text || text.length < 100) {
      return { text: null, segments };
    }

    return { text, segments };
  } catch (err: any) {
    console.log(
      `⚠️ yt-dlp timed subtitle download failed: ${err.message.slice(0, 200)}`,
    );
    cleanupSubtitleFiles(prefix);
    cleanupCookieFile();
    return { text: null, segments: [] };
  }
}
