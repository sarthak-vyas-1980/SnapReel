import { YoutubeTranscript } from "youtube-transcript";

export type TimedSegment = {
  text: string;
  offset: number;  // seconds
  duration: number; // seconds
};

/** Returns the full transcript as a single string (for AI prompt) */
export default async function getTranscript(videoId: string): Promise<string> {
  let transcriptList;
  try {
    transcriptList = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
  } catch (err) {
    console.log(`⚠️ English transcript unavailable for ${videoId}. Falling back to default language.`);
    transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
  }
  const text = transcriptList.map(t => t.text).join(" ");
  
  if (!text || text.length < 200) {
    throw new Error("Transcript unavailable or too short");
  }
  
  return text;
}

/** Returns transcript segments with timing data (for captions) */
export async function getTimedTranscript(videoId: string): Promise<TimedSegment[]> {
  let transcriptList;
  try {
    transcriptList = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
  } catch (err) {
    transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
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
