-- Create parent role in roles table if not exists
INSERT INTO public.roles (name)
VALUES ('parent')
ON CONFLICT (name) DO NOTHING;

-- Parent permissions: read-only capabilities
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.permission
FROM public.roles r
CROSS JOIN (
  VALUES 
    ('view_reports'::public.role_permission)
) AS p(permission)
WHERE r.name = 'parent'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Link table between parent (profile id) and students
CREATE TABLE IF NOT EXISTS public.parent_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

-- Policies: parents can read their own links
DROP POLICY IF EXISTS "parent_select_own_links" ON public.parent_children;
CREATE POLICY "parent_select_own_links"
  ON public.parent_children
  FOR SELECT
  USING (parent_id = auth.uid());

-- Parents can see their children's student rows
-- Add select policy on students for parents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'students' 
      AND policyname = 'parent_select_linked_students'
  ) THEN
    CREATE POLICY "parent_select_linked_students"
      ON public.students
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.parent_children pc
          WHERE pc.student_id = students.id AND pc.parent_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Parents can view progress for linked students
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'progress' 
      AND policyname = 'parent_select_linked_progress'
  ) THEN
    CREATE POLICY "parent_select_linked_progress"
      ON public.progress
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.parent_children pc
          WHERE pc.student_id = progress.student_id AND pc.parent_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Parents can view attendance for linked students
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'attendance' 
      AND policyname = 'parent_select_linked_attendance'
  ) THEN
    CREATE POLICY "parent_select_linked_attendance"
      ON public.attendance
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.parent_children pc
          WHERE pc.student_id = attendance.student_id AND pc.parent_id = auth.uid()
        )
      );
  END IF;
END $$;


