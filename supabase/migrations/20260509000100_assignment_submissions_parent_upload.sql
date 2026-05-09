-- Add parent_note column for free-text submissions
ALTER TABLE public.teacher_assignment_submissions
  ADD COLUMN IF NOT EXISTS parent_note text;

-- Storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-submissions', 'assignment-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their child's folder (path checked client-side)
CREATE POLICY "Auth can upload submissions" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assignment-submissions');

-- Authenticated users can read submissions
CREATE POLICY "Auth can read submissions" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'assignment-submissions');
