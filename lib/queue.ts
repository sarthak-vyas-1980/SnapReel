import { Queue } from "bullmq"

export const reelQueue = new Queue("reel-processing", {
  connection: {
    host: "127.0.0.1",
    port: 6379,
  },
})
