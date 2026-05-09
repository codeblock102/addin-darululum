-- =============================================================================
-- Email edge function smoke tests — single-shot, single-recipient invocations
-- =============================================================================
-- Run these one at a time in the Supabase SQL editor BEFORE re-enabling the
-- paused cron jobs (5, 34, 35). Replace the placeholder values below first:
--
--   :test_student_id   — UUID of a single test student (active) in your madrassah
--   :test_madrassah_id — UUID of the madrassah to scope to
--   :test_class_id     — UUID of a class containing :test_student_id (for daily-progress class scope)
--   :test_section      — section string for daily-progress section scope (optional)
--
-- The function URL pattern is:
--   https://depsfpodwaprzxffdcks.supabase.co/functions/v1/<function-name>
--
-- Auth: pg_net calls below pass the service-role key from vault. If you don't
-- have it stored as `service_role_key` in vault, replace the header with a
-- literal Bearer token at runtime (do NOT commit the token).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) ATTENDANCE ABSENCE — single student, preview mode (NO email actually sent)
-- -----------------------------------------------------------------------------
-- Body shape (from supabase/functions/attendance-absence-email/index.ts):
--   { source, timestamp, madrassah_id, student_ids[], class_id?, date?,
--     force?, preview? }
-- preview=true returns the recipient list without invoking Resend.
-- Use this first to confirm parent-email lookup works for the test student.
SELECT net.http_post(
  url := 'https://depsfpodwaprzxffdcks.supabase.co/functions/v1/attendance-absence-email',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
  ),
  body := jsonb_build_object(
    'source', 'smoke-test',
    'timestamp', now()::text,
    'student_ids', jsonb_build_array('REPLACE_WITH_TEST_STUDENT_UUID'),
    'date', to_char(now() AT TIME ZONE 'America/Toronto', 'YYYY-MM-DD'),
    'preview', true,
    'force', true
  )
) AS attendance_preview_request_id;

-- Once preview output looks right, flip preview=false to send a real email:
-- (uncomment and re-run)
/*
SELECT net.http_post(
  url := 'https://depsfpodwaprzxffdcks.supabase.co/functions/v1/attendance-absence-email',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
  ),
  body := jsonb_build_object(
    'source', 'smoke-test',
    'timestamp', now()::text,
    'student_ids', jsonb_build_array('REPLACE_WITH_TEST_STUDENT_UUID'),
    'date', to_char(now() AT TIME ZONE 'America/Toronto', 'YYYY-MM-DD'),
    'preview', false,
    'force', true
  )
) AS attendance_send_request_id;
*/


-- -----------------------------------------------------------------------------
-- 2) ASSIGNMENT OVERDUE — DB-driven, no per-student scoping in payload
-- -----------------------------------------------------------------------------
-- Body shape (from supabase/functions/send-assignment-overdue/index.ts):
--   {} — function reads teacher_assignments where due_date < today and
--   status NOT IN ('graded','cancelled'); has built-in de-dup via the
--   `notifications` table (assignment_id + recipient_id + date=today).
--
-- To smoke-test against ONE recipient only, the safest pattern is:
--   (a) temporarily insert dummy notifications rows for every (assignment, parent)
--       pair you want SUPPRESSED so they get skipped, OR
--   (b) (recommended) create a single dummy overdue assignment scoped to one
--       student in a staging madrassah, run the function, then clean up.
--
-- Quick approach: pre-suppress everything except your test student's parent.
-- Step 1 — pre-fill notifications to suppress all existing overdue rows except your target parent:
/*
INSERT INTO public.notifications (assignment_id, recipient_id, date, type)
SELECT DISTINCT a.id, pr.id, CURRENT_DATE, 'overdue'
FROM public.teacher_assignments a
CROSS JOIN public.profiles pr
WHERE a.due_date < CURRENT_DATE
  AND a.status NOT IN ('graded','cancelled')
  AND pr.role = 'parent'
  AND pr.email IS NOT NULL
  AND pr.email <> 'REPLACE_WITH_TEST_PARENT_EMAIL'
ON CONFLICT DO NOTHING;
*/

-- Step 2 — invoke
SELECT net.http_post(
  url := 'https://depsfpodwaprzxffdcks.supabase.co/functions/v1/send-assignment-overdue',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
  ),
  body := '{}'::jsonb
) AS overdue_request_id;

-- Step 3 — cleanup the dummy suppression rows (only the ones you inserted today):
/*
DELETE FROM public.notifications
WHERE date = CURRENT_DATE
  AND type = 'overdue'
  AND recipient_id IN (
    SELECT id FROM public.profiles
    WHERE role = 'parent' AND email <> 'REPLACE_WITH_TEST_PARENT_EMAIL'
  );
*/


-- -----------------------------------------------------------------------------
-- 3) DAILY PROGRESS — class scope (single class with one test student)
-- -----------------------------------------------------------------------------
-- Body shape (from supabase/functions/daily-progress-email/index.ts):
--   { source, timestamp, scope: 'school'|'class'|'section',
--     classId?, section? }
-- The function only emails students with a `progress` row dated today (in the
-- madrassah's email_timezone) OR a teacher_assignment_submissions row in the
-- last 24h. So: ensure your test student has a progress row dated today.
--
-- Note: scope='class' is the tightest filter. To send to exactly one student,
-- put that student in a dedicated test class (or briefly set a class's
-- current_students to [test_student_id] for the duration of the test).
--
-- Auth: this function authenticates the caller (admin role required for
-- non-scheduled triggers). When invoked from SQL via pg_net with the
-- service-role JWT, the function treats it as an admin call.
SELECT net.http_post(
  url := 'https://depsfpodwaprzxffdcks.supabase.co/functions/v1/daily-progress-email',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
  ),
  body := jsonb_build_object(
    'source', 'smoke-test',
    'timestamp', now()::text,
    'scope', 'class',
    'classId', 'REPLACE_WITH_TEST_CLASS_UUID'
  )
) AS daily_progress_request_id;


-- -----------------------------------------------------------------------------
-- Inspect results from pg_net (each call above returns a request_id)
-- -----------------------------------------------------------------------------
-- SELECT id, status_code, content::jsonb
-- FROM net._http_response
-- ORDER BY created DESC
-- LIMIT 5;
