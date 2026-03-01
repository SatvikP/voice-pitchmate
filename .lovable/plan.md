

## PitchRoast — Voice-First Pitch Coach for Founders

A mobile-first app where startup founders practice their 30-second pitch and get brutally honest AI feedback via voice, with persistent memory across sessions.

### Design System
- Copied exactly from the "Speak & Learn" reference project: warm cream/purple palette, DM Sans body font, Playfair Display headings, animated GlowingOrb component with purple/gold gradients
- Inspired by the Flow landing page: clean, elegant, mobile-first layout

---

### Pages & Flow

**1. Landing Page (`/`)**
- Hero: "Craft your pitch" in large serif text
- Animated GlowingOrb as the centerpiece
- "Tap to begin" prompt below → navigates to `/auth`
- Clean, minimal design matching the reference

**2. Auth Page (`/auth`)**
- Google OAuth login button (styled like reference project)
- Redirects to `/pitch` after login

**3. Pitch Session Page (`/pitch`)** — Core experience
- AI greets user with voice: *"Okay you have 30 seconds. What is your startup?"*
- Shows a 30-second countdown timer when user starts speaking
- GlowingOrb: tap to speak, animates while listening/speaking
- Speechmatics for real-time STT (user speaking) and TTS (AI responding)
- After user finishes, AI delivers a brutal roast of their pitch via voice
- Confirm/re-record flow for the transcript before sending to AI
- Conversation stored in Backboard.io for persistent memory

---

### Backend (Supabase Edge Functions)

1. **`speechmatics-token`** — Generates temporary JWT for Speechmatics realtime STT
2. **`speechmatics-tts`** — Converts AI response text to speech via Speechmatics TTS API
3. **`backboard`** — Proxy to Backboard.io API for assistant/thread/message management (persistent memory)
4. **`pitch-roast`** — Sends pitch transcript + conversation history to OpenAI with a brutal roast system prompt, returns targeted feedback

### AI Personality
- System prompt: Brutally honest VC/pitch coach persona
- Tears apart weak points: vague value props, buzzwords, missing traction, unclear market
- Remembers previous pitches via Backboard.io memory — tracks improvement over time
- Gets progressively more specific with advice as it learns the founder's startup

### Integrations
- **Speechmatics**: Real-time STT via WebSocket + TTS for AI voice responses
- **Backboard.io**: Persistent memory — creates an assistant per user, threads per session
- **OpenAI**: GPT for generating the pitch roast/feedback
- **Supabase Auth**: Google OAuth login

### Key Components (from reference project)
- `GlowingOrb` — Animated interactive orb (uses framer-motion)
- `SpeechmaticsRealtime` — WebSocket-based real-time transcription service
- `api.ts` — Service layer for TTS, audio playback, and Backboard.io actions

