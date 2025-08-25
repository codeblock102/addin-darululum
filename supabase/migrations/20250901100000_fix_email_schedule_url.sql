-- Ensure pg_cron exists
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add a configurable base URL for Edge Functions if not present
INSERT INTO app_settings(key, value, description)
VALUES ('functions_base_url', '', 'Base URL for your Supabase project (e.g., https://xyzcompany.supabase.co)')
ON CONFLICT (key) DO NOTHING;

-- Recreate set_email_schedule to always use functions_base_url
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
  v_base_url text;
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

  -- Read project Edge Functions base URL from app_settings
  SELECT value INTO v_base_url FROM app_settings WHERE key = 'functions_base_url';
  IF coalesce(v_base_url, '') = '' THEN
    RAISE EXCEPTION 'functions_base_url is not set in app_settings. Set it to your project base URL (e.g., https://your-project.supabase.co).';
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

  -- Build the command using the configured base URL
  v_command := 'SELECT\n' ||
      '  net.http_post(\n' ||
      '    url := ''' || v_base_url || '/functions/v1/daily-progress-email'',\n' ||
      '    headers := jsonb_build_object(\n' ||
      '      ''Content-Type'', ''application/json'',\n' ||
      '      ''Authorization'', ''Bearer '' || coalesce(vault.get_secret(''service_role_key''), current_setting(''app.settings.service_role_key'', true))\n' ||
      '    ),\n' ||
      '    body := jsonb_build_object(''source'', ''scheduled'', ''timestamp'', now())\n' ||
      '  );';

  -- Replace existing schedule
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'daily-progress-email-job' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
  PERFORM cron.schedule('daily-progress-email-job', v_cron, v_command);
END;
$$;

REVOKE ALL ON FUNCTION public.set_email_schedule(boolean, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_email_schedule(boolean, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_email_schedule(boolean, text, text) TO service_role;

