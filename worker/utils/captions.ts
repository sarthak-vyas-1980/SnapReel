import fs from "fs";
import path from "path";
import { TimedSegment } from "./transcript";

/**
 * Convert seconds to SRT timestamp format: HH:MM:SS,mmm
 */
function toSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

/**
 * Parse HH:MM:SS or MM:SS timestamp to seconds
 */
function parseTimestamp(ts: string): number {
  if (!ts) return 0;
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

/**
 * Generate an SRT subtitle file from timed transcript segments for a specific clip range.
 * Timestamps are shifted so the clip starts at 0:00.
 */
export function generateSRT(
  segments: TimedSegment[],
  clipStart: string,
  clipEnd: string
): string {
  const startSec = parseTimestamp(clipStart);
  const endSec = parseTimestamp(clipEnd);

  // Filter segments that overlap with the clip range
  const clippedSegments = segments.filter(seg => {
    const segEnd = seg.offset + seg.duration;
    return seg.offset < endSec && segEnd > startSec;
  });

  if (clippedSegments.length === 0) return "";

  // Group into very short caption blocks (max 4 words)
  const captionBlocks: { start: number; end: number; text: string }[] = [];

  for (const seg of clippedSegments) {
    const segStart = Math.max(seg.offset - startSec, 0);
    const segEnd = Math.min(seg.offset + seg.duration - startSec, endSec - startSec);
    const words = seg.text.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) continue;

    // If segment has many words, split it into multiple tiny blocks
    if (words.length > 4) {
      const durationPerWord = (segEnd - segStart) / words.length;
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(" ");
        captionBlocks.push({
          start: segStart + (i * durationPerWord),
          end: segStart + (Math.min(i + 3, words.length) * durationPerWord),
          text: chunk
        });
      }
    } else {
      captionBlocks.push({
        start: segStart,
        end: segEnd,
        text: words.join(" ")
      });
    }
  }

  return buildSRTContent(captionBlocks);
}

/**
 * Generate approximate SRT captions from plain transcript text when timed segments are unavailable.
 * Evenly distributes the transcript text across the clip duration.
 */
export function generateApproximateSRT(
  transcript: string,
  clipStart: string,
  clipEnd: string
): string {
  const startSec = parseTimestamp(clipStart);
  const endSec = parseTimestamp(clipEnd);
  const clipDuration = endSec - startSec;

  if (clipDuration <= 0 || !transcript || transcript.trim().length === 0) return "";

  const words = transcript.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  // Take a proportional slice of the transcript based on clip position
  // Assume ~2.5 words per second for average speech rate
  const wordsPerSecond = 2.5;
  const estimatedTotalDuration = words.length / wordsPerSecond;

  // Calculate which portion of the transcript corresponds to this clip's time range
  const wordStart = Math.floor((startSec / Math.max(estimatedTotalDuration, endSec)) * words.length);
  const wordEnd = Math.min(
    Math.ceil((endSec / Math.max(estimatedTotalDuration, endSec)) * words.length),
    words.length
  );

  const clipWords = words.slice(wordStart, wordEnd);
  if (clipWords.length === 0) return "";

  // Build caption blocks: ~3 words each, evenly spaced across clip duration
  const WORDS_PER_BLOCK = 3;
  const captionBlocks: { start: number; end: number; text: string }[] = [];
  const totalBlocks = Math.ceil(clipWords.length / WORDS_PER_BLOCK);
  const blockDuration = clipDuration / totalBlocks;

  for (let i = 0; i < clipWords.length; i += WORDS_PER_BLOCK) {
    const chunk = clipWords.slice(i, i + WORDS_PER_BLOCK).join(" ");
    const blockIndex = Math.floor(i / WORDS_PER_BLOCK);
    captionBlocks.push({
      start: blockIndex * blockDuration,
      end: (blockIndex + 1) * blockDuration,
      text: chunk,
    });
  }

  return buildSRTContent(captionBlocks);
}

/**
 * Shared: build SRT text from caption blocks.
 */
function buildSRTContent(captionBlocks: { start: number; end: number; text: string }[]): string {
  if (captionBlocks.length === 0) return "";

  const srtLines = captionBlocks.map((block, i) => {
    const cleanText = block.text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .toUpperCase()
      .trim();

    return `${i + 1}\n${toSRTTime(block.start)} --> ${toSRTTime(block.end)}\n${cleanText}\n`;
  });

  return srtLines.join("\n");
}

/**
 * Write SRT content to a temp file and return the path.
 * Returns null if no captions available.
 */
export function writeSRTFile(
  srtContent: string,
  outputDir: string,
  clipId: string
): string | null {
  if (!srtContent || srtContent.trim().length === 0) return null;

  const srtPath = path.join(outputDir, `${clipId}.srt`);
  fs.writeFileSync(srtPath, srtContent, "utf-8");
  return srtPath;
}
