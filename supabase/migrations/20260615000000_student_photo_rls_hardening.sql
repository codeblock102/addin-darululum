-- Harden RLS for the 'student-photos' storage bucket.
--
-- The previous migration (20260509000000_student_photo_upload_setup.sql) granted
-- INSERT/UPDATE/DELETE to every authenticated user with no path or auth scoping,
-- which means any signed-in user could overwrite or delete any student's photo.
--
-- This migration:
--   1. Drops the permissive policies on storage.objects for bucket 'student-photos'.
--   2. Recreates them so that writes (INSERT/UPDATE/DELETE) are restricted to:
--        - admins (profiles.role = 'admin'),
--        - teachers linked to the student via public.students_teachers, OR
--        - parents linked to the student via public.parent_children
--          (or public.parents.student_ids, whichever table exists in this DB).
--   3. SELECT is allowed for the same callers plus the student themselves (auth.uid()
--      = student id). The bucket itself remains public for the existing CDN-served
--      photo_url, so this SELECT policy only guards authenticated-API reads.
--
-- Path contract: uploads are written as '<studentUuid>.<ext>' at the bucket root
-- (see src/components/students/StudentPhotoUpload.tsx), so split_part(name, '.', 1)
-- yields the student UUID. Path-must-start-with-uuid is enforced via a regex match.

-- Drop the previous, permissive policies (safe if they were already removed).
DROP POLICY IF EXISTS "Auth can upload student photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth can update student photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth can delete student photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read student photos" ON storage.objects;

-- Helper: does the calling user have write access to the given student's photo?
-- SECURITY DEFINER so the function can read the parent/teacher link tables even
-- when the caller's own RLS would normally hide them.
CREATE OR REPLACE FUNCTION public.can_manage_student_photo(p_student_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_has_parent_children boolean;
  v_has_parents boolean;
  v_match boolean := false;
BEGIN
  IF v_uid IS NULL OR p_student_id IS NULL THEN
    RETURN false;
  END IF;

  -- Admin bypass.
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_uid AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  -- Teacher linked to this student via students_teachers (joined by name, which is
  -- how the app currently models the relationship — see TeacherAttendance.tsx).
  IF EXISTS (
    SELECT 1
    FROM public.students_teachers st
    JOIN public.students s ON s.name = st.student_name
    WHERE st.teacher_id = v_uid
      AND COALESCE(st.active, true) = true
      AND s.id = p_student_id
  ) THEN
    RETURN true;
  END IF;

  -- Parent linkage. The schema went through two shapes:
  --   (a) public.parent_children(parent_id, student_id, student_ids uuid[])
  --   (b) public.parents(id, student_ids uuid[])
  -- Check whichever exists so this migration works regardless of which
  -- timestamp-collision migration ran last.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'parent_children'
  ) INTO v_has_parent_children;

  IF v_has_parent_children THEN
    EXECUTE $sql$
      SELECT EXISTS (
        SELECT 1 FROM public.parent_children pc
        WHERE pc.parent_id = $1
          AND (
            pc.student_id = $2
            OR $2 = ANY (COALESCE(pc.student_ids, ARRAY[]::uuid[]))
          )
      )
    $sql$
    INTO v_match
    USING v_uid, p_student_id;

    IF v_match THEN
      RETURN true;
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'parents'
  ) INTO v_has_parents;

  IF v_has_parents THEN
    EXECUTE $sql$
      SELECT EXISTS (
        SELECT 1 FROM public.parents p
        WHERE p.id = $1
          AND $2 = ANY (COALESCE(p.student_ids, ARRAY[]::uuid[]))
      )
    $sql$
    INTO v_match
    USING v_uid, p_student_id;

    IF v_match THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_student_photo(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_manage_student_photo(uuid) TO authenticated;

-- SELECT extends write access by also letting the student themselves read.
CREATE OR REPLACE FUNCTION public.can_view_student_photo(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      auth.uid() = p_student_id
      OR public.can_manage_student_photo(p_student_id)
    );
$$;

REVOKE ALL ON FUNCTION public.can_view_student_photo(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_view_student_photo(uuid) TO authenticated;

-- INSERT: object key must look like '<uuid>.<ext>' at the bucket root and the
-- caller must be authorized to manage that student's photo.
CREATE POLICY "Linked users can upload student photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-photos'
    AND name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$'
    AND public.can_manage_student_photo(split_part(name, '.', 1)::uuid)
  );

-- UPDATE: same constraints on both the existing row and the proposed new row.
CREATE POLICY "Linked users can update student photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$'
    AND public.can_manage_student_photo(split_part(name, '.', 1)::uuid)
  )
  WITH CHECK (
    bucket_id = 'student-photos'
    AND name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$'
    AND public.can_manage_student_photo(split_part(name, '.', 1)::uuid)
  );

-- DELETE: same authorization check.
CREATE POLICY "Linked users can delete student photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$'
    AND public.can_manage_student_photo(split_part(name, '.', 1)::uuid)
  );

-- SELECT (authenticated): linked parents/teachers/admins + the student themselves.
-- Note: the bucket is still configured as public so the existing public CDN URLs
-- (students.photo_url) keep working. This policy only narrows authenticated-API
-- reads — flip the bucket to private later to make it binding.
CREATE POLICY "Linked users can view student photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$'
    AND public.can_view_student_photo(split_part(name, '.', 1)::uuid)
  );
