-- Allow teachers to update students in their section
-- This policy allows teachers to edit students they manage

-- Add UPDATE policy for teachers on students table
CREATE POLICY "Teachers can update their students" ON public.students
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
      AND p.madrassah_id = students.madrassah_id
      AND p.section = students.section
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
      AND p.madrassah_id = students.madrassah_id
      AND p.section = students.section
    )
  );

-- Also allow teachers to insert new students in their section
CREATE POLICY "Teachers can add students to their section" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
      AND p.madrassah_id = students.madrassah_id
      AND p.section = students.section
    )
  ); 