-- Add student_ids array column to allow multiple students per parent link
ALTER TABLE public.parent_children
  ADD COLUMN IF NOT EXISTS student_ids uuid[] NOT NULL DEFAULT '{}';

-- Optional: backfill array from single student_id if present
UPDATE public.parent_children
SET student_ids = ARRAY[student_id]
WHERE student_id IS NOT NULL AND (student_ids IS NULL OR array_length(student_ids, 1) = 0);

-- Adjust unique constraint: ensure one row per parent when using array
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'parent_children_parent_id_student_id_key'
  ) THEN
    ALTER TABLE public.parent_children DROP CONSTRAINT parent_children_parent_id_student_id_key;
  END IF;
END $$;

-- Index to speed up ANY() checks on student_ids
CREATE INDEX IF NOT EXISTS idx_parent_children_student_ids ON public.parent_children USING GIN (student_ids);

-- Update policies to allow parents access when the student is in the array
DROP POLICY IF EXISTS "parent_select_linked_students" ON public.students;
CREATE POLICY "parent_select_linked_students"
  ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.parent_id = auth.uid()
        AND (
          pc.student_id = students.id
          OR students.id = ANY (pc.student_ids)
        )
    )
  );

DROP POLICY IF EXISTS "parent_select_linked_progress" ON public.progress;
CREATE POLICY "parent_select_linked_progress"
  ON public.progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.parent_id = auth.uid()
        AND (
          pc.student_id = progress.student_id
          OR progress.student_id = ANY (pc.student_ids)
        )
    )
  );

DROP POLICY IF EXISTS "parent_select_linked_attendance" ON public.attendance;
CREATE POLICY "parent_select_linked_attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.parent_id = auth.uid()
        AND (
          pc.student_id = attendance.student_id
          OR attendance.student_id = ANY (pc.student_ids)
        )
    )
  );


