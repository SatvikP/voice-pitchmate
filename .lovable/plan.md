

## Plan: Create comprehensive README.md

Replace the current placeholder README with a detailed project overview based on codebase analysis.

### Content to include

**Project**: Voice PitchMate -- an AI-powered elevator pitch coach that listens to your pitch via voice, transcribes it in real-time, scores it on 5 dimensions, and delivers brutally honest spoken feedback.

**Key sections**:

1. **Overview** -- What the app does: voice-based pitch practice with AI scoring and TTS feedback
2. **Features**:
   - Google OAuth authentication
   - 30-second timed pitch recording via Speechmatics real-time STT
   - AI scoring on 5 dimensions (Clarity, Specificity, Structure, Differentiation, Impact) out of 100
   - Spoken AI feedback via Speechmatics TTS
   - Persistent memory across sessions via Backboard.io assistants
   - Score history with trend visualization (recharts)
   - Per-user data persistence
3. **Tech Stack**:
   - Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Recharts
   - Backend: Lovable Cloud (Edge Functions, Auth, Database)
   - AI: OpenAI GPT-4o for scoring/roasting
   - Speech: Speechmatics (real-time STT + TTS)
   - Memory: Backboard.io (persistent assistant context)
4. **Architecture** -- Edge functions overview: `pitch-roast`, `speechmatics-token`, `speechmatics-tts`, `backboard`
5. **Scoring Framework** -- The 5-dimension breakdown table
6. **Getting Started** -- Local dev setup steps
7. **Environment Variables** -- Required secrets (OPENAI_API_KEY, SPEECHMATICS_API_KEY, BACKBOARD_API_KEY)

### File change

| File | Action |
|------|--------|
| `README.md` | Overwrite with comprehensive project documentation |

