

## Plan: Replace Confidence → Structure across all prompts

Three files need the `confidence` → `structure` rename:

| File | Change |
|------|--------|
| `supabase/functions/pitch-roast/index.ts` | Update scoring table and JSON format in `SYSTEM_PROMPT` |
| `supabase/functions/backboard/index.ts` | Update scoring table in `INTERVIEW_JUDGE_PROMPT` |
| `src/components/PitchScore.tsx` | Rename `confidence` → `structure` in interface and labels |
| `src/services/api.ts` | Rename `confidence` → `structure` in `ScoreBreakdown` interface and defaults |

**New dimension definition:**
- **Structure** (0-20): Logical flow, clear beginning/middle/end, coherent narrative arc?

Replaces:
- ~~Confidence (0-20): Assertive language, no hedging, no filler words?~~

No database migration needed — breakdowns are not persisted in DB.

