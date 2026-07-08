-- Follow-up to 20260615002000_notification_preferences.sql
--
-- Adds the columns the send-digest edge function reads/writes:
--   * last_delivered_at — high-water mark for the last successful digest send,
--                         used to avoid re-sending notifications already bundled
--                         into a prior digest.
--   * timezone          — IANA timezone string used to evaluate the user's local
--                         digest_morning_at / digest_evening_at windows. Null
--                         falls back to the REPORT_TIMEZONE env default.
--
-- Email address is intentionally NOT stored here; the dispatcher joins to
-- auth.users for the canonical email so prefs stay a pure preferences table.

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS last_delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS timezone          text;

COMMENT ON COLUMN public.notification_preferences.last_delivered_at IS
  'Timestamp of the last successful standard-tier digest delivery for this user. Set by the send-digest edge function only after transport succeeds.';
COMMENT ON COLUMN public.notification_preferences.timezone IS
  'IANA timezone (e.g. ''America/Toronto'') used to evaluate digest_morning_at / digest_evening_at and quiet-hours windows. Null = server default.';
