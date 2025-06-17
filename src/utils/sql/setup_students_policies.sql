-- Enable RLS on students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view their students" ON public.students;
DROP POLICY IF EXISTS "Users can view their own students" ON public.students;

-- Create policy for admins to manage all students in their madrassah
CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
      AND p.madrassah_id = students.madrassah_id
    )
  );

-- Create policy for teachers to view students in their section
CREATE POLICY "Teachers can view their students" ON public.students
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE ur.user_id = auth.uid()
      AND r.name = 'teacher'
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