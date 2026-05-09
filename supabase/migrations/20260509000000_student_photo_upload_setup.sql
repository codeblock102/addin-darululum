-- Add photo_url column on students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (admin/teacher) to upload
CREATE POLICY "Auth can upload student photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-photos');

-- Allow authenticated users to update/delete (admin/teacher)
CREATE POLICY "Auth can update student photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'student-photos');

CREATE POLICY "Auth can delete student photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'student-photos');

-- Public read (bucket is public anyway)
CREATE POLICY "Public read student photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'student-photos');
