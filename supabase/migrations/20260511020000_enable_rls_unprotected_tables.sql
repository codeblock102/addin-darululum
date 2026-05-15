-- DB cleanup 2026-05-11: enable RLS on 4 tables previously exposed to anon role.
-- Policies: admin-only RW (+ teacher SELECT for attendance-related tables).
-- service_role bypasses RLS, so edge functions inserting into email_logs / aan still work.

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_absence_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_admin_all" ON public.app_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "email_logs_admin_select" ON public.email_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "attendance_settings_admin_all" ON public.attendance_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "attendance_settings_teacher_select" ON public.attendance_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
  );

CREATE POLICY "aan_admin_all" ON public.attendance_absence_notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "aan_teacher_select" ON public.attendance_absence_notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
  );
