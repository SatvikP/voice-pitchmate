CREATE TABLE public.pitch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  pitch_number INTEGER NOT NULL,
  transcript TEXT NOT NULL,
  roast TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pitch_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.pitch_sessions FOR ALL USING (true) WITH CHECK (true);