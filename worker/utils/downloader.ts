import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { logger } from "./logger";

function execPromise(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve(stdout);
    });
  });
}

/** Build cookie flags if YOUTUBE_COOKIES_BASE64 env var exists */
function getCookieFlags(): { flags: string; cleanup: () => void } {
  const cookieContent = process.env.YOUTUBE_COOKIES_BASE64
    ? Buffer.from(process.env.YOUTUBE_COOKIES_BASE64, 'base64').toString('utf-8')
    : null;

  if (!cookieContent) return { flags: "", cleanup: () => {} };

  const cookiePath = path.join(process.cwd(), "temp", "yt-cookies.txt");
  fs.writeFileSync(cookiePath, cookieContent);

  return {
    flags: `--cookies "${cookiePath}"`,
    cleanup: () => { if (fs.existsSync(cookiePath)) fs.unlinkSync(cookiePath); }
  };
}

export async function getMetadata(url: string) {
  const cookie = getCookieFlags();
  try {
    const flags = `--no-check-certificates --js-runtimes node --print-json --skip-download ${cookie.flags}`;
    const command = `yt-dlp ${flags} "${url}"`;
    const out = await execPromise(command);
    return JSON.parse(out);
  } finally {
    cookie.cleanup();
  }
}

export async function downloadVideo(url: string, outputPath: string) {
  const baseFlags = `--js-runtimes node -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 --no-check-certificates`;
  const baseCmd = `yt-dlp ${baseFlags} -o "${outputPath}" "${url}"`;

  try {
    logger.info(`📥 Attempt 1: Regular Download...`);
    await execPromise(baseCmd);
  } catch (err: any) {
    logger.warn(`⚠️ Attempt 1 failed: ${err.message.slice(0, 200)}`);
    logger.warn(`⚠️ Trying with Cookies...`);
    
    const cookie = getCookieFlags();
    if (!cookie.flags) throw new Error("Download failed and no cookies available for fallback.");

    try {
      await execPromise(`yt-dlp ${baseFlags} ${cookie.flags} -o "${outputPath}" "${url}"`);
      logger.success(`✅ Fallback Download (Cookies) Successful.`);
    } finally {
      cookie.cleanup();
    }
  }
}
