import "dotenv/config";

export function getYoutubeVideoId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
}

export async function getRapidApiVideoInfo(videoId: string): Promise<any> {
  const res = await fetch(
    `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${videoId}`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY!,
        "x-rapidapi-host": "ytstream-download-youtube-videos.p.rapidapi.com"
      }
    }
  );

  if (!res.ok) {
    throw new Error(`RapidAPI Error: ${res.status}`);
  }

  return res.json();
}

export function extractDownloadUrls(videoInfo: any) {
  const allFormats = [
    ...(videoInfo.formats || []),
    ...(videoInfo.adaptiveFormats || [])
  ];

  if (allFormats.length === 0) {
    throw new Error("No formats found in API response");
  }

  let validVideos = allFormats.filter(f => 
    f.mimeType?.includes("video/mp4") && f.url && !f.signatureCipher
  );

  if (validVideos.length === 0) {
    throw new Error("No valid downloadable mp4 URL found in API response");
  }

  validVideos.sort((a, b) => {
    const heightA = a.height || 0;
    const heightB = b.height || 0;
    if (heightA !== heightB) return heightB - heightA;
    return (b.bitrate || 0) - (a.bitrate || 0);
  });

  const bestVideo = validVideos[0];

  let audioUrl = null;
  if (!bestVideo.audioChannels && !bestVideo.audioQuality && !bestVideo.mimeType?.includes("audio")) {
    const validAudios = allFormats.filter(f => 
      f.mimeType?.includes("audio/mp4") && f.url && !f.signatureCipher
    );
    if (validAudios.length > 0) {
      validAudios.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      audioUrl = validAudios[0].url;
    }
  }

  return {
    videoUrl: bestVideo.url,
    audioUrl,
    duration: videoInfo.lengthSeconds || videoInfo.duration || (bestVideo.approxDurationMs ? bestVideo.approxDurationMs / 1000 : 0) || 0
  };
}
