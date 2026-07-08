-- Harden RLS for the 'assignment-submissions' storage bucket.
--
-- The previous migration (20260509000100_assignment_submissions_parent_upload.sql)
-- granted INSERT and SELECT to every authenticated user with no path or auth
-- scoping. The "path checked client-side" comment is not security: a signed-in
-- user can target any path with the storage API directly and overwrite or read
-- any submission. This migration enforces the same path contract on the server.
--
-- Path contract (see src/components/parent/SubmitAssignmentDialog.tsx):
--   '<studentUuid>/<assignmentUuid>.<ext>'
--
-- storage.foldername(name) returns the path segments as a text[]. The first
-- segment is the student UUID; the basename (storage.filename(name)) carries
-- the assignment UUID before the extension.
--
-- Authorization model:
--   * INSERT / UPDATE / DELETE: caller must be authorized to manage the student
--     (admin, linked teacher, linked parent, or the student themselves) AND the
--     (assignment_id, student_id) pair must correspond to a real assignment the
--     student is eligible for (per public.teacher_assignment_submissions, or
--     per teacher_assignments.student_ids / class enrollment).
--   * SELECT: same set, plus the assignment's owning teacher.
--
-- We reuse public.can_manage_student_photo / public.can_view_student_photo
-- from 20260615000000_student_photo_rls_hardening.sql for the
-- admin/teacher/parent/student check, and add a small helper that validates
-- the (assignment_id, student_id) pair against the public schema.

-- Drop the previous, permissive policies (safe if they were already removed).
DROP POLICY IF EXISTS "Auth can upload submissions" ON storage.objects;
DROP POLICY IF EXISTS "Auth can read submissions" ON storage.objects;
DROP POLICY IF EXISTS "Auth can update submissions" ON storage.objects;
DROP POLICY IF EXISTS "Auth can delete submissions" ON storage.objects;

-- Helper: is (p_assignment_id, p_student_id) a real assignment/student pair?
-- Accepted if:
--   * a teacher_assignment_submissions row already exists for that pair, OR
--   * the teacher_assignment targets this student directly via student_ids, OR
--   * the teacher_assignment targets a class the student is enrolled in via
--     class_enrollments (best-effort: only checked if the table exists).
-- SECURITY DEFINER so this works regardless of which row-level policies the
-- caller has on the underlying public tables.
CREATE OR REPLACE FUNCTION public.assignment_targets_student(
  p_assignment_id uuid,
  p_student_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_match boolean := false;
  v_has_class_enrollments boolean;
BEGIN
  IF p_assignment_id IS NULL OR p_student_id IS NULL THEN
    RETURN false;
  END IF;

  -- Existing submission row already binds the pair (covers re-upload / upsert).
  IF EXISTS (
    SELECT 1
    FROM public.teacher_assignment_submissions tas
    WHERE tas.assignment_id = p_assignment_id
      AND tas.student_id = p_student_id
  ) THEN
    RETURN true;
  END IF;

  -- Direct targeting via teacher_assignments.student_ids.
  IF EXISTS (
    SELECT 1
    FROM public.teacher_assignments ta
    WHERE ta.id = p_assignment_id
      AND p_student_id = ANY (COALESCE(ta.student_ids, ARRAY[]::uuid[]))
  ) THEN
    RETURN true;
  END IF;

  -- Class-based targeting. class_enrollments may or may not exist depending
  -- on which historical migration ran; degrade gracefully if absent.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'class_enrollments'
  ) INTO v_has_class_enrollments;

  IF v_has_class_enrollments THEN
    EXECUTE $sql$
      SELECT EXISTS (
        SELECT 1
        FROM public.teacher_assignments ta
        JOIN public.class_enrollments ce
          ON ce.class_id = ANY (COALESCE(ta.class_ids, ARRAY[]::uuid[]))
        WHERE ta.id = $1
          AND ce.student_id = $2
      )
    $sql$
    INTO v_match
    USING p_assignment_id, p_student_id;

    IF v_match THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.assignment_targets_student(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.assignment_targets_student(uuid, uuid) TO authenticated;

-- Helper: extract the assignment UUID from the object's basename
-- ('<assignmentUuid>.<ext>'). Returns NULL when the basename is not shaped
-- like '<uuid>.<ext>'; policies treat NULL as a denial.
CREATE OR REPLACE FUNCTION public.assignment_submission_assignment_id(p_name text)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN split_part(storage.filename(p_name), '.', 1)
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN split_part(storage.filename(p_name), '.', 1)::uuid
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION public.assignment_submission_assignment_id(text) FROM public;
GRANT EXECUTE ON FUNCTION public.assignment_submission_assignment_id(text) TO authenticated;

-- Helper: extract the student UUID from the object's first path segment
-- ('<studentUuid>/...'). Returns NULL when the segment is not a UUID.
CREATE OR REPLACE FUNCTION public.assignment_submission_student_id(p_name text)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN (storage.foldername(p_name))[1]
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN (storage.foldername(p_name))[1]::uuid
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION public.assignment_submission_student_id(text) FROM public;
GRANT EXECUTE ON FUNCTION public.assignment_submission_student_id(text) TO authenticated;

-- Helper: may the caller WRITE (insert/update/delete) a submission for this
-- student? Admin / linked teacher / linked parent (per can_manage_student_photo)
-- OR the student themselves.
CREATE OR REPLACE FUNCTION public.can_manage_assignment_submission(
  p_student_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND p_student_id IS NOT NULL
    AND (
      auth.uid() = p_student_id
      OR public.can_manage_student_photo(p_student_id)
    );
$$;

REVOKE ALL ON FUNCTION public.can_manage_assignment_submission(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_manage_assignment_submission(uuid) TO authenticated;

-- Helper: may the caller view this submission object?
-- Same as can_view_student_photo, plus the assignment's owning teacher.
CREATE OR REPLACE FUNCTION public.can_view_assignment_submission(
  p_assignment_id uuid,
  p_student_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR p_assignment_id IS NULL OR p_student_id IS NULL THEN
    RETURN false;
  END IF;

  -- Owning teacher of the assignment.
  IF EXISTS (
    SELECT 1
    FROM public.teacher_assignments ta
    WHERE ta.id = p_assignment_id
      AND ta.teacher_id = v_uid
  ) THEN
    RETURN true;
  END IF;

  -- Admin / linked teacher / linked parent / the student themselves.
  RETURN public.can_view_student_photo(p_student_id);
END;
$$;

REVOKE ALL ON FUNCTION public.can_view_assignment_submission(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_view_assignment_submission(uuid, uuid) TO authenticated;

-- INSERT: object path must be '<studentUuid>/<assignmentUuid>.<ext>', the
-- (assignment_id, student_id) pair must be a real targeted assignment, and the
-- caller must be authorized to manage that student.
CREATE POLICY "Linked users can upload assignment submissions" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assignment-submissions'
    AND public.assignment_submission_student_id(name) IS NOT NULL
    AND public.assignment_submission_assignment_id(name) IS NOT NULL
    AND public.can_manage_assignment_submission(
      public.assignment_submission_student_id(name)
    )
    AND public.assignment_targets_student(
      public.assignment_submission_assignment_id(name),
      public.assignment_submission_student_id(name)
    )
  );

-- UPDATE: same authorization check on both the existing and proposed rows.
-- (The parent upload flow uses upsert: true, which lands as an UPDATE when the
-- object already exists.)
CREATE POLICY "Linked users can update assignment submissions" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'assignment-submissions'
    AND public.assignment_submission_student_id(name) IS NOT NULL
    AND public.assignment_submission_assignment_id(name) IS NOT NULL
    AND public.can_manage_assignment_submission(
      public.assignment_submission_student_id(name)
    )
    AND public.assignment_targets_student(
      public.assignment_submission_assignment_id(name),
      public.assignment_submission_student_id(name)
    )
  )
  WITH CHECK (
    bucket_id = 'assignment-submissions'
    AND public.assignment_submission_student_id(name) IS NOT NULL
    AND public.assignment_submission_assignment_id(name) IS NOT NULL
    AND public.can_manage_assignment_submission(
      public.assignment_submission_student_id(name)
    )
    AND public.assignment_targets_student(
      public.assignment_submission_assignment_id(name),
      public.assignment_submission_student_id(name)
    )
  );

-- DELETE: only callers who could have written the file can remove it.
CREATE POLICY "Linked users can delete assignment submissions" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'assignment-submissions'
    AND public.assignment_submission_student_id(name) IS NOT NULL
    AND public.assignment_submission_assignment_id(name) IS NOT NULL
    AND public.can_manage_assignment_submission(
      public.assignment_submission_student_id(name)
    )
    AND public.assignment_targets_student(
      public.assignment_submission_assignment_id(name),
      public.assignment_submission_student_id(name)
    )
  );

-- SELECT: linked admins / teachers / parents / the student themselves, plus
-- the assignment's owning teacher (who needs to grade the submission).
CREATE POLICY "Linked users can view assignment submissions" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'assignment-submissions'
    AND public.assignment_submission_student_id(name) IS NOT NULL
    AND public.assignment_submission_assignment_id(name) IS NOT NULL
    AND public.can_view_assignment_submission(
      public.assignment_submission_assignment_id(name),
      public.assignment_submission_student_id(name)
    )
  );
