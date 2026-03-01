# 🎙️ Voice PitchMate

An AI-powered elevator pitch coach that listens to your pitch via voice, transcribes it in real-time, scores it on 5 dimensions, and delivers brutally honest spoken feedback.

**Live:** [voice-pitchmate.lovable.app](https://voice-pitchmate.lovable.app)

---

## ✨ Features

- **Google OAuth** — Sign in with Google to persist your data across sessions
- **30-Second Timed Recording** — Speak your pitch with a countdown timer and real-time transcription via Speechmatics STT
- **AI Scoring (0–100)** — GPT-4o scores every pitch on 5 dimensions with harsh, actionable feedback
- **Spoken Feedback** — AI roast is read back to you via Speechmatics Text-to-Speech
- **Persistent Memory** — Backboard.io assistants remember your previous pitches across sessions, tracking progress and recurring weaknesses
- **Score History & Trends** — Visualize your improvement over time with interactive charts (Recharts)
- **Per-User Data Persistence** — All pitch transcripts, scores, and roasts stored per user

---

## 📊 Scoring Framework

Each pitch is scored on **5 dimensions** (0–20 points each, totaling 0–100):

| Dimension | What it measures |
|---|---|
| **Clarity** | Is the message clear, structured, easy to follow? |
| **Specificity** | Concrete numbers, data, examples, measurable outcomes? |
| **Structure** | Logical flow, clear beginning/middle/end, coherent narrative arc? |
| **Differentiation** | Does it stand out? Unique angle vs generic answer? |
| **Impact** | Evidence of value creation, cause-and-effect achievements? |

Most first pitches score **15–40**. A **70+** is genuinely impressive. **90+** is world-class.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| **Charts** | Recharts |
| **Backend** | Lovable Cloud (Edge Functions, Auth, Database) |
| **AI** | OpenAI GPT-4o (scoring & roasting) |
| **Speech** | Speechmatics (real-time STT + TTS) |
| **Memory** | Backboard.io (persistent assistant context) |

---

## 🔧 Architecture

### Routes

| Route | Description |
|---|---|
| `/` | Landing page with animated orb CTA |
| `/auth` | Google OAuth sign-in |
| `/pitch` | Main pitch recording & feedback screen (auth-protected) |
| `/history` | Score history with trend charts (auth-protected) |

### Edge Functions

| Function | Purpose |
|---|---|
| `pitch-roast` | Sends transcript + history to GPT-4o, returns scored roast with 5-dimension breakdown |
| `speechmatics-token` | Generates short-lived JWT for Speechmatics real-time STT WebSocket |
| `speechmatics-tts` | Converts roast text to spoken audio via Speechmatics TTS API |
| `backboard` | Manages Backboard.io assistants and threads for persistent cross-session memory |

### Database Tables

| Table | Purpose |
|---|---|
| `pitch_sessions` | Stores transcript, roast, score, and pitch number per user |
| `user_assistants` | Maps users to their Backboard.io assistant IDs |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd voice-pitchmate

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## 🔑 Environment Variables

The following secrets must be configured in the backend for Edge Functions to work:

| Secret | Used by |
|---|---|
| `OPENAI_API_KEY` | `pitch-roast` — GPT-4o scoring |
| `SPEECHMATICS_API_KEY` | `speechmatics-token`, `speechmatics-tts` — STT & TTS |
| `BACKBOARD_API_KEY` | `backboard` — persistent memory assistants |

Frontend env vars (auto-configured by Lovable Cloud):

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Backend API base URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public anon key for client SDK |

---

## 📄 License

Private project. All rights reserved.
