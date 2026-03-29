-- Admin-Bypass RLS Policies for profiles and audit_logs
-- Allows the authorized admin (korekedar143@gmail.com) to view ALL user data

-- 1. Admin can view ALL profiles
CREATE POLICY "Admin can view all profiles"
ON public.profiles FOR SELECT
USING (
  auth.jwt() ->> 'email' = 'korekedar143@gmail.com'
);

-- 2. Admin can view ALL audit logs
CREATE POLICY "Admin can view all audit logs"
ON public.audit_logs FOR SELECT
USING (
  auth.jwt() ->> 'email' = 'korekedar143@gmail.com'
);

-- 3. Add audit triggers on profiles table (captures sign-ups & profile updates)
CREATE TRIGGER IF NOT EXISTS audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_data_access();

-- 4. Add audit triggers on wearable_data table (captures device syncs)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wearable_data' AND table_schema = 'public') THEN
    EXECUTE 'CREATE TRIGGER audit_wearable_data AFTER INSERT OR UPDATE OR DELETE ON public.wearable_data FOR EACH ROW EXECUTE FUNCTION public.log_data_access()';
  END IF;
END $$;
