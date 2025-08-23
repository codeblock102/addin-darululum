-- Create enum for assignment status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
    CREATE TYPE assignment_status AS ENUM ('pending', 'completed', 'overdue');
  END IF;
END$$;

-- Create helper function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for teacher-created assignments
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  status assignment_status NOT NULL DEFAULT 'pending',
  attachment_name text,
  attachment_url text,
  class_ids uuid[] NOT NULL DEFAULT '{}',
  student_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger to keep updated_at current
DROP TRIGGER IF EXISTS set_teacher_assignments_updated_at ON public.teacher_assignments;
CREATE TRIGGER set_teacher_assignments_updated_at
BEFORE UPDATE ON public.teacher_assignments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON public.teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_due_date ON public.teacher_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_status ON public.teacher_assignments(status);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_ids ON public.teacher_assignments USING GIN (class_ids);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_student_ids ON public.teacher_assignments USING GIN (student_ids);

-- Enable Row Level Security
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Policies: teachers can manage their own assignments
DROP POLICY IF EXISTS "select_own_assignments" ON public.teacher_assignments;
CREATE POLICY "select_own_assignments"
  ON public.teacher_assignments
  FOR SELECT
  USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "insert_own_assignments" ON public.teacher_assignments;
CREATE POLICY "insert_own_assignments"
  ON public.teacher_assignments
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "update_own_assignments" ON public.teacher_assignments;
CREATE POLICY "update_own_assignments"
  ON public.teacher_assignments
  FOR UPDATE
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "delete_own_assignments" ON public.teacher_assignments;
CREATE POLICY "delete_own_assignments"
  ON public.teacher_assignments
  FOR DELETE
  USING (auth.uid() = teacher_id);


