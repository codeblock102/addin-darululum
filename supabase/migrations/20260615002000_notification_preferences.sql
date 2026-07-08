-- Per-user notification preferences.
--
-- Stores delivery preferences (push vs digest vs in-app) and quiet-hours
-- windows used by the notifications outbox / dispatcher. One row per
-- auth.users record — auto-created via a SECURITY DEFINER trigger on
-- auth.users insert so every signup gets sensible defaults.
--
-- Authorization model: these are personal preferences, NOT data shared with
-- staff. RLS allows each user to SELECT / INSERT / UPDATE only their own
-- row. There is intentionally no admin-override policy — admins should not
-- be reading or mutating end-user notification prefs.

-- --------------------------------------------------------------------------
-- Table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id                 uuid PRIMARY KEY
                            REFERENCES auth.users(id) ON DELETE CASCADE,
  urgent_push             boolean      NOT NULL DEFAULT true,
  -- If false, the dispatcher delivers standard-tier events in real time
  -- instead of bundling them into the morning/evening digest.
  standard_digest         boolean      NOT NULL DEFAULT true,
  info_in_app_only        boolean      NOT NULL DEFAULT true,
  digest_morning_at       time         NOT NULL DEFAULT '07:00',
  digest_evening_at       time         NOT NULL DEFAULT '17:00',
  quiet_hours_start       time,
  quiet_hours_end         time,
  locale                  text         NOT NULL DEFAULT 'en',
  auto_translate_inbound  boolean      NOT NULL DEFAULT false,
  show_read_receipts      boolean      NOT NULL DEFAULT false,
  updated_at              timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.notification_preferences IS
  'Per-user notification delivery preferences. Auto-seeded on auth.users insert. RLS restricts each row to its owning user only.';
COMMENT ON COLUMN public.notification_preferences.urgent_push            IS 'Send urgent-tier notifications as immediate push (true) or fall back to in-app only (false).';
COMMENT ON COLUMN public.notification_preferences.standard_digest        IS 'If true, standard-tier events are batched into the morning/evening digest. If false, delivered in real time.';
COMMENT ON COLUMN public.notification_preferences.info_in_app_only       IS 'If true, info-tier events never push; they appear only in the in-app inbox.';
COMMENT ON COLUMN public.notification_preferences.digest_morning_at      IS 'Local time at which the morning digest is sent (default 07:00).';
COMMENT ON COLUMN public.notification_preferences.digest_evening_at      IS 'Local time at which the evening digest is sent (default 17:00).';
COMMENT ON COLUMN public.notification_preferences.quiet_hours_start      IS 'Start of the quiet-hours window during which non-urgent pushes are suppressed.';
COMMENT ON COLUMN public.notification_preferences.quiet_hours_end        IS 'End of the quiet-hours window. Null start/end means no quiet hours.';
COMMENT ON COLUMN public.notification_preferences.locale                 IS 'Preferred locale (BCP-47) for outgoing notification copy.';
COMMENT ON COLUMN public.notification_preferences.auto_translate_inbound IS 'If true, inbound messages addressed to this user are auto-translated into locale before display.';
COMMENT ON COLUMN public.notification_preferences.show_read_receipts     IS 'If true, this user emits read receipts to senders.';

-- --------------------------------------------------------------------------
-- updated_at trigger — mirror the moddatetime/fallback pattern used by
-- 20260615001000_student_streaks.sql so this migration applies cleanly on
-- environments where the moddatetime extension is not installed.
-- --------------------------------------------------------------------------
DO $$
DECLARE
  v_has_moddatetime boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'moddatetime'
  ) INTO v_has_moddatetime;

  IF v_has_moddatetime THEN
    EXECUTE $sql$
      DROP TRIGGER IF EXISTS notification_preferences_set_updated_at
        ON public.notification_preferences;
      CREATE TRIGGER notification_preferences_set_updated_at
        BEFORE UPDATE ON public.notification_preferences
        FOR EACH ROW
        EXECUTE FUNCTION extensions.moddatetime('updated_at');
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE OR REPLACE FUNCTION public.notification_preferences_touch_updated_at()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $fn$
      BEGIN
        NEW.updated_at := now();
        RETURN NEW;
      END;
      $fn$;

      DROP TRIGGER IF EXISTS notification_preferences_set_updated_at
        ON public.notification_preferences;
      CREATE TRIGGER notification_preferences_set_updated_at
        BEFORE UPDATE ON public.notification_preferences
        FOR EACH ROW
        EXECUTE FUNCTION public.notification_preferences_touch_updated_at();
    $sql$;
  END IF;
END;
$$;

-- --------------------------------------------------------------------------
-- RLS — owner-only access; no admin override.
-- --------------------------------------------------------------------------
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Idempotent: drop any pre-existing policies so the migration can re-run.
DROP POLICY IF EXISTS "Users can view their own notification preferences"
  ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences"
  ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences"
  ON public.notification_preferences;

CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Note: no DELETE policy. Rows are removed automatically via the
-- ON DELETE CASCADE foreign key when the auth.users row is deleted.

-- --------------------------------------------------------------------------
-- Auto-seed a defaults row on every new auth.users insert.
--
-- No existing handle_new_user / on_auth_user_created trigger ships with
-- this repo (grep over supabase/migrations confirms), so we create a
-- dedicated trigger here. It is SECURITY DEFINER so it can write into
-- public.notification_preferences regardless of the inserting role and
-- without being blocked by RLS. The function deliberately ON CONFLICT
-- DO NOTHING so re-running the trigger (e.g. after a manual backfill)
-- is harmless.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_prefs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user_notification_prefs() FROM public;

COMMENT ON FUNCTION public.handle_new_user_notification_prefs() IS
  'AFTER INSERT trigger on auth.users that seeds a defaults row in public.notification_preferences. SECURITY DEFINER — bypasses RLS.';

DROP TRIGGER IF EXISTS on_auth_user_created_seed_notification_prefs
  ON auth.users;

CREATE TRIGGER on_auth_user_created_seed_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_notification_prefs();

-- --------------------------------------------------------------------------
-- Backfill: every existing auth.users row gets a defaults row too, so the
-- dispatcher can rely on the row always existing without a JOIN-or-default
-- shim on the read path.
-- --------------------------------------------------------------------------
INSERT INTO public.notification_preferences (user_id)
SELECT u.id
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;
