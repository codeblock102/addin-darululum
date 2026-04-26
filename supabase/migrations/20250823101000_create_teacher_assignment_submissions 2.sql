-- Submissions for each student per assignment
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE submission_status AS ENUM ('assigned', 'submitted', 'graded');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.teacher_assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.teacher_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status submission_status NOT NULL DEFAULT 'assigned',
  submitted_at timestamptz,
  graded_at timestamptz,
  grade numeric(5,2),
  feedback text,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

DROP TRIGGER IF EXISTS set_teacher_assignment_submissions_updated_at ON public.teacher_assignment_submissions;
CREATE TRIGGER set_teacher_assignment_submissions_updated_at
BEFORE UPDATE ON public.teacher_assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tas_assignment_id ON public.teacher_assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_tas_student_id ON public.teacher_assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_tas_status ON public.teacher_assignment_submissions(status);

ALTER TABLE public.teacher_assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Teachers can manage submissions for their own assignments
DROP POLICY IF EXISTS "teacher_select_submissions" ON public.teacher_assignment_submissions;
CREATE POLICY "teacher_select_submissions"
  ON public.teacher_assignment_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.teacher_assignments ta
      WHERE ta.id = teacher_assignment_submissions.assignment_id
        AND ta.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "teacher_insert_submissions" ON public.teacher_assignment_submissions;
CREATE POLICY "teacher_insert_submissions"
  ON public.teacher_assignment_submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.teacher_assignments ta
      WHERE ta.id = teacher_assignment_submissions.assignment_id
        AND ta.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "teacher_update_submissions" ON public.teacher_assignment_submissions;
CREATE POLICY "teacher_update_submissions"
  ON public.teacher_assignment_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.teacher_assignments ta
      WHERE ta.id = teacher_assignment_submissions.assignment_id
        AND ta.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.teacher_assignments ta
      WHERE ta.id = teacher_assignment_submissions.assignment_id
        AND ta.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "teacher_delete_submissions" ON public.teacher_assignment_submissions;
CREATE POLICY "teacher_delete_submissions"
  ON public.teacher_assignment_submissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.teacher_assignments ta
      WHERE ta.id = teacher_assignment_submissions.assignment_id
        AND ta.teacher_id = auth.uid()
    )
  );


