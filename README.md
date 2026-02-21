# 🎬 SnapReel

Turn long YouTube videos into AI-powered short-form reels automatically.

SnapReel extracts the most engaging segment from a YouTube video using AI, trims it, generates a thumbnail, and uploads everything to cloud storage — all processed in the background.

---

## 🚀 Features

- 🤖 AI-powered timestamp detection
- 🎬 Automatic reel trimming using FFmpeg
- 🖼 Thumbnail generation
- ⚡ Background job processing with BullMQ + Redis
- ☁️ Supabase cloud storage integration
- 🔐 Authentication with NextAuth
- 📊 Live processing progress updates
- ✏️ Rename reels
- 🔍 Search by reel name
- 🗑 Delete reels
- 🔗 Copy reel URL

---

## 🛠 Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

**Backend**
- Node.js
- Prisma ORM
- PostgreSQL (Supabase)

**Processing**
- BullMQ
- Redis
- yt-dlp
- FFmpeg

**AI**
- OpenAI API (GPT model for timestamp selection)

---

## 🧠 How It Works

1. User submits YouTube URL
2. Job is queued in Redis
3. Worker:
   - Fetches metadata
   - Extracts transcript
   - Uses AI to determine best 30–60 sec segment
   - Downloads video
   - Trims segment
   - Generates thumbnail
   - Uploads to Supabase
4. Dashboard updates in real-time

---

## 📦 Installation

```bash
git clone https://github.com/yourusername/snapreel.git
cd snapreel
npm install
```
Create a .env file: and put all env variables
```bash
npm run dev
npm run worker
```