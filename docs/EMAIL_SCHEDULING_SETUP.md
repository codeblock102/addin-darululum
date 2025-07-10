# Email Scheduling Setup Guide

This guide explains how to set up automatic daily email reports that send at 4:30 PM.

## Overview

The system will automatically send progress report emails to guardians daily at 4:30 PM. The emails include:
- Student progress data from the last 24 hours
- Memorization details, quality ratings, and teacher notes
- Professional HTML formatting

## Setup Steps

### 1. Run Database Migrations

First, apply the new database migrations to set up the scheduling system:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Run Supabase migrations
npx supabase db push

# Or if using Supabase CLI directly
supabase db push
```

This will create:
- `email_logs` table to track email sending events
- `app_settings` table for configuration
- `pg_cron` scheduled job for 4:30 PM daily emails
- Helper functions for manual testing

### 2. Configure Environment Variables

Ensure these environment variables are set in your Supabase project:

```bash
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Update Timezone (Optional)

The default schedule is set for EST timezone (4:30 PM EST = 21:30 UTC). 

To change the timezone, update the cron expression in the migration file:
- For PST: `30 0 * * *` (4:30 PM PST = 00:30 UTC next day)
- For CST: `30 22 * * *` (4:30 PM CST = 22:30 UTC)
- For MST: `30 23 * * *` (4:30 PM MST = 23:30 UTC)

### 4. Enable pg_cron Extension

Make sure pg_cron is enabled in your Supabase project:

1. Go to Supabase Dashboard → SQL Editor
2. Run: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
3. Verify with: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`

## Testing the System

### Method 1: Admin Panel Testing

1. Log in as an admin user
2. Go to Settings → Email Schedule tab
3. Click "Run Test Email" button
4. Check the email activity log for results

### Method 2: Database Function Testing

```sql
-- Test the email system manually
SELECT trigger_daily_email_test();

-- Check recent email activity
SELECT * FROM recent_email_activity ORDER BY triggered_at DESC LIMIT 10;

-- View scheduled jobs status
SELECT * FROM scheduled_jobs_status;
```

### Method 3: Direct Function Call

```bash
# Call the edge function directly
curl -X POST 'https://your-project.supabase.co/functions/v1/daily-progress-email' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"source": "manual_test", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}'
```

## Monitoring

### Email Activity Dashboard

The admin panel includes an Email Schedule Manager with:
- **Schedule Status**: Shows if the cron job is active
- **Test Email Button**: Manual testing capability  
- **Activity Log**: Last 50 email sending events with details

### Email Logs Table

Monitor the `email_logs` table for:
- `trigger_source`: 'scheduled', 'manual', 'test'
- `status`: 'started', 'completed', 'error'
- `emails_sent` and `emails_skipped` counts
- Detailed error messages

### Scheduled Jobs

Check scheduled job status:
```sql
SELECT jobname, schedule, active, jobid 
FROM cron.job 
WHERE jobname = 'daily-progress-email-job';
```

## Troubleshooting

### Common Issues

1. **No emails being sent**
   - Check if pg_cron extension is enabled
   - Verify RESEND_API_KEY is set correctly
   - Ensure students have guardian email addresses

2. **Wrong timezone**
   - Update the cron schedule in the migration
   - Remember: cron uses UTC time

3. **Permission errors**
   - Verify service role key has proper permissions
   - Check RLS policies on related tables

4. **Function timeouts**
   - Large datasets may need batching
   - Monitor function execution logs in Supabase

### Debug Commands

```sql
-- Check if cron job exists
SELECT * FROM cron.job WHERE jobname = 'daily-progress-email-job';

-- View recent email logs
SELECT * FROM email_logs ORDER BY triggered_at DESC LIMIT 20;

-- Check students without email addresses
SELECT s.name, s.guardian_email 
FROM students s 
WHERE s.guardian_email IS NULL OR s.guardian_email = '';

-- View recent progress records
SELECT COUNT(*) as progress_count 
FROM progress 
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

## Email Content

The emails include:
- Professional HTML styling
- Student name and guardian greeting
- Progress summary table with:
  - Lesson details (Surah:Ayat range)
  - Pages memorized
  - Quality rating
  - Teacher notes
- Source indicator (manual/automatic)
- Timestamp of generation

## Security Notes

- Emails are sent only to verified guardian email addresses
- No sensitive system information is included
- All email activity is logged for audit purposes
- Uses secure Supabase environment variables

## Support

If you encounter issues:
1. Check the email activity log in admin panel
2. Review Supabase function logs
3. Verify environment variables
4. Test with manual email function first 