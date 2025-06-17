-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view their students" ON public.students;
DROP POLICY IF EXISTS "Users can view their own students" ON public.students;

-- Enable RLS on students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all students in their madrassah
CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.madrassah_id = students.madrassah_id
    )
  );

-- Create policy for teachers to view students in their section
CREATE POLICY "Teachers can view their students" ON public.students
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
      AND p.madrassah_id = students.madrassah_id
      AND p.section = students.section
    )
  );

-- Create policy for users to view their own students (if they are students)
CREATE POLICY "Users can view their own students" ON public.students
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
  ); 