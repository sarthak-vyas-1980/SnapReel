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

  // Group into ~3-second caption blocks for readability
  const captionBlocks: { start: number; end: number; text: string }[] = [];
  let currentBlock: { start: number; end: number; texts: string[] } | null = null;

  for (const seg of clippedSegments) {
    const segStart = Math.max(seg.offset - startSec, 0);
    const segEnd = Math.min(seg.offset + seg.duration - startSec, endSec - startSec);

    if (!currentBlock) {
      currentBlock = { start: segStart, end: segEnd, texts: [seg.text] };
    } else if (segStart - currentBlock.start < 1.5 && currentBlock.texts.join(" ").split(/\s+/).length < 5) {
      // Merge into current block if within 1.5 seconds AND current block has less than 5 words
      currentBlock.end = segEnd;
      currentBlock.texts.push(seg.text);
    } else {
      // Finalize current block, start new one
      captionBlocks.push({
        start: currentBlock.start,
        end: currentBlock.end,
        text: currentBlock.texts.join(" ").trim()
      });
      currentBlock = { start: segStart, end: segEnd, texts: [seg.text] };
    }
  }

  // Don't forget the last block
  if (currentBlock) {
    captionBlocks.push({
      start: currentBlock.start,
      end: currentBlock.end,
      text: currentBlock.texts.join(" ").trim()
    });
  }

  // Build SRT content
  const srtLines = captionBlocks.map((block, i) => {
    const cleanText = block.text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .toUpperCase();

    // Wrap lines at ~4 words to keep captions compact (NEVER truncate words)
    const words = cleanText.split(/\s+/);
    const lines: string[] = [];
    for (let w = 0; w < words.length; w += 4) {
      lines.push(words.slice(w, w + 4).join(" "));
    }
    const wrappedText = lines.join("\n");

    return `${i + 1}\n${toSRTTime(block.start)} --> ${toSRTTime(block.end)}\n${wrappedText}\n`;
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
