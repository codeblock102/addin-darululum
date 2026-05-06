# Email Scheduling Setup Guide

This guide explains how to set up the two automated email systems: the **daily progress digest** and the **attendance notification** emails.

---

## Overview

### Daily Progress Email (`daily-progress-email`)
Sends each evening (4:30 PM EST via `pg_cron`) with:
- **Guardian email** — per-student Quran progress (Sabaq), assignment updates, CTA button. Gradient green header with DUM logo; student name band; styled tables.
- **Principal/admin summary** — class-organized breakdown of all student Sabaq, top student per class, assignment aggregate. Same gradient design.

### Attendance Absence Email (`attendance-absence-email`)
Sends when a teacher submits attendance OR on a scheduled cutoff sweep:
- Color-coded status banner: present (green), absent (red), late (amber), excused (purple), early departure (orange), sick (cyan)
- Short narrative describing the status
- CTA button linking to Parent Portal
- De-duplication: one notification per student per day, tracked in `attendance_absence_notifications`

---

## Setup Steps

### 1. Run Database Migrations

```bash
cd /path/to/your/project
npx supabase db push
```

This creates:
- `email_logs` — tracks all send events (trigger source, status, counts)
- `app_settings` — schedule configuration (enabled, time, timezone)
- `attendance_settings` — per-madrassah cutoff time and last-sent date
- `attendance_absence_notifications` — de-duplication log
- `pg_cron` job for 4:30 PM daily digest

### 2. Configure Supabase Secrets

Set these in your Supabase project → Settings → Edge Functions:

```
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_URL=https://app.daralulummontreal.com/
REPORT_TIMEZONE=America/Toronto
```

### 3. Enable pg_cron Extension

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

### 4. Timezone Configuration

The default schedule is 4:30 PM EST (21:30 UTC). To adjust:

| Timezone | UTC equivalent | Cron expression |
|---|---|---|
| EST (default) | 21:30 UTC | `30 21 * * *` |
| CST | 22:30 UTC | `30 22 * * *` |
| MST | 23:30 UTC | `30 23 * * *` |
| PST | 00:30 UTC+1 | `30 0 * * *` |

Update the cron expression in the migration file accordingly.

---

## Testing

### Method 1: Admin Panel
1. Log in as admin → Settings → Email Schedule
2. Click **Run Test Email**
3. Check the email activity log for results

### Method 2: SQL
```sql
-- Trigger a test run
SELECT trigger_daily_email_test();

-- Check recent activity
SELECT * FROM email_logs ORDER BY triggered_at DESC LIMIT 10;

-- Check scheduled jobs
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'daily-progress-email-job';
```

### Method 3: Direct cURL

```bash
# Daily progress email (manual trigger)
curl -X POST 'https://depsfpodwaprzxffdcks.supabase.co/functions/v1/daily-progress-email' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"source": "manual", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}'

# Attendance email (teacher-scoped, for specific students)
curl -X POST 'https://depsfpodwaprzxffdcks.supabase.co/functions/v1/attendance-absence-email' \
  -H 'Authorization: Bearer USER_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"student_ids": ["uuid1", "uuid2"], "date": "2026-05-06"}'

# Attendance email with force flag (bypasses cutoff/dedup checks)
curl -X POST 'https://depsfpodwaprzxffdcks.supabase.co/functions/v1/attendance-absence-email' \
  -H 'Authorization: Bearer SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"force": true}'
```

---

## Monitoring

### Email Activity Log
```sql
SELECT trigger_source, status, emails_sent, emails_skipped, message, triggered_at
FROM email_logs
ORDER BY triggered_at DESC
LIMIT 20;
```

### Attendance Notification De-duplication Log
```sql
-- See who was notified today
SELECT s.name, n.date, n.madrassah_id
FROM attendance_absence_notifications n
JOIN students s ON s.id = n.student_id
WHERE n.date = CURRENT_DATE;

-- Clear today's log to allow re-send (use with caution)
DELETE FROM attendance_absence_notifications WHERE date = CURRENT_DATE;
```

### Students without guardian emails
```sql
SELECT name, guardian_email
FROM students
WHERE (guardian_email IS NULL OR guardian_email = '')
  AND status = 'active';
```

---

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| No emails sending | RESEND_API_KEY not set | Check Supabase project secrets |
| Emails sending but wrong time | Wrong timezone/UTC offset | Update cron expression |
| Duplicate emails | `attendance_absence_notifications` not populated | Verify `INSERT` in edge function logs |
| "Email sender not configured" error | RESEND_FROM_EMAIL missing | Add to Supabase secrets |
| Guardian not receiving | Email not on student record | Check `students.guardian_email`; also check `parents` table |
| Admin summary not sending | No admin accounts with emails | Verify `profiles` table has admin rows with email field populated |
| Function timeout | Too many students | Increase `DAILY_EMAIL_MAX_MS` env var (default 120000ms) |
| Attendance email not firing | `attendance_settings.enabled = false` | `UPDATE attendance_settings SET enabled = true WHERE madrassah_id = '...'` |

---

## Email Design Reference

Both emails use the same design system:

- **Background:** Light green `#f0fdf4`
- **Card:** White `#ffffff`, 16px border-radius, subtle shadow
- **Header:** `linear-gradient(135deg, #052e16, #166534, #16a34a)` with DUM logo
- **Tables:** Green column headers `#166534`, alternating white/gray rows
- **CTA button:** Solid green `#059669` or gradient green
- **Footer:** Light gray `#f9fafb` with Dār Al-Ulūm Montréal wordmark

Attendance status colors:
| Status | Color | Hex |
|---|---|---|
| Present | Green | `#059669` |
| Absent | Red | `#dc2626` |
| Late | Amber | `#d97706` |
| Excused | Purple | `#7c3aed` |
| Early Departure | Orange | `#ea580c` |
| Sick | Cyan | `#0891b2` |

---

## Security Notes

- Emails are sent only to guardian email addresses on file — never to arbitrary addresses
- Service role key is used only inside edge functions, never exposed to the client
- All send events logged in `email_logs` for audit purposes
- `attendance_absence_notifications` prevents duplicate sends at the student/date level
