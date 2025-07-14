-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the daily progress email to run at 4:30 PM every day
-- Note: Times are in UTC, so adjust for your timezone
-- If you're in EST/EDT, 4:30 PM would be 21:30 UTC (9:30 PM UTC)
-- If you're in PST/PDT, 4:30 PM would be 00:30 UTC (next day)
-- Adjust the time below according to your timezone

-- For EST timezone (UTC-5): 4:30 PM EST = 21:30 UTC
SELECT cron.schedule(
    'daily-progress-email-job',
    '30 21 * * *', -- Every day at 9:30 PM UTC (4:30 PM EST)
    'SELECT
        net.http_post(
            url := ''https://depsfpodwaprzxffdcks.supabase.co/functions/v1/daily-progress-email'',
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

-- Create a function to manually trigger the scheduled job for testing
CREATE OR REPLACE FUNCTION trigger_daily_email_test()

RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Make HTTP request to the edge function
    SELECT net.http_post(
        url := 'https://depsfpodwaprzxffdcks.supabase.co/functions/v1/daily-progress-email',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'source', 'manual_test',
            'timestamp', now()
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Create a view to check the status of scheduled jobs
CREATE OR REPLACE VIEW scheduled_jobs_status AS
SELECT 
    jobname,
    schedule,
    active,
    jobid
FROM cron.job 
WHERE jobname = 'daily-progress-email-job';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION trigger_daily_email_test() TO authenticated;
GRANT SELECT ON scheduled_jobs_status TO authenticated;

-- Insert initial settings for the service role key (you'll need to update this)
-- This is a placeholder - you'll need to set the actual service role key
INSERT INTO vault.secrets (name, secret)
VALUES ('service_role_key', 'your_service_role_key_here')
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

-- Create a settings table to store configuration
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default email schedule setting
INSERT INTO app_settings (key, value, description)
VALUES 
    ('email_schedule_enabled', 'true', 'Whether automatic daily emails are enabled'),
    ('email_schedule_time', '21:30', 'Time in UTC when daily emails are sent (format: HH:MM)'),
    ('email_timezone', 'America/New_York', 'Timezone for the email schedule')
ON CONFLICT (key) DO NOTHING;

-- Grant permissions on the settings table
GRANT SELECT, UPDATE ON app_settings TO authenticated;
GRANT SELECT, UPDATE ON app_settings TO service_role; 