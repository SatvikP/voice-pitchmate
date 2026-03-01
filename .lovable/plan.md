

## Diagnosis

The TTS backend function is working correctly (confirmed by direct test — returns valid WAV audio, status 200). The problem is **browser autoplay policy**.

The greeting audio fires inside a `useEffect` on page load — no user gesture has occurred yet. Modern browsers (Chrome, Safari, Firefox) silently reject `audio.play()` without a prior user interaction (click/tap). The `.catch(reject)` in `playAudio` catches it, but it's swallowed by the `try/catch` in the Pitch component, so it fails silently.

This also explains why roast feedback audio may not play — if the greeting failed, the browser may continue blocking audio for the session.

## Plan

### 1. Add an "unlock audio" interaction before auto-playing the greeting

Instead of immediately playing the greeting TTS on mount, show a "Start Session" button on the Pitch page. When the user clicks it, that click counts as a user gesture, unlocking `audio.play()` for the session. Then proceed with the greeting TTS and all subsequent audio.

**File: `src/pages/Pitch.tsx`**
- Add a new phase `"ready"` before `"greeting"` — show a "Start" button
- On button click, transition to `"greeting"` and run the init flow (Backboard setup + greeting TTS)
- Move the TTS greeting logic out of `useEffect` and into a click handler
- This ensures all `audio.play()` calls happen in a user-gesture context

### 2. Add an AudioContext unlock fallback

**File: `src/services/api.ts`**
- In `playAudio`, add a silent AudioContext resume before playing, as an additional unlock mechanism:
  ```ts
  const ctx = new AudioContext();
  await ctx.resume();
  ctx.close();
  ```

This two-part fix ensures the greeting plays on first visit, and all subsequent roast audio plays reliably.

