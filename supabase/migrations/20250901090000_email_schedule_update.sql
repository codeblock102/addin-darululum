-- Function and helpers to update daily progress email schedule from app settings
-- Creates/updates RPC to set `email_schedule_time` (HH:MM 24h) and `email_timezone`
-- and reschedules pg_cron job `daily-progress-email-job` accordingly.

-- Ensure pg_cron exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Helper: validate HH:MM 24h
CREATE OR REPLACE FUNCTION public.validate_hhmm(p_time text)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT p_time ~ '^[0-2][0-9]:[0-5][0-9]$' AND substring(p_time from 1 for 2)::int < 24;
$$;

-- Helper: convert a local HH:MM time in IANA timezone to a UTC cron expression (min hour * * *)
CREATE OR REPLACE FUNCTION public.local_hhmm_to_utc_cron(p_hhmm text, p_tz text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_hour int;
  v_min int;
  v_utc timestamptz;
  v_utc_hour int;
  v_utc_min int;
BEGIN
  IF NOT public.validate_hhmm(p_hhmm) THEN
    RAISE EXCEPTION 'Invalid time format %, expected HH:MM', p_hhmm USING ERRCODE = '22023';
  END IF;

  v_hour := split_part(p_hhmm, ':', 1)::int;
  v_min := split_part(p_hhmm, ':', 2)::int;

  -- Take today at local time, convert to UTC components for cron
  v_utc := (date_trunc('day', now() at time zone p_tz) + make_time(v_hour, v_min, 0)) at time zone p_tz;
  v_utc_hour := extract(hour from v_utc);
  v_utc_min := extract(minute from v_utc);

  RETURN format('%s %s * * *', v_utc_min, v_utc_hour);
END;
$$;

-- RPC: set_email_schedule (upserts app_settings and reschedules cron)
CREATE OR REPLACE FUNCTION public.set_email_schedule(
  p_enabled boolean,
  p_time text,
  p_timezone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cron text;
  v_jobid int;
  v_command text;
BEGIN
  IF p_enabled IS NULL THEN
    RAISE EXCEPTION 'p_enabled cannot be null';
  END IF;
  IF p_time IS NULL OR NOT public.validate_hhmm(p_time) THEN
    RAISE EXCEPTION 'Invalid p_time (HH:MM expected)';
  END IF;
  IF coalesce(p_timezone,'') = '' THEN
    RAISE EXCEPTION 'p_timezone cannot be empty';
  END IF;

  -- Upsert settings
  INSERT INTO app_settings(key, value, description)
  VALUES
    ('email_schedule_enabled', CASE WHEN p_enabled THEN 'true' ELSE 'false' END, 'Whether automatic daily emails are enabled'),
    ('email_schedule_time', p_time, 'Time (HH:MM local) for daily emails'),
    ('email_timezone', p_timezone, 'Timezone for the email schedule')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

  -- If disabled, unschedule the job
  IF NOT p_enabled THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'daily-progress-email-job';
    RETURN;
  END IF;

  -- Compute UTC cron from local
  v_cron := public.local_hhmm_to_utc_cron(p_time, p_timezone);

  -- If job exists, capture its command then unschedule and recreate with new schedule.
  SELECT jobid, command INTO v_jobid, v_command FROM cron.job WHERE jobname = 'daily-progress-email-job' LIMIT 1;

  IF v_jobid IS NOT NULL THEN
    -- Keep the same command
    PERFORM cron.unschedule(v_jobid);
    PERFORM cron.schedule('daily-progress-email-job', v_cron, v_command);
  ELSE
    -- Fallback command mirrors initial migration URL (update if your project URL differs)
    v_command := 'SELECT\n' ||
      '        net.http_post(\n' ||
      '            url := ''https://depsfpodwaprzxffdcks.supabase.co/functions/v1/daily-progress-email'',\n' ||
      '            headers := jsonb_build_object(\n' ||
      '                ''Content-Type'', ''application/json'',\n' ||
      '                ''Authorization'', ''Bearer '' || current_setting(''app.settings.service_role_key'', true)\n' ||
      '            ),\n' ||
      '            body := jsonb_build_object(\n' ||
      '                ''source'', ''scheduled'',\n' ||
      '                ''timestamp'', now()\n' ||
      '            )\n' ||
      '        );';
    PERFORM cron.schedule('daily-progress-email-job', v_cron, v_command);
  END IF;
END;
$$;

-- Grants
REVOKE ALL ON FUNCTION public.set_email_schedule(boolean, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_email_schedule(boolean, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_email_schedule(boolean, text, text) TO service_role;

