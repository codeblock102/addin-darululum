-- Repair parent SELECT policies that reference the dropped `parent_children` table.
-- The 20250823110000_create_parents_table.sql migration consolidated parent links
-- into `public.parents.student_ids uuid[]` and dropped `parent_children`, but the
-- policies created in 20250823112000_update_parent_children_array.sql still query
-- the dropped table — so they silently return false for every row and parents see
-- nothing in their dashboard.
--
-- This migration replaces those policies with equivalents against `public.parents`.
-- Adds matching policies on the tables the new parent dashboard queries
-- (sabaq_para, juz_revisions, communications) so the rebuild renders real data.

-- students
DROP POLICY IF EXISTS "parent_select_linked_students" ON public.students;
CREATE POLICY "parent_select_linked_students"
  ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parents p
      WHERE p.id = auth.uid()
        AND students.id = ANY (p.student_ids)
    )
  );

-- progress
DROP POLICY IF EXISTS "parent_select_linked_progress" ON public.progress;
CREATE POLICY "parent_select_linked_progress"
  ON public.progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parents p
      WHERE p.id = auth.uid()
        AND progress.student_id = ANY (p.student_ids)
    )
  );

-- attendance
DROP POLICY IF EXISTS "parent_select_linked_attendance" ON public.attendance;
CREATE POLICY "parent_select_linked_attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parents p
      WHERE p.id = auth.uid()
        AND attendance.student_id = ANY (p.student_ids)
    )
  );

-- sabaq_para (used by ActivityFeed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'sabaq_para') THEN
    EXECUTE 'DROP POLICY IF EXISTS "parent_select_linked_sabaq_para" ON public.sabaq_para';
    EXECUTE $POL$
      CREATE POLICY "parent_select_linked_sabaq_para"
        ON public.sabaq_para
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.parents p
            WHERE p.id = auth.uid()
              AND sabaq_para.student_id = ANY (p.student_ids)
          )
        )
    $POL$;
  END IF;
END $$;

-- juz_revisions (used by ActivityFeed + JuzGrid)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'juz_revisions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "parent_select_linked_juz_revisions" ON public.juz_revisions';
    EXECUTE $POL$
      CREATE POLICY "parent_select_linked_juz_revisions"
        ON public.juz_revisions
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.parents p
            WHERE p.id = auth.uid()
              AND juz_revisions.student_id = ANY (p.student_ids)
          )
        )
    $POL$;
  END IF;
END $$;

-- communications (parent can read messages they sent or received)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'communications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "parent_select_own_communications" ON public.communications';
    EXECUTE $POL$
      CREATE POLICY "parent_select_own_communications"
        ON public.communications
        FOR SELECT
        USING (
          sender_id = auth.uid() OR recipient_id = auth.uid()
        )
    $POL$;
  END IF;
END $$;
