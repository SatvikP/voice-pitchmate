

## Analysis of Current State

**Current problems:**
1. The `roastPitch()` function accepts a `conversationHistory` param but it's **never passed** from `Pitch.tsx` -- the call on line 133 only sends `transcript`, no history.
2. Backboard stores pitch+roast after the fact, but that history is **never retrieved** before generating the next roast.
3. If Backboard fails (e.g. API key issues, service down), there's no fallback -- history is simply lost.
4. The database has **zero tables** -- no local persistence exists.

## Plan

### 1. Create a `pitch_sessions` database table

Store every pitch interaction locally as the reliable fallback and primary history source.

```sql
CREATE TABLE public.pitch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,        -- ties pitches from the same browser session
  pitch_number INTEGER NOT NULL,   -- 1, 2, 3... for ordering
  transcript TEXT NOT NULL,
  roast TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- No RLS needed -- this is a public-facing app without auth
ALTER TABLE public.pitch_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.pitch_sessions FOR ALL USING (true) WITH CHECK (true);
```

### 2. Update the `pitch-roast` edge function

- Accept a new `history` array parameter (list of previous `{transcript, roast}` pairs).
- Inject the full history into the system prompt so the AI can compare the current pitch against all previous ones.
- Update the system prompt to instruct the AI to explicitly reference improvements or regressions from prior pitches.

### 3. Update `src/services/api.ts`

- Add a `savePitchSession()` function that inserts into `pitch_sessions`.
- Add a `getPitchHistory()` function that retrieves all past pitches for the current `session_id`.
- Update `roastPitch()` to accept and forward the history array.

### 4. Update `Pitch.tsx` flow

- Generate a persistent `session_id` (stored in `localStorage`) to tie all pitches together across page reloads.
- Track `pitchNumber` (incremented each round).
- Before calling `roastPitch()`, fetch all previous pitches from the database via `getPitchHistory()`.
- Pass the history to `roastPitch()` so the AI has full context.
- After receiving the roast, save the transcript+roast to the database.
- **Also** attempt to save to Backboard (keep as secondary/optional). If Backboard fails, it's fine -- the database is the source of truth.

### 5. Update the AI system prompt

Revise the prompt in `pitch-roast/index.ts` to:
- When history is provided, explicitly compare the current pitch to previous ones.
- Call out specific improvements ("Last time you said X, now you said Y -- that's better because...").
- Identify recurring weaknesses that haven't been fixed.
- For first-time pitchers, give the standard roast with no comparison.

### Technical Details

**Data flow for subsequent pitches:**

```text
User taps orb → STT captures transcript → Confirm
  → Frontend fetches history from pitch_sessions table
  → Sends {transcript, history[]} to pitch-roast edge function
  → AI generates comparison-aware roast
  → Frontend saves {transcript, roast} to pitch_sessions
  → Frontend attempts Backboard save (fire-and-forget)
  → TTS speaks the roast
```

**Session identification:** A UUID generated once and stored in `localStorage` as `pitchroast_session_id`. This groups all pitches from the same user/device.

