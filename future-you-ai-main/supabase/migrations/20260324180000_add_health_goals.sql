-- Create a new migration to add health_goals to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS health_goals JSONB DEFAULT '[]'::jsonb;

-- Ensure RLS allows users to update their own health_goals (already covered by existing update policy, but good to verify)
COMMENT ON COLUMN public.profiles.health_goals IS 'Array of health improvement goals selected during onboarding';
