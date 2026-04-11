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
        // Distinguish timeout from other errors
        if ((error as any).killed) {
          return reject(new Error(`Command timed out after ${timeoutMs / 1000}s. This usually means YouTube is blocking the request.`));
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

/** Safe unlink for Windows to prevent EBUSY crashes */
function safeUnlink(filePath: string) {
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) {
      logger.warn(`Could not delete ${filePath} (might be locked by Windows): ${e}`);
    }
  }
}

export async function getMetadata(url: string) {
  // MUST use -j instead of --print-json to avoid yt-dlp querying formats
  const baseFlags = `-j --no-warnings`;
  const cookiePath = getCookiePath();
  const cookieFlag = cookiePath ? `--cookies "${cookiePath}"` : "";

  try {
    // Try with cookies first since YouTube is aggressively blocking right now
    if (cookieFlag) {
      try {
        const out = await execPromise(`yt-dlp ${baseFlags} ${cookieFlag} "${url}"`, 60_000);
        return JSON.parse(out);
      } catch (err: any) {
        logger.warn(`⚠️ Metadata with cookies failed: ${err.message}. Trying without...`);
      }
    }

    // Fallback: without cookies
    const out = await execPromise(`yt-dlp ${baseFlags} "${url}"`, 60_000);
    return JSON.parse(out);
  } finally {
    cleanupCookies(cookiePath);
  }
}

export async function downloadVideo(url: string, outputPath: string) {
  // Use a much more permissive format string, and --file-access-retries for Windows locks
  const formatStr = `"bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio/bestvideo+bestaudio/best"`;
  const baseFlags = `-f ${formatStr} --merge-output-format mp4 --file-access-retries 10 --no-warnings`;
  
  const cookiePath = getCookiePath();
  const cookieFlag = cookiePath ? `--cookies "${cookiePath}"` : "";
  const tempPath = outputPath.replace(".mp4", ".temp.mp4");

  try {
    // Try with cookies first
    if (cookieFlag) {
      try {
        logger.info(`📥 Attempt 1: Download with Cookies...`);
        await execPromise(`yt-dlp ${baseFlags} ${cookieFlag} -o "${outputPath}" "${url}"`);
        logger.success(`✅ Download successful (with cookies).`);
        return;
      } catch (err: any) {
        logger.warn(`⚠️ Cookie download failed: ${err.message}. Trying without cookies...`);
        safeUnlink(outputPath);
        safeUnlink(tempPath);
      }
    }

    // Fallback: without cookies
    logger.info(`📥 Attempt 2: Regular Download (no cookies)...`);
    await execPromise(`yt-dlp ${baseFlags} -o "${outputPath}" "${url}"`);
    logger.success(`✅ Download successful (without cookies).`);

  } catch (err: any) {
    // If yt-dlp fails due to WinError 32 on the FINAL rename, but the .temp.mp4 exists AND is fully merged,
    // we can attempt a manual rename after a short wait!
    if (err.message.includes("WinError 32") && fs.existsSync(tempPath)) {
      logger.warn(`⚠️ Hit WinError 32. File is locked by Windows (likely Defender/OneDrive). Waiting 3 seconds to rescue the file...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        fs.renameSync(tempPath, outputPath);
        logger.success(`✅ Successfully rescued and renamed file after WinError 32.`);
        return; // Download succeeded!
      } catch (renameErr: any) {
        throw new Error(`WinError 32: yt-dlp merge completed but file is permanently locked by Windows AV. ${renameErr.message}`);
      }
    }
    
    // Otherwise, clean up and bubble error up
    safeUnlink(outputPath);
    safeUnlink(tempPath);
    throw err;
  } finally {
    cleanupCookies(cookiePath);
  }
}
