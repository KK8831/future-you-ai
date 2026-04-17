-- Add gamification column (consecutive daily entries) to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_entry_date DATE;

-- Update RLS if necessary to allow users to update their own streak
-- (Assume policies on profiles already allow UPDATE to authenticated user equals id, 
-- but ensuring it's robust)
