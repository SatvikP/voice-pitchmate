

## Plan: Display Welcome Message Text During Greeting Speech

### Problem
When the AI speaks the greeting ("Okay candidate, you have 30 seconds. Tell me about yourself?"), users have no visual text showing what's being said, leading to confusion.

### Solution
Display the greeting text on screen while the AI is speaking it, reusing the same transcript area already used for user speech.

### Changes to `src/pages/Pitch.tsx`

1. **Add `greeting_speaking` to the `Phase` type** to distinguish greeting speech from roast speech
2. **Store the greeting text** in a variable and display it in the transcript area during `greeting_speaking`
3. **Update status text**: Show "Welcome" during `greeting_speaking` instead of "Listening to your roast..."
4. **Update the transcript section** (~line 262): When phase is `greeting_speaking`, show the greeting message text (e.g., "Okay candidate, you have 30 seconds. Tell me about yourself?") in the same italic transcript style
5. **Update `init` function** (~line 80): Set phase to `greeting_speaking` instead of `speaking` before greeting TTS
6. **Block orb clicks** during `greeting_speaking` (line ~192)
7. **Update status indicator** (~line 245): Show "Speaking..." for `greeting_speaking`

### Result
Users see the spoken greeting as text on screen in real-time, making it clear what the AI is saying and that they should wait before speaking.

