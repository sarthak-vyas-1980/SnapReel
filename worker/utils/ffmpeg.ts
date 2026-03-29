import { exec } from "child_process";

export default function execPromise(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      command,
      { maxBuffer: 1024 * 1024 * 50 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("FFmpeg Command failed:");
          console.error(stderr);
          return reject(error);
        }
        resolve(stdout);
      }
    );
  });
}
