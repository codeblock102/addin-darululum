-- =============================================================================
-- Re-enable the three paused email cron jobs.
-- Run this ONLY after Phase 1 deployment has succeeded AND
-- supabase/scripts/smoke-test-emails.sql has been run with verified output.
-- =============================================================================
--   jobid 5  — attendance-absence-email-job   (every 5 min)
--   jobid 34 — send-assignment-overdue-daily  (08:00 UTC)
--   jobid 35 — daily-progress-email-job       (20:00 UTC = 16:00 EDT)
-- =============================================================================

SELECT cron.alter_job(job_id := 5,  active := true);
SELECT cron.alter_job(job_id := 34, active := true);
SELECT cron.alter_job(job_id := 35, active := true);

-- Verify
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobid IN (5, 34, 35)
ORDER BY jobid;
