

## Plan: Pitch Scoring Framework (0-100 with Ice/Fire Visuals)

### Scoring Framework

The AI will score each pitch on 5 equally-weighted dimensions (20 points each, totaling 100):

| Dimension | What it measures | 0 pts | 20 pts |
|-----------|-----------------|-------|--------|
| **Clarity** | Is the message clear and easy to follow? | Rambling, incoherent | Crystal clear, structured |
| **Specificity** | Concrete numbers, examples, results? | All buzzwords, no substance | Data-driven, measurable outcomes |
| **Confidence** | Decisive language, no hedging? | "I think maybe...", filler words | Assertive, commanding tone |
| **Differentiation** | Does it stand out from generic answers? | Could be anyone | Unique, memorable angle |
| **Impact** | Does it demonstrate value creation? | No evidence of results | Clear cause-and-effect achievements |

### Changes Required

**1. Database migration** -- Add a `score` integer column to `pitch_sessions`.

**2. Update `pitch-roast` edge function** -- Modify the prompt to instruct the AI to return a structured JSON response containing `roast` (text) and `score` (integer 0-100) with the 5 sub-scores. Parse the JSON from the AI response.

**3. Update `src/services/api.ts`** -- Update `roastPitch` to return `{ roast, score }` instead of just the roast string. Update `savePitchSession` to include the score. Update `PitchHistoryEntry` to include score.

**4. Create a `PitchScore` component** -- A visual score display:
- Shows the number (0-100) prominently
- Background gradient transitions from icy blue (0) to fire orange/red (100)
- Uses a snowflake icon near 0, flame icon near 100
- Animated fill bar showing the score
- Brief label: "Freezing" / "Cold" / "Lukewarm" / "Warm" / "Hot" / "On Fire"

**5. Update `Pitch.tsx`** -- Store and display the score alongside the roast text using the new component.

### Visual Thresholds

```text
0-15   → ❄️ Freezing   (deep blue)
16-35  → 🧊 Cold        (light blue)  
36-50  → 🌡️ Lukewarm   (gray/neutral)
51-70  → 🔥 Warm        (orange)
71-85  → 🔥 Hot         (deep orange)
86-100 → 🔥 On Fire     (red/flame)
```

