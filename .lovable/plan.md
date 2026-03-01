

## Show Live Transcript More Prominently During Pitch

The transcript is technically already updating in real time, but it's small, italic, and easy to miss below the orb. We'll make it more visible during the listening phase.

### Changes to `src/pages/Pitch.tsx`

1. **Move the transcript display above the orb** (or between the status text and orb) so it's front and center while speaking
2. **Make it larger and more readable during listening** — increase font size, remove italic, use a scroll area for longer text
3. **Style it differently during listening vs confirming** — give it a subtle card background and more width during the active pitch

This keeps the existing `currentTranscript` state and callbacks unchanged — purely a layout/styling improvement.

