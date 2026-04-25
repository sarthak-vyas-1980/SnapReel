import { exec, type ExecException } from "child_process";
import fs from "fs";
import path from "path";
import { logger } from "./logger";

/** Default timeout: 5 minutes. Prevents infinite hangs from bot-detection pages. */
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const YT_COMMON_FLAGS = `--ignore-config --no-playlist --no-warnings`;
const YT_NETWORK_FLAGS = `--retries 8 --fragment-retries 16 --extractor-retries 5 --retry-sleep 2 --force-ipv4 --extractor-args "youtube:player_client=web"`;

function execPromise(
  command: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      command,
      { maxBuffer: 1024 * 1024 * 100, timeout: timeoutMs },
      (error: ExecException | null, stdout, stderr) => {
        if (error) {
          // Distinguish timeout from other errors
          if (error.killed) {
            return reject(
              new Error(
                `Command timed out after ${timeoutMs / 1000}s. This usually means YouTube is blocking the request.`,
              ),
            );
          }
          return reject(new Error(stderr || error.message));
        }
        resolve(stdout);
      },
    );
  });
}

function normalizeError(err: unknown): string {
  if (err instanceof Error) return err.message.trim();
  if (typeof err === "string") return err.trim();
  return "Unknown yt-dlp error";
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
    try {
      fs.unlinkSync(cookiePath);
    } catch {}
  }
}

/** Safe unlink for Windows to prevent EBUSY crashes */
function safeUnlink(filePath: string) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      logger.warn(
        `Could not delete ${filePath} (might be locked by Windows): ${e}`,
      );
    }
  }
}

export async function getMetadata(url: string) {
  // Use a single-json metadata fetch and ignore global yt-dlp config to avoid accidental -f overrides.
  const baseFlags = `--dump-single-json --skip-download ${YT_COMMON_FLAGS} ${YT_NETWORK_FLAGS}`;
  const cookiePath = getCookiePath();
  const cookieFlag = cookiePath ? `--cookies "${cookiePath}"` : "";

  try {
    // Try with cookies first since YouTube is aggressively blocking right now
    if (cookieFlag) {
      try {
        const out = await execPromise(
          `yt-dlp ${baseFlags} ${cookieFlag} "${url}"`,
          60_000,
        );
        return JSON.parse(out);
      } catch (err: unknown) {
        logger.warn(
          `⚠️ Metadata with cookies failed: ${normalizeError(err)}. Trying without...`,
        );
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
  // Try progressively broader format selectors. Some videos block specific mux/container combos.
  const formatVariants = [
    `-f "bv*+ba/b" --merge-output-format mp4`,
    `-f "bv*[ext=mp4]+ba[ext=m4a]/bv*[ext=mp4]+ba/b[ext=mp4]/b" --merge-output-format mp4`,
    `-f "b" --recode-video mp4`,
  ];
  const baseFlags = `${YT_COMMON_FLAGS} ${YT_NETWORK_FLAGS} --file-access-retries 10`;

  const cookiePath = getCookiePath();
  const cookieFlag = cookiePath ? `--cookies "${cookiePath}"` : "";
  const tempPath = outputPath.replace(".mp4", ".temp.mp4");

  try {
    const authModes = [
      { label: "with cookies", flag: cookieFlag },
      { label: "without cookies", flag: "" },
    ].filter((mode, idx) => idx === 1 || Boolean(cookieFlag));

    let lastError = "Unknown download failure";

    for (const authMode of authModes) {
      for (let i = 0; i < formatVariants.length; i++) {
        const attemptNo = i + 1;
        const formatFlags = formatVariants[i];

        try {
          logger.info(
            `📥 Download attempt ${attemptNo}/${formatVariants.length} ${authMode.label}...`,
          );
          await execPromise(
            `yt-dlp ${baseFlags} ${formatFlags} ${authMode.flag} -o "${outputPath}" "${url}"`,
          );
          logger.success(`✅ Download successful (${authMode.label}).`);
          return;
        } catch (err: unknown) {
          lastError = normalizeError(err);
          logger.warn(
            `⚠️ Download failed (${authMode.label}, format variant ${attemptNo}): ${lastError}`,
          );
          safeUnlink(outputPath);
          safeUnlink(tempPath);
        }
      }
    }

    throw new Error(lastError);
  } catch (err: unknown) {
    const errorMessage = normalizeError(err);

    // If yt-dlp fails due to WinError 32 on the FINAL rename, but the .temp.mp4 exists AND is fully merged,
    // we can attempt a manual rename after a short wait!
    if (errorMessage.includes("WinError 32") && fs.existsSync(tempPath)) {
      logger.warn(
        `⚠️ Hit WinError 32. File is locked by Windows (likely Defender/OneDrive). Waiting 3 seconds to rescue the file...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
      try {
        fs.renameSync(tempPath, outputPath);
        logger.success(
          `✅ Successfully rescued and renamed file after WinError 32.`,
        );
        return; // Download succeeded!
      } catch (renameErr: unknown) {
        throw new Error(
          `WinError 32: yt-dlp merge completed but file is permanently locked by Windows AV. ${normalizeError(renameErr)}`,
        );
      }
    }

    // Otherwise, clean up and bubble error up
    safeUnlink(outputPath);
    safeUnlink(tempPath);
    throw new Error(errorMessage);
  } finally {
    cleanupCookies(cookiePath);
  }
}
