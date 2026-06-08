-- Notifications outbox — append-only queue of notification events.
--
-- Each row represents one user-addressable notification (urgent / standard /
-- info tier) that the dispatcher consumes and turns into a push, an email,
-- a digest entry, or an in-app inbox card. `delivered_at` is null until the
-- dispatcher hands it off to the chosen transport; `digest_batch_id` groups
-- standard-tier rows bundled into the same morning/evening digest.
--
-- Authorization model:
--   * SELECT — the addressee (auth.uid() = user_id) only.
--   * INSERT — disallowed via RLS. Server-side enqueue must go through the
--     SECURITY DEFINER helper public.enqueue_notification(...) defined
--     below (or via the service role from an edge function).
--   * UPDATE / DELETE — disallowed for end users. The dispatcher runs as
--     service_role (bypasses RLS) when stamping `delivered_at` or assigning
--     a `digest_batch_id`.

-- --------------------------------------------------------------------------
-- Table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications_outbox (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid         NOT NULL
                                  REFERENCES auth.users(id) ON DELETE CASCADE,
  tier             text         NOT NULL
                                  CHECK (tier IN ('urgent','standard','info')),
  title            text         NOT NULL,
  body             text,
  deep_link        text,
  payload          jsonb        DEFAULT '{}'::jsonb,
  delivered_at     timestamptz,
  digest_batch_id  uuid,
  created_at       timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.notifications_outbox IS
  'Append-only queue of user-addressable notification events consumed by the dispatcher. Direct client INSERT is denied — use public.enqueue_notification() or the service role.';
COMMENT ON COLUMN public.notifications_outbox.tier            IS 'Delivery tier: urgent (immediate push), standard (real-time or digest per prefs), info (in-app only by default).';
COMMENT ON COLUMN public.notifications_outbox.title           IS 'Short headline shown in the push / inbox card.';
COMMENT ON COLUMN public.notifications_outbox.body            IS 'Optional longer-form body.';
COMMENT ON COLUMN public.notifications_outbox.deep_link       IS 'Optional in-app route the inbox card should open on tap.';
COMMENT ON COLUMN public.notifications_outbox.payload         IS 'Free-form structured context for renderers (e.g. student_id, assignment_id).';
COMMENT ON COLUMN public.notifications_outbox.delivered_at    IS 'When the dispatcher handed this row off to a transport. Null = still pending.';
COMMENT ON COLUMN public.notifications_outbox.digest_batch_id IS 'When set, this row was delivered as part of the named digest batch (morning/evening).';

-- --------------------------------------------------------------------------
-- Indexes
--   * (user_id, created_at desc) — per-user inbox listing, newest first.
--   * (user_id, delivered_at) WHERE delivered_at IS NULL — pending-only
--     scans for the dispatcher (partial index keeps it small).
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS notifications_outbox_user_created_at_idx
  ON public.notifications_outbox (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_outbox_user_pending_idx
  ON public.notifications_outbox (user_id, delivered_at)
  WHERE delivered_at IS NULL;

-- --------------------------------------------------------------------------
-- RLS — user can read their own rows; no client writes.
-- --------------------------------------------------------------------------
ALTER TABLE public.notifications_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own outbox notifications"
  ON public.notifications_outbox;
DROP POLICY IF EXISTS "Deny direct writes to notifications outbox"
  ON public.notifications_outbox;

CREATE POLICY "Users can view their own outbox notifications"
  ON public.notifications_outbox
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Blanket deny on writes for non-definer callers. The service role bypasses
-- RLS, and public.enqueue_notification() is SECURITY DEFINER, so both legit
-- write paths still work. This guards against direct PostgREST writes by
-- authenticated or anon clients.
CREATE POLICY "Deny direct writes to notifications outbox"
  ON public.notifications_outbox
  FOR ALL TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- --------------------------------------------------------------------------
-- SECURITY DEFINER enqueue helper.
--
-- Edge functions / triggers that need to enqueue a notification call this
-- instead of issuing a raw INSERT, so the deny-all-writes RLS policy can
-- remain blanket while still allowing well-scoped server-side enqueues
-- from `authenticated` contexts (e.g. an RPC invoked by an edge function).
-- The service role can of course still INSERT directly — RLS does not
-- apply there.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_notification(
  p_user_id    uuid,
  p_tier       text,
  p_title      text,
  p_body       text  DEFAULT NULL,
  p_deep_link  text  DEFAULT NULL,
  p_payload    jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'enqueue_notification: user_id is required';
  END IF;
  IF p_tier NOT IN ('urgent','standard','info') THEN
    RAISE EXCEPTION 'enqueue_notification: invalid tier %', p_tier;
  END IF;
  IF p_title IS NULL OR length(btrim(p_title)) = 0 THEN
    RAISE EXCEPTION 'enqueue_notification: title is required';
  END IF;

  INSERT INTO public.notifications_outbox
    (user_id, tier, title, body, deep_link, payload)
  VALUES
    (p_user_id, p_tier, p_title, p_body, p_deep_link, COALESCE(p_payload, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_notification(uuid, text, text, text, text, jsonb)
  FROM public;
GRANT EXECUTE ON FUNCTION public.enqueue_notification(uuid, text, text, text, text, jsonb)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.enqueue_notification(uuid, text, text, text, text, jsonb) IS
  'Server-side enqueue for public.notifications_outbox. SECURITY DEFINER — bypasses the deny-all writes RLS so callers do not need direct INSERT rights.';
