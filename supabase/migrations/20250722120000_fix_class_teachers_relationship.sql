-- Drop the existing class_teachers table to ensure a clean slate
DROP TABLE IF EXISTS public.class_teachers;

-- Ensure the old teacher_id column is removed from the classes table
ALTER TABLE public.classes DROP COLUMN IF EXISTS teacher_id;

-- Re-create the class_teachers table with the correct foreign key to the profiles table
CREATE TABLE public.class_teachers (
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, teacher_id)
);

-- Apply row-level security to the new table
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to manage all class-teacher relationships
CREATE POLICY "Admins can manage class teacher relationships" ON public.class_teachers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Policy: Allow authenticated users to view class-teacher relationships
CREATE POLICY "Authenticated users can view class teacher relationships" ON public.class_teachers
  FOR SELECT TO authenticated
  USING (true); 