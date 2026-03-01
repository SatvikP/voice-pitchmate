
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
