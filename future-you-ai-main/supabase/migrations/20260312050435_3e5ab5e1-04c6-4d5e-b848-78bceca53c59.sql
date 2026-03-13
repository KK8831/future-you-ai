-- Create storage bucket for medical report images
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-reports', 'medical-reports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: users can upload their own reports
CREATE POLICY "Users can upload medical reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medical-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy: users can view their own reports
CREATE POLICY "Users can view their own medical reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'medical-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy: users can delete their own medical reports
CREATE POLICY "Users can delete their own medical reports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'medical-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create medical_reports table for tracking OCR results
CREATE TABLE IF NOT EXISTS public.medical_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  file_path text,
  extracted_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'camera_ocr',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own medical reports"
ON public.medical_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own medical reports"
ON public.medical_reports FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medical reports"
ON public.medical_reports FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow updates on wearable_data
CREATE POLICY "Users can update their own wearable data"
ON public.wearable_data FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);