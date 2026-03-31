# 🎬 SnapReel — AI-Powered YouTube to Short-Form Video Generator

SnapReel is a full-stack AI SaaS application that converts long-form YouTube videos into engaging short-form reels using intelligent timestamp extraction, automated clipping, and optimized layouts.

Built with scalability, clean architecture, and production-readiness in mind.

---

### 🚀 Features

## 🎯 Core Functionality
- 🔗 Convert YouTube videos into short reels using a single link
- ✂️ Automatic clip selection using AI-generated timestamps
- 🎞️ Multi-clip generation per video (multiple reels from one input)
- 🎥 FFmpeg-based video trimming and processing
- ☁️ Cloud upload and storage (Supabase)

---

## 🧠 AI Integration
- 🤖 Smart transcript analysis for clip extraction
- 📊 Hook Score & Engagement Metrics
- ⏱️ Intelligent start/end timestamp generation

---

## 📊 Dashboard
- 📁 View all generated reels
- 🔍 Search reels by title
- 🏷️ Filter by status:
  - Completed
  - Processing
  - Failed
- ✏️ Rename reels dynamically

---

## 🎬 Reel Detail Page
- ▶️ Video player with processed reel
- 📈 AI Insights (Hook Score, Engagement Level)
- ⏳ Clip timing preview
- 🔗 Source video reference
- 📥 Download reel

---

## ⚙️ Processing System
- 🧵 Background job processing using BullMQ
- 🔁 Retry failed jobs
- 📡 Real-time status polling
- 📊 Progress tracking

---

## 🔐 Authentication System
- 🔑 Credentials-based login (email/password)
- 🌐 Google OAuth integration
- 🔒 Secure password hashing using bcrypt
- 🛡️ Protected routes using middleware

---

## 👤 Profile Management
- ✏️ Edit name and phone number (optional)
- 🖼️ Avatar upload support
- 🔐 Change password securely
- ⚠️ Delete account with full data cleanup

---

## 🔔 Notification System
- 🔔 Real-time notifications for reel status (completed/failed)
- 🔄 Background-triggered notifications from worker events
- 📡 Lightweight polling-based updates (no WebSockets)
- 📬 In-app notification panel with unread indicators

---

## 🎨 UI/UX Features
- 🧩 Modular component architecture
- 🌗 Light/Dark mode support (persisted)
- 📱 Fully responsive design
- 🎯 Clean, minimal, production-grade UI
- ⚡ Smooth transitions (no heavy animations)

---

## 🏗️ Architecture Highlights
- 🧱 Clean separation of concerns:
  - Worker logic (video processing)
  - API routes
  - UI components
- 📦 Utility-based backend structure (`worker/utils`)
- 🔁 Reusable frontend components (`components/*`)
- 🧠 Centralized session handling

---

### 🛠️ Tech Stack

## Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Backend
- Node.js
- BullMQ (Queue processing)
- FFmpeg

## Database & Auth
- PostgreSQL (via Prisma)
- NextAuth.js
- Supabase (storage)

## AI & APIs
- Transcript extraction APIs
- Custom AI scoring logic

---

### 📂 Project Structure
```
snapreel/
│
├── app/ # Next.js app router pages
├── components/ # Reusable UI components
├── lib/ # Auth, session, utilities
├── worker/ # Background processing logic
│ └── utils/ # Extracted helper modules
├── prisma/ # Database schema
├── public/ # Static assets
```

---

## ⚡ Key Engineering Decisions

- 🔄 Extracted worker utilities for better maintainability
- 🧠 Centralized session handling to avoid duplication
- 🎯 Component modularization (50+ line rule)
- 🎨 UI kept simple and explainable (no over-engineering)
- ⚙️ Background jobs to handle heavy video processing

---

### 🧪 How to Run Locally

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev

# Start worker (in a separate terminal)
npm run worker
```

---

## 📌 Future Improvements

- 📊 Analytics dashboard (reel performance insights)
- 🧠 Enhanced AI scoring models (better hook & engagement prediction)
- 🎬 Timeline-based clip editor (manual adjustment of clips)
- 🏷️ Tagging & categorization of reels
- 📱 Mobile-first UI optimizations
- 🌐 Public shareable reel links
- 💾 Draft & version history for generated reels

---

## 💡 Learnings
- Scalable job queue architecture
- Real-world video processing pipelines
- Authentication + session management
- Clean UI component structuring
- Full-stack production design thinking

---

👨‍💻 Author

Sarthak Vyas
Computer Science Engineering Student
