-- Attendance cutoff settings and absence notifications

-- Create per-madrassah attendance settings
CREATE TABLE IF NOT EXISTS public.attendance_settings (
  madrassah_id uuid PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  cutoff_time text NOT NULL DEFAULT '09:30', -- HH:MM 24h (local to timezone)
  timezone text NOT NULL DEFAULT 'America/New_York', -- IANA timezone
  last_sent_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Maintain updated_at
DROP TRIGGER IF EXISTS set_attendance_settings_updated_at ON public.attendance_settings;
CREATE TRIGGER set_attendance_settings_updated_at
BEFORE UPDATE ON public.attendance_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Basic grants (RLS can be added later if needed)
GRANT SELECT, UPDATE, INSERT ON public.attendance_settings TO authenticated;
GRANT SELECT, UPDATE, INSERT ON public.attendance_settings TO service_role;

-- Absence notifications sent log (to avoid duplicates)
CREATE TABLE IF NOT EXISTS public.attendance_absence_notifications (
  id bigserial PRIMARY KEY,
  madrassah_id uuid NOT NULL,
  student_id uuid NOT NULL,
  date date NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_absence_notification_per_student_day
  ON public.attendance_absence_notifications(student_id, date);

CREATE INDEX IF NOT EXISTS idx_absence_notifications_madrassah_date
  ON public.attendance_absence_notifications(madrassah_id, date);

GRANT SELECT, INSERT ON public.attendance_absence_notifications TO service_role;
GRANT SELECT ON public.attendance_absence_notifications TO authenticated;

-- Schedule the absence email checker every 5 minutes
-- Adjust the URL to your Supabase project URL if different
SELECT cron.schedule(
  'attendance-absence-email-job',
  '*/5 * * * *',
  'SELECT
      net.http_post(
          url := ''https://depsfpodwaprzxffdcks.supabase.co/functions/v1/attendance-absence-email'',
          headers := jsonb_build_object(
              ''Content-Type'', ''application/json'',
              ''Authorization'', ''Bearer '' || current_setting(''app.settings.service_role_key'', true)
          ),
          body := jsonb_build_object(
              ''source'', ''scheduled'',
              ''timestamp'', now()
          )
      );'
);


