import { YoutubeTranscript } from "youtube-transcript";

export default async function getTranscript(videoId: string): Promise<string> {
  const transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
  const text = transcriptList.map(t => t.text).join(" ");
  
  if (!text || text.length < 200) {
    throw new Error("Transcript unavailable or too short");
  }
  
  return text;
}
