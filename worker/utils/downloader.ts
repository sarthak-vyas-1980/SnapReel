import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { logger } from "./logger";

/** Default timeout: 5 minutes. Prevents infinite hangs from bot-detection pages. */
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

function execPromise(command: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = exec(command, { maxBuffer: 1024 * 1024 * 100, timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) {
        if ((error as any).killed) {
          return reject(new Error(`Command timed out after ${timeoutMs / 1000}s. YouTube may be blocking the request.`));
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
  const cookiePath = path.join(process.cwd(), "temp", "yt-cookies.txt");
  fs.mkdirSync(path.dirname(cookiePath), { recursive: true });
  fs.writeFileSync(cookiePath, cookieContent);
  return cookiePath;
}

/** Clean up the temp cookie file */
function cleanupCookies(cookiePath: string | null) {
  if (cookiePath && fs.existsSync(cookiePath)) {
    try { fs.unlinkSync(cookiePath); } catch {}
  }
}

/** Build cookie flags string for yt-dlp */
function getCookieFlags(): string {
  const cookiePath = getCookiePath();
  if (!cookiePath) return "";
  return `--cookies "${cookiePath}"`;
}

export async function getMetadata(url: string) {
  // Use -j (dump-json) NOT --print-json. --print-json triggers format selection and can fail.
  const cookiePath = getCookiePath();
  const cookieFlag = cookiePath ? `--cookies "${cookiePath}"` : "";

  try {
    // Try with cookies first if available (YouTube blocks most requests without auth now)
    if (cookieFlag) {
      try {
        const out = await execPromise(`yt-dlp -j --no-warnings ${cookieFlag} "${url}"`, 60_000);
        return JSON.parse(out);
      } catch (err: any) {
        logger.warn(`⚠️ Metadata with cookies failed: ${err.message}. Trying without...`);
      }
    }

    // Fallback: without cookies
    const out = await execPromise(`yt-dlp -j --no-warnings "${url}"`, 60_000);
    return JSON.parse(out);
  } finally {
    cleanupCookies(cookiePath);
  }
}

export async function downloadVideo(url: string, outputPath: string) {
  // Flexible format chain: try mp4 combos first, then any format with mp4 merge
  const formatStr = `"bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio/bestvideo+bestaudio/best"`;
  const baseFlags = `-f ${formatStr} --merge-output-format mp4 --no-warnings`;

  const cookiePath = getCookiePath();
  const cookieFlag = cookiePath ? `--cookies "${cookiePath}"` : "";

  try {
    // Try with cookies first if available (YouTube blocks most IPs without auth now)
    if (cookieFlag) {
      try {
        logger.info(`📥 Attempt 1: Download with Cookies...`);
        await execPromise(`yt-dlp ${baseFlags} ${cookieFlag} -o "${outputPath}" "${url}"`);
        logger.success(`✅ Download successful (with cookies).`);
        return;
      } catch (err: any) {
        logger.warn(`⚠️ Cookie download failed: ${err.message}. Trying without cookies...`);
        // Clean up partial download
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }
    }

    // Fallback: without cookies
    logger.info(`📥 Attempt 2: Regular Download (no cookies)...`);
    await execPromise(`yt-dlp ${baseFlags} -o "${outputPath}" "${url}"`);
    logger.success(`✅ Download successful (without cookies).`);
  } finally {
    cleanupCookies(cookiePath);
  }
}
