
-- Add health profile fields for medical calculators (Framingham/FINDRISC)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sex TEXT DEFAULT 'unspecified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_cm NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;

-- Create audit_logs table for HIPAA-style access tracking
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.log_data_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, details)
  VALUES (
    COALESCE(auth.uid(), COALESCE(NEW.user_id, OLD.user_id)),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    jsonb_build_object('timestamp', now())
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach audit triggers to sensitive health data tables
CREATE TRIGGER audit_lifestyle_entries
AFTER INSERT OR UPDATE OR DELETE ON public.lifestyle_entries
FOR EACH ROW EXECUTE FUNCTION public.log_data_access();

CREATE TRIGGER audit_simulations
AFTER INSERT OR UPDATE OR DELETE ON public.simulations
FOR EACH ROW EXECUTE FUNCTION public.log_data_access();
