-- Add 'sick' as an allowed attendance status.
-- Supersedes add_sick_attendance_status.sql, which assumed an `attendance_status`
-- ENUM; the live schema models status as text + a CHECK constraint, so we widen
-- the CHECK instead. Applied to the linked project 2026-07-08.

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check
  CHECK (status = ANY (ARRAY['present'::text,'absent'::text,'late'::text,'excused'::text,'early_departure'::text,'sick'::text]));
