

## Plan: Google Login, Per-User Backboard Assistants, and Score History

### 1. Database Migration

Create a `user_assistants` table and add `user_id` to `pitch_sessions`:

```sql
-- New table: maps each user to their Backboard assistant
CREATE TABLE public.user_assistants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assistant_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_assistants ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_user_assistants_user_id ON public.user_assistants(user_id);
CREATE POLICY "Users manage own assistant" ON public.user_assistants
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add user_id to pitch_sessions
ALTER TABLE public.pitch_sessions ADD COLUMN user_id uuid;

-- Replace permissive policy with user-scoped policy
DROP POLICY "Allow all access" ON public.pitch_sessions;
CREATE POLICY "Users manage own pitches" ON public.pitch_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 2. Auth Page (`src/pages/Auth.tsx`)

Update to use `lovable.auth.signInWithOAuth("google")` instead of `supabase.auth.signInWithOAuth`. The Lovable Cloud managed module is already generated.

### 3. Route Protection (`src/App.tsx`)

- Add `/auth` and `/history` routes
- Create a simple auth guard component that redirects unauthenticated users to `/auth`
- Protect `/pitch` and `/history` routes

### 4. Index Page (`src/pages/Index.tsx`)

Navigate to `/auth` instead of `/pitch` on orb tap.

### 5. API Layer (`src/services/api.ts`)

- Remove `getOrCreateSessionId()` — no longer needed
- Update `getPitchHistory` to filter by `user_id` instead of `session_id`
- Update `savePitchSession` to include `user_id`
- Add `getUserAssistant()` and `saveUserAssistant()` functions

### 6. Pitch Page (`src/pages/Pitch.tsx`)

Refactor initialization:
- Get current user via `supabase.auth.getUser()`
- Check `user_assistants` table for existing assistant
- **New user**: Call `backboardAction("init_session")`, save assistant_id to `user_assistants`
- **Returning user**: Call `backboardAction("create_thread")` with existing assistant_id
- Remove all `localStorage`-based assistant/thread/session management
- Add logout button and history navigation link
- Pass `user_id` to save/fetch functions

### 7. History Page (`src/pages/History.tsx`) — New File

- Fetch all `pitch_sessions` for current user, ordered by `created_at`
- Line chart (using recharts) showing score progression over time
- List of past pitches with pitch number, score, date, and expandable roast text
- Navigation back to pitch page

### Summary of Changes

| File | Action |
|------|--------|
| Database | Migration: `user_assistants` table + `user_id` on `pitch_sessions` + RLS |
| `src/pages/Auth.tsx` | Use `lovable.auth.signInWithOAuth("google")` |
| `src/App.tsx` | Add `/auth`, `/history` routes + auth guard |
| `src/pages/Index.tsx` | Navigate to `/auth` |
| `src/services/api.ts` | User-scoped queries, remove session ID helper |
| `src/pages/Pitch.tsx` | Auth-based init, DB-stored assistants, logout/history buttons |
| `src/pages/History.tsx` | New — score chart + pitch history list |

