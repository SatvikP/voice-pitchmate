## Plan: Restructure Backboard Edge Function for Interview Judging

### What exists now

The `backboard` edge function already supports `create_assistant`, `create_thread`, `send_message`, and `get_threads` as separate actions. The frontend (`Pitch.tsx`) calls them individually and stores IDs in localStorage. However, the assistant's system prompt is generic and the flow is fragmented — the assistant creation doesn't include a proper interview-judging prompt, and thread creation is a separate manual step.

### What we'll build

A new dedicated action `init_session` in the backboard edge function that:

1. **Creates an assistant** with a detailed interview-judging system prompt (covering the scoring framework, memory tracking, and interview coaching persona)
2. **Retrieves the assistant** using `GET /assistants/{assistant_id}` to confirm it was created
3. **Creates a thread** on that assistant for persistent memory
4. Returns both `assistant_id` and `thread_id` in one response

We'll also add a `get_assistant` action for standalone use.  
  
NOTE: The future sessions you don't have to create a new assistant. We'll use the same assistant that was created and we'll be creating new threads for that assistant. 

### Changes

**1. Update `supabase/functions/backboard/index.ts**`

- Add a new `init_session` action that chains: create assistant → get assistant → create thread, returning `{ assistant_id, thread_id, assistant }`
- The system prompt will be the full interview-judging prompt (same scoring framework as `pitch-roast` but tailored for Backboard's persistent memory role)
- Add a standalone `get_assistant` action (`GET /assistants/{assistant_id}`)

**2. Update `src/pages/Pitch.tsx**`

- Replace the two separate `backboardAction("create_assistant")` + `backboardAction("create_thread")` calls with a single `backboardAction("init_session")` call
- Still cache `assistant_id` and `thread_id` in localStorage for session persistence

**3. Update `src/services/api.ts**`

- No changes needed — `backboardAction` is already generic enough

### System prompt for the Backboard assistant

The assistant will be configured with a system prompt that makes it an interview judge with persistent memory:

- Remember every answer the candidate has given
- Track progress across attempts, identify recurring weaknesses
- Score on the 5-dimension framework (Clarity, Specificity, Confidence, Differentiation, Impact)
- Get progressively more specific with feedback over time

### API calls used


| Step             | Method | Endpoint                             |
| ---------------- | ------ | ------------------------------------ |
| Create assistant | `POST` | `/assistants`                        |
| Get assistant    | `GET`  | `/assistants/{assistant_id}`         |
| Create thread    | `POST` | `/assistants/{assistant_id}/threads` |
