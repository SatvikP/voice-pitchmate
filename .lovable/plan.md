

## Analysis: All Startup/Pitch References That Need to Become Interview-Focused

I found references across **6 files** that still use "startup", "founder", "pitch" (in a startup context), or similar language. Here's the full inventory and the planned changes:

### 1. `supabase/functions/pitch-roast/index.ts` (Edge Function — Main AI Prompt)

The system prompt is already partially updated to say "InterviewRoaster" and "interview coach", but still contains leftover startup language:

- **Line 14**: `"bad pitch"` — change to `"bad answer"`
- **Line 23**: `"Mediocre feedback creates mediocre startups"` — change to `"Mediocre feedback creates mediocre candidates"`
- **Line 37**: `"Most first pitches score 15-40"` — change to `"Most first answers score 15-40"`
- **Line 58**: `"For first-time pitchers"` — change to `"For first-time candidates"`
- **Line 82**: `"founder's complete pitch history"` — change to `"candidate's complete answer history"`
- **Line 88**: `"founder's ... 30-second pitch"` — change to `"candidate's ... 30-second answer"`

### 2. `src/pages/Pitch.tsx` (Frontend — Main Flow)

- **Line 34**: `const name = "founder"` — change to `"candidate"`
- **Line 51**: `name: PitchRoast - ${name}` — change to `InterviewRoast - ${name}`
- **Line 52**: `"You are PitchRoast, a brutally honest interview coach. You remember every pitch this founder has given you."` — change "pitch" → "answer", "founder" → "candidate"
- **Line 73**: Greeting: `"you have 30 seconds. Tell me about yourself?"` — this is already interview-appropriate, keep as-is
- **Line 163**: `FOUNDER'S PITCH #${pitchNumber}` — change to `CANDIDATE'S ANSWER #${pitchNumber}`

### 3. `src/pages/Index.tsx` (Landing Page)

- **Line 31**: `"Craft your pitch"` — change to `"Ace your interview"`
- **Line 40**: `"Get brutally feedback on your elevator pitch"` — change to `"Get brutal feedback on your interview answers"` (also fixes typo "brutally")

### 4. `src/pages/Auth.tsx` (Auth Page)

- **Line 47**: `"Sign in to get your pitch roasted"` — change to `"Sign in to get your interview roasted"`

### 5. `supabase/functions/backboard/index.ts` (Backboard Default)

- **Line 28**: `"PitchRoast Assistant"` — change to `"InterviewRoast Assistant"`
- **Line 29**: `"You are a brutally honest pitch coach."` — change to `"You are a brutally honest interview coach."`

### 6. `src/services/api.ts` (API Layer)

- No user-facing text changes needed. The localStorage keys (`pitchroast_session_id`, etc.) and function names are internal identifiers — changing them would break existing sessions. These stay as-is.

### Summary

All changes are text/copy only — no logic, no database, no structural changes. The AI prompt, landing page, auth page, Backboard defaults, and frontend messages will all consistently use "interview" language instead of "startup/pitch/founder".

