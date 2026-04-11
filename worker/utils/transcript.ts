import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { logger } from "./logger";
import { YoutubeTranscript } from "youtube-transcript";

export type TimedSegment = {
  text: string;
  offset: number; // seconds
  duration: number; // seconds
};

/** Default timeout: 3 minutes to prevent infinite hangs. */
const DEFAULT_TIMEOUT_MS = 3 * 60 * 1000;

function execPromise(command: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10, timeout: timeoutMs }, (error, stdout, stderr) => {
      // yt-dlp warnings (like JS challenge fails) go to stderr. We only reject if error code is non-zero
      if (error) {
        if ((error as any).killed) {
           return reject(new Error(`Command timed out after ${timeoutMs / 1000}s. YouTube might be blocking the request.`));
        }
        return reject(new Error(stderr || error.message));
      }
      resolve(stdout);
    });
  });
}

/** Resolve the cookie file path if YOUTUBE_COOKIES_BASE64 is set. Returns null if unavailable. */
function getCookiePath(): string | null {
  const b64 = process.env.YOUTUBE_COOKIES_BASE64;
  if (!b64) return null;

  const cookieContent = Buffer.from(b64, "base64").toString("utf-8");
  const cookiePath = path.join(process.cwd(), "temp", "yt-cookies-transcript.txt");
  fs.mkdirSync(path.dirname(cookiePath), { recursive: true });
  fs.writeFileSync(cookiePath, cookieContent);
  return cookiePath;
}

function cleanupCookieFile() {
  const cookiePath = path.join(process.cwd(), "temp", "yt-cookies-transcript.txt");
  if (fs.existsSync(cookiePath)) fs.unlinkSync(cookiePath);
}

function cleanupSubtitleFiles(prefix: string) {
  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) return;

  const subFiles = fs
    .readdirSync(tempDir)
    .filter((f) => f.startsWith(prefix) && (f.endsWith(".vtt") || f.endsWith(".srt")));

  subFiles.forEach((f) => {
    const p = path.join(tempDir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
}

/**
 * Parse VTT/SRT subtitle content into timed segments.
 */
function parseSubtitleFile(content: string): TimedSegment[] {
  const segments: TimedSegment[] = [];

  const cleaned = content
    .replace(/^WEBVTT.*$/m, "")
    .replace(/^Kind:.*$/m, "")
    .replace(/^Language:.*$/m, "")
    .trim();

  const blockRegex =
    /(\d{1,2}:?\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:?\d{2}:\d{2}[.,]\d{3})\s*\n([\s\S]*?)(?=\n\n|\n\d+\n|\s*$)/g;

  let match;
  while ((match = blockRegex.exec(cleaned)) !== null) {
    const startTime = parseVTTTimestamp(match[1]);
    const endTime = parseVTTTimestamp(match[2]);
    const text = match[3].replace(/<[^>]+>/g, "").replace(/\n/g, " ").trim();

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

function parseVTTTimestamp(ts: string): number {
  ts = ts.replace(",", ".");
  const parts = ts.split(":");
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
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
  const prefix = "transcript-";
  const outputTemplate = path.join(process.cwd(), "temp", `${prefix}%(id)s`);
  const baseFlags = `--js-runtimes node --no-check-certificates --write-auto-sub --write-sub --sub-lang "en,hi" --sub-format vtt --skip-download -o "${outputTemplate}"`;

  const cookiePath = getCookiePath();
  const cookieFlag = cookiePath ? `--cookies "${cookiePath}"` : "";

  // Helper function to prevent repeating the processing logic
  const processSubtitles = () => {
    const tempDir = path.join(process.cwd(), "temp");
    const subFiles = fs
      .readdirSync(tempDir)
      .filter((f) => f.startsWith(prefix) && (f.endsWith(".vtt") || f.endsWith(".srt")));

    if (subFiles.length === 0) return null;

    const enFile = subFiles.find((f) => f.includes(".en.")) || subFiles[0];
    const subPath = path.join(tempDir, enFile);
    const content = fs.readFileSync(subPath, "utf-8");
    const segments = parseSubtitleFile(content);
    const text = segments.map((s) => s.text).join(" ");

    return { text, segments };
  };

  try {
    let success = false;

    // ATTEMPT 1: With cookies (if available)
    if (cookieFlag) {
      try {
        const cmd = `yt-dlp ${baseFlags} ${cookieFlag} "${videoUrl}"`;
        await execPromise(cmd);
        success = true;
      } catch (err: any) {
        logger.warn(`⚠️ Transcript download with cookies failed: ${err.message.slice(0, 150)}. Trying without cookies...`);
        cleanupSubtitleFiles(prefix); // cleanup partials before retrying
      }
    }

    // ATTEMPT 2: Without cookies (Fallback)
    if (!success) {
      try {
        const cmd = `yt-dlp ${baseFlags} "${videoUrl}"`;
        await execPromise(cmd);
      } catch (err: any) {
        logger.warn(`⚠️ Transcript download without cookies failed: ${err.message.slice(0, 150)}`);
      }
    }

    const result = processSubtitles();

    if (result && result.text && result.text.length >= 100) {
      return result;
    }

    // ATTEMPT 3: youtube-transcript package (bypasses many yt-dlp blocks locally)
    logger.info(`🔄 yt-dlp transcript failed or empty. Trying youtube-transcript package...`);
    try {
      const fallbackSubs = await YoutubeTranscript.fetchTranscript(videoUrl);
      if (fallbackSubs && fallbackSubs.length > 0) {
        const segments: TimedSegment[] = fallbackSubs.map((s: any) => ({
          text: s.text.replace(/\[.*?\]/g, "").replace(/\n/g, " ").trim(), // Remove [Music] tags and newlines
          offset: s.offset / 1000, // library returns ms
          duration: s.duration / 1000, // library returns ms
        })).filter(s => s.text.length > 0);

        const text = segments.map((s) => s.text).join(" ");
        if (text.length >= 100) {
          logger.success(`✅ Successfully rescued transcript using youtube-transcript package!`);
          return { text, segments };
        }
      }
    } catch (fallbackErr: any) {
      logger.warn(`⚠️ youtube-transcript fallback also failed: ${fallbackErr.message}`);
    }

    return { text: null, segments: [] };

  } catch (err: any) {
    logger.warn(`⚠️ yt-dlp timed subtitle download failed completely: ${err.message.slice(0, 150)}`);
    return { text: null, segments: [] };
  } finally {
    cleanupSubtitleFiles(prefix);
    cleanupCookieFile();
  }
}

