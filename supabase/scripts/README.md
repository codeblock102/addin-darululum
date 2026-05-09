# Supabase ops scripts

Operational SQL snippets for the Darul Ulum Montreal Supabase project
(`depsfpodwaprzxffdcks`). All scripts in this folder are **manual-run** —
copy/paste into the Supabase SQL editor (Database → SQL).

## Files

| File | Purpose |
|------|---------|
| `smoke-test-emails.sql` | One-off invocations of each email edge function against a single test recipient. Run BEFORE re-enabling crons. |
| `re-enable-email-crons.sql` | Flips `active=true` on the three paused email cron jobs (5, 34, 35). Run only after smoke tests pass. |

## Background — the paused jobs

| jobid | jobname | schedule | edge function |
|-------|---------|----------|---------------|
| 5 | `attendance-absence-email-job` | every 5 min | `attendance-absence-email` |
| 34 | `send-assignment-overdue-daily` | `0 8 * * *` UTC | `send-assignment-overdue` |
| 35 | `daily-progress-email-job` | `0 20 * * *` UTC (4 pm EDT) | `daily-progress-email` |

All three were set to `active=false` while a Phase 1 fix is rolling out
(madrassah scoping + recipient-lookup hardening).

## Running smoke tests

1. Open `smoke-test-emails.sql` in the Supabase SQL editor.
2. Replace the placeholder UUIDs / strings:
   - `REPLACE_WITH_TEST_STUDENT_UUID` — a single active test student
   - `REPLACE_WITH_TEST_CLASS_UUID` — a class containing only that student (or a dedicated test class)
   - `REPLACE_WITH_TEST_PARENT_EMAIL` — your own / the QA inbox you control
3. Run section 1 (`attendance-absence-email`) **with `preview=true` first** —
   this returns the recipient list without calling Resend. Confirm the test
   student's parent email is correctly resolved before flipping `preview=false`.
4. Run section 2 (`send-assignment-overdue`) **only after** running the
   pre-suppression INSERT shown in the file — otherwise it will email every
   parent with a real overdue assignment. Run the cleanup DELETE afterward.
5. Run section 3 (`daily-progress-email`) — uses `scope=class` to limit blast
   radius. Make sure the test student has a `progress` row dated today (in
   `America/Toronto`) or the function will treat the run as no-op for them.
6. Inspect responses via the `net._http_response` query at the bottom of the
   file. Status 200 + `emails_sent >= 1` is the success signal.
7. Confirm the test inbox actually received the message and the rendering
   looks correct (logo, status colors, parent name, links).

## Re-enabling crons

After Phase 1 deploy is live AND all three smoke tests passed AND the QA
inbox confirms email rendering:

1. Open `re-enable-email-crons.sql`.
2. Run it. The verification SELECT at the bottom should report
   `active=true` for jobids 5, 34, 35.
3. Watch the next scheduled fire window (5 min for job 5; the next day's
   8am/8pm UTC slot for jobs 34/35) and tail `email_logs`:
   ```sql
   SELECT triggered_at, trigger_source, status, emails_sent, emails_skipped, message
   FROM email_logs
   ORDER BY triggered_at DESC
   LIMIT 20;
   ```

## Pausing again (if something goes wrong)

```sql
SELECT cron.alter_job(job_id := 5,  active := false);
SELECT cron.alter_job(job_id := 34, active := false);
SELECT cron.alter_job(job_id := 35, active := false);
```

This stops scheduled fires immediately; in-flight invocations finish on their
own. The edge functions themselves remain deployed and callable manually
(via the smoke-test SQL or `supabase functions invoke`).
