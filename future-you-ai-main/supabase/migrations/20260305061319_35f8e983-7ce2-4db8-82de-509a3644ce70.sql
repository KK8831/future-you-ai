
-- Phase 1: Expand profiles with additional health fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS smoking_status text DEFAULT 'non-smoker',
  ADD COLUMN IF NOT EXISTS alcohol_weekly_units numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS family_history_cvd boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS family_history_diabetes boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS blood_pressure_systolic integer DEFAULT null,
  ADD COLUMN IF NOT EXISTS blood_pressure_diastolic integer DEFAULT null,
  ADD COLUMN IF NOT EXISTS mental_health_index integer DEFAULT null;

-- Add wearable data table for future integrations
CREATE TABLE IF NOT EXISTS public.wearable_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  data_type text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  synced_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.wearable_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wearable data"
  ON public.wearable_data FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wearable data"
  ON public.wearable_data FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wearable data"
  ON public.wearable_data FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Add AI agent sessions table for multi-agent tracking
CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  input_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  agent_outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  final_result jsonb DEFAULT null,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone DEFAULT null
);

ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent sessions"
  ON public.agent_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent sessions"
  ON public.agent_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent sessions"
  ON public.agent_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
