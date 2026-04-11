import { exec } from "child_process";

const FFMPEG_THREADS = Math.max(1, Number(process.env.FFMPEG_THREADS || "2"));
const FFMPEG_FILTER_THREADS = Math.max(
  1,
  Number(process.env.FFMPEG_FILTER_THREADS || "1"),
);

function execPromise(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve(stdout);
    });
  });
}

export async function processClip(
  input: string,
  output: string,
  start: string,
  end: string,
  srtPath: string | null,
) {
  const scaleFilter =
    "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";

  let subtitleFilter = "";
  if (srtPath) {
    const escapedSrt = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:");
    subtitleFilter = `,subtitles='${escapedSrt}':force_style='Alignment=2,MarginV=60,Outline=1,BorderStyle=3,Fontsize=14'`;
  }

  const vf = `"${scaleFilter}${subtitleFilter}"`;
  const cmd = `ffmpeg -y -threads ${FFMPEG_THREADS} -filter_threads ${FFMPEG_FILTER_THREADS} -filter_complex_threads ${FFMPEG_FILTER_THREADS} -ss ${start} -to ${end} -i "${input}" -vf ${vf} -c:v libx264 -preset superfast -tune zerolatency -x264-params "threads=${FFMPEG_THREADS}:lookahead-threads=1" -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k "${output}"`;

  return execPromise(cmd);
}

export async function generateThumbnail(
  input: string,
  output: string,
  time: string,
) {
  const cmd = `ffmpeg -y -threads 1 -ss ${time} -i "${input}" -frames:v 1 -q:v 2 "${output}"`;
  return execPromise(cmd);
}
