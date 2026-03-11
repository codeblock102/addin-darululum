-- Fix admin access for the Activity/Insights page
-- Admins need read access to teacher_assignments, teacher_assignment_submissions, and communications
-- Uses JWT metadata check (same pattern as profiles_rls_fix) to avoid recursive profile lookups

-- Admin read policy for teacher_assignments
DROP POLICY IF EXISTS "admin_select_all_assignments" ON public.teacher_assignments;
CREATE POLICY "admin_select_all_assignments"
  ON public.teacher_assignments
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Admin read policy for teacher_assignment_submissions
DROP POLICY IF EXISTS "admin_select_all_submissions" ON public.teacher_assignment_submissions;
CREATE POLICY "admin_select_all_submissions"
  ON public.teacher_assignment_submissions
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Admin read policy for communications (all messages, not just sent/received)
DROP POLICY IF EXISTS "admin_select_all_communications" ON public.communications;
CREATE POLICY "admin_select_all_communications"
  ON public.communications
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
