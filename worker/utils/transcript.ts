import { YoutubeTranscript } from "youtube-transcript";

export type TimedSegment = {
  text: string;
  offset: number;  // seconds
  duration: number; // seconds
};

/** Small delay for retry logic */
function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

/** Returns the full transcript as a single string (for AI prompt) */
export default async function getTranscript(videoUrl: string): Promise<string> {
  let transcriptList;
  try {
    transcriptList = await YoutubeTranscript.fetchTranscript(videoUrl, { lang: 'en' });
  } catch (err) {
    console.log(`⚠️ English transcript unavailable for ${videoUrl}. Falling back to default language.`);
    try {
      transcriptList = await YoutubeTranscript.fetchTranscript(videoUrl);
    } catch (retryErr: any) {
      // One retry after a brief delay — transient failures are common in containers
      console.log(`⚠️ First default-language attempt failed. Retrying in 3s...`);
      await delay(3000);
      transcriptList = await YoutubeTranscript.fetchTranscript(videoUrl);
    }
  }
  const text = transcriptList.map(t => t.text).join(" ");
  
  if (!text || text.length < 200) {
    throw new Error("Transcript unavailable or too short");
  }
  
  return text;
}

/** Returns transcript segments with timing data (for captions) */
export async function getTimedTranscript(videoUrl: string): Promise<TimedSegment[]> {
  let transcriptList;
  try {
    transcriptList = await YoutubeTranscript.fetchTranscript(videoUrl, { lang: 'en' });
  } catch (err) {
    console.log(`⚠️ English timed transcript unavailable. Trying default language...`);
    try {
      transcriptList = await YoutubeTranscript.fetchTranscript(videoUrl);
    } catch (retryErr: any) {
      console.log(`⚠️ Default language also failed. Retrying in 3s...`);
      await delay(3000);
      transcriptList = await YoutubeTranscript.fetchTranscript(videoUrl);
    }
  }
  
  if (!transcriptList || transcriptList.length === 0) {
    throw new Error("Timed transcript unavailable");
  }

  return transcriptList.map(t => ({
    text: t.text,
    offset: t.offset / 1000,    // convert ms to seconds
    duration: t.duration / 1000  // convert ms to seconds
  }));
}
