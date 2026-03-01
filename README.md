# Voice PitchMate

Practice and perfect your elevator pitch with real-time AI feedback.

## What it does

Voice PitchMate is a web app that helps you rehearse your elevator pitch. You speak into the mic, and an AI coach roasts your delivery — scoring you on clarity, specificity, confidence, differentiation, and impact. Track your progress over time and watch your score improve.

## How it works

1. **Sign in** with Google
2. **Tap the orb** to start a 30-second pitch timer
3. **Speak your pitch** — real-time speech-to-text via Speechmatics
4. **Get roasted** — AI analyzes your pitch and delivers brutally honest feedback with a score out of 100
5. **Review history** — see your score trend over time on the History page

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Lovable Cloud (Supabase) — auth, database, edge functions
- **Speech-to-Text:** Speechmatics real-time transcription
- **Text-to-Speech:** Speechmatics TTS
- **AI Roasting:** Custom edge function with score breakdown
- **Session Memory:** Backboard.io for persistent AI assistant threads
- **Charts:** Recharts for score history visualization

## Project Structure

```
src/
├── components/       # Reusable UI components (GlowingOrb, PitchScore, AuthGuard)
├── pages/            # Route pages (Index, Auth, Pitch, History)
├── services/         # API layer (TTS, STT, Backboard, pitch roasting)
├── integrations/     # Lovable Cloud client & types
└── hooks/            # Custom React hooks
supabase/
└── functions/        # Edge functions (pitch-roast, speechmatics-token, speechmatics-tts, backboard)
```

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

## Live

[voice-pitchmate.lovable.app](https://voice-pitchmate.lovable.app)
