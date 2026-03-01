

## Plan: Fix Status Indicator Text for Processing and Speaking Phases

### Problem
After the user stops recording and confirms, the small status text under the orb doesn't clearly show "Thinking..." during processing or "Speaking..." during AI feedback delivery. The user finds the current labels misleading.

### Changes to `src/pages/Pitch.tsx`

The status indicator section (lines 272-290) needs these updates:

1. **`processing` phase** — already shows "Thinking..." (line 282), this is correct
2. **`speaking` phase** — already shows "Speaking..." (line 280), this is correct  
3. **`confirming` phase** — currently shows "Confirm your pitch" (line 284). This is fine since user needs to tap Confirm.

The real issue: the **status indicator uses a `key` that doesn't change with phase**, so the animation may not re-render properly. The `motion.div` wrapper (line 266) has no `key` prop tied to phase, so text transitions may not visually update.

**Fix**: Wrap the status indicator content in an `AnimatePresence` with a `key` based on `phase` so transitions are visible, ensuring the user clearly sees the text change from "Listening..." → "Confirm your pitch" → "Thinking..." → "Speaking..." → "Tap to speak".

Single file change: `src/pages/Pitch.tsx` — refactor the status indicator block (lines 265-291) to use `AnimatePresence` with phase-keyed children for smooth, visible transitions between states.

