

## Switch to OpenAI as Primary LLM

Currently the `pitch-roast` edge function uses the Lovable AI gateway (`ai.gateway.lovable.dev`) with `openai/gpt-5`. We'll switch it to call the OpenAI API directly using your own API key.

### Changes

1. **Add secret**: Store your `OPENAI_API_KEY` as a backend secret.

2. **Update `supabase/functions/pitch-roast/index.ts`**:
   - Change the API endpoint from `https://ai.gateway.lovable.dev/v1/chat/completions` to `https://api.openai.com/v1/chat/completions`
   - Change auth header from `LOVABLE_API_KEY` to `OPENAI_API_KEY`
   - Change model from `openai/gpt-5` to `gpt-4o` (or whichever OpenAI model you prefer)

No frontend changes needed — the edge function interface stays the same.

