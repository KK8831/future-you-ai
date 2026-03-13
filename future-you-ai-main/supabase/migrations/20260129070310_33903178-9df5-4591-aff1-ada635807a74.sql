-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create lifestyle_entries table
CREATE TABLE public.lifestyle_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    entry_date DATE NOT NULL,
    physical_activity_minutes INTEGER NOT NULL DEFAULT 0 CHECK (physical_activity_minutes >= 0),
    sleep_hours NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    diet_quality_score INTEGER NOT NULL DEFAULT 5 CHECK (diet_quality_score >= 1 AND diet_quality_score <= 10),
    stress_level INTEGER NOT NULL DEFAULT 5 CHECK (stress_level >= 1 AND stress_level <= 10),
    screen_time_hours NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK (screen_time_hours >= 0 AND screen_time_hours <= 24),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, entry_date)
);

-- Enable RLS on lifestyle_entries
ALTER TABLE public.lifestyle_entries ENABLE ROW LEVEL SECURITY;

-- Lifestyle entries RLS policies
CREATE POLICY "Users can view their own lifestyle entries"
ON public.lifestyle_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lifestyle entries"
ON public.lifestyle_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lifestyle entries"
ON public.lifestyle_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lifestyle entries"
ON public.lifestyle_entries FOR DELETE
USING (auth.uid() = user_id);

-- Create simulations table
CREATE TABLE public.simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    activity_change_percent INTEGER DEFAULT 0,
    sleep_change_hours NUMERIC(2,1) DEFAULT 0,
    diet_change_score INTEGER DEFAULT 0,
    stress_change INTEGER DEFAULT 0,
    screen_change_hours NUMERIC(2,1) DEFAULT 0,
    timeframe_years INTEGER NOT NULL DEFAULT 5 CHECK (timeframe_years >= 1 AND timeframe_years <= 10),
    projected_health_score INTEGER,
    projected_risks JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on simulations
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- Simulations RLS policies
CREATE POLICY "Users can view their own simulations"
ON public.simulations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own simulations"
ON public.simulations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simulations"
ON public.simulations FOR DELETE
USING (auth.uid() = user_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER lifestyle_entries_updated_at
BEFORE UPDATE ON public.lifestyle_entries
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_lifestyle_entries_user_date ON public.lifestyle_entries(user_id, entry_date DESC);
CREATE INDEX idx_simulations_user ON public.simulations(user_id);