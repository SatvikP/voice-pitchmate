

## Fix: Only cut off at 30s, not on silence

**Problem**: The `onEndOfUtterance` callback from Speechmatics fires after 0.7s of silence, which stops the recording early. The user should be able to speak for the full 30 seconds, pausing as needed.

### Changes

**`src/pages/Pitch.tsx`** — Remove the `onEndOfUtterance` callback so silence doesn't end the session early. Only the 30s timer should trigger the cutoff:

- Remove the `onEndOfUtterance` handler from the `SpeechmaticsRealtime` constructor (lines ~96-103 in `startListening`)
- In the timer's `setInterval` callback (line ~82), when `prev <= 1`, ensure the phase transitions to `"confirming"` and STT stops — this already works correctly
- Keep `onFinalTranscript` to accumulate the transcript text as the user speaks

This is a small, surgical change — just removing the early cutoff trigger while keeping everything else intact.

