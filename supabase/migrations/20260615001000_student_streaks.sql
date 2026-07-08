-- Streak storage and computation for students.
--
-- Tracks per-student "consecutive days of revision" streaks for hifz students,
-- with a freeze mechanism (2 freezes per calendar month, auto-replenished) so
-- a single missed day does not reset the streak.
--
-- Direct client writes are disallowed by RLS — the streak row is only mutated
-- via the SECURITY DEFINER helpers public.recalculate_student_streak() and
-- public.reset_streak_freezes(), which are intended to be invoked from edge
-- functions, dhor-book mutation triggers, or pg_cron jobs.
--
-- "Revision events" are the union of public.juz_revisions, public.sabaq_para,
-- and public.progress (the dhor-book tables — see DhorBook.tsx /
-- useDhorEntryMutation.ts). Each carries a per-day timestamp under a slightly
-- different column name (revision_date / revision_date / date), so we coalesce
-- them when scanning. The tables are looked up via information_schema so this
-- migration still applies cleanly on environments where one of the legacy
-- tables has been dropped.
--
-- Authorization model for SELECT:
--   * the student themselves (auth.uid() = student_id)
--   * linked parents (via public.parent_children OR public.parents.student_ids)
--   * teachers of that student via public.students_teachers (joined by name —
--     same pattern as can_manage_student_photo)
--   * admins (profiles.role = 'admin')
--
-- No client INSERT/UPDATE/DELETE policy is granted; the SECURITY DEFINER
-- functions bypass RLS via their definer rights.

-- --------------------------------------------------------------------------
-- Table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_streaks (
  student_id          uuid PRIMARY KEY
                       REFERENCES public.students(id) ON DELETE CASCADE,
  current_streak      int NOT NULL DEFAULT 0,
  longest_streak      int NOT NULL DEFAULT 0,
  last_revised_date   date,
  freezes_remaining   int NOT NULL DEFAULT 2,
  freezes_reset_at    date NOT NULL DEFAULT (date_trunc('month', current_date) + interval '1 month')::date,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.student_streaks IS
  'Per-student consecutive-day revision streak with monthly freeze budget. Mutated only via public.recalculate_student_streak() / public.reset_streak_freezes().';
COMMENT ON COLUMN public.student_streaks.current_streak    IS 'Length (in days) of the current consecutive-day revision streak.';
COMMENT ON COLUMN public.student_streaks.longest_streak    IS 'Best current_streak ever achieved by this student.';
COMMENT ON COLUMN public.student_streaks.last_revised_date IS 'Most recent revision_date observed for this student across dhor-book tables.';
COMMENT ON COLUMN public.student_streaks.freezes_remaining IS 'Streak freezes left in the current monthly budget (max 2).';
COMMENT ON COLUMN public.student_streaks.freezes_reset_at  IS 'Date on/after which freezes_remaining is topped back up to 2.';

-- Backfill: any rows seeded with the prior default (current_date + 1 month,
-- i.e. monthly anniversary) need to be normalised to the first-of-next-month
-- cadence used by reset_streak_freezes(); otherwise the first cron reset
-- silently shifts their cadence.
UPDATE public.student_streaks
   SET freezes_reset_at = (date_trunc('month', current_date) + interval '1 month')::date
 WHERE freezes_reset_at > (date_trunc('month', current_date) + interval '1 month')::date;

-- --------------------------------------------------------------------------
-- updated_at trigger — use the moddatetime extension if present, otherwise
-- a small plpgsql trigger. Mirrors the defensive-extension-lookup pattern
-- from 20260615000000_student_photo_rls_hardening.sql.
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
      DROP TRIGGER IF EXISTS student_streaks_set_updated_at ON public.student_streaks;
      CREATE TRIGGER student_streaks_set_updated_at
        BEFORE UPDATE ON public.student_streaks
        FOR EACH ROW
        EXECUTE FUNCTION extensions.moddatetime('updated_at');
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE OR REPLACE FUNCTION public.student_streaks_touch_updated_at()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $fn$
      BEGIN
        NEW.updated_at := now();
        RETURN NEW;
      END;
      $fn$;

      DROP TRIGGER IF EXISTS student_streaks_set_updated_at ON public.student_streaks;
      CREATE TRIGGER student_streaks_set_updated_at
        BEFORE UPDATE ON public.student_streaks
        FOR EACH ROW
        EXECUTE FUNCTION public.student_streaks_touch_updated_at();
    $sql$;
  END IF;
END;
$$;

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
ALTER TABLE public.student_streaks ENABLE ROW LEVEL SECURITY;

-- Defensive: drop any pre-existing policies so this migration is idempotent.
DROP POLICY IF EXISTS "Linked users can view student streaks" ON public.student_streaks;
DROP POLICY IF EXISTS "Deny direct writes to student streaks" ON public.student_streaks;

-- SECURITY DEFINER helper: may the caller view this student's streak row?
-- Mirrors public.can_view_student_photo (admins / linked teachers / linked
-- parents / the student themselves), but inlined to avoid a hard dependency
-- on the photo-RLS migration in case it has not been applied yet.
CREATE OR REPLACE FUNCTION public.can_view_student_streak(p_student_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_has_parent_children boolean;
  v_has_parents boolean;
  v_match boolean := false;
BEGIN
  IF v_uid IS NULL OR p_student_id IS NULL THEN
    RETURN false;
  END IF;

  -- The student themselves.
  IF v_uid = p_student_id THEN
    RETURN true;
  END IF;

  -- Admin bypass.
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_uid AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  -- Teacher linked via students_teachers (joined by name — the schema models
  -- the relationship by student_name, not student_id; see TeacherAttendance.tsx).
  IF EXISTS (
    SELECT 1
    FROM public.students_teachers st
    JOIN public.students s ON s.name = st.student_name
    WHERE st.teacher_id = v_uid
      AND COALESCE(st.active, true) = true
      AND s.id = p_student_id
  ) THEN
    RETURN true;
  END IF;

  -- Parent linkage. The schema has gone through two shapes:
  --   (a) public.parent_children(parent_id, student_id, student_ids uuid[])
  --   (b) public.parents(id, student_ids uuid[])
  -- Check whichever exists.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'parent_children'
  ) INTO v_has_parent_children;

  IF v_has_parent_children THEN
    EXECUTE $sql$
      SELECT EXISTS (
        SELECT 1 FROM public.parent_children pc
        WHERE pc.parent_id = $1
          AND (
            pc.student_id = $2
            OR $2 = ANY (COALESCE(pc.student_ids, ARRAY[]::uuid[]))
          )
      )
    $sql$
    INTO v_match
    USING v_uid, p_student_id;

    IF v_match THEN
      RETURN true;
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'parents'
  ) INTO v_has_parents;

  IF v_has_parents THEN
    EXECUTE $sql$
      SELECT EXISTS (
        SELECT 1 FROM public.parents p
        WHERE p.id = $1
          AND $2 = ANY (COALESCE(p.student_ids, ARRAY[]::uuid[]))
      )
    $sql$
    INTO v_match
    USING v_uid, p_student_id;

    IF v_match THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.can_view_student_streak(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_view_student_streak(uuid) TO authenticated;

-- SELECT: students, linked parents, teachers of that student, admins.
CREATE POLICY "Linked users can view student streaks" ON public.student_streaks
  FOR SELECT TO authenticated
  USING (public.can_view_student_streak(student_id));

-- Deny ALL writes to non-definer callers. The SECURITY DEFINER functions
-- below bypass RLS entirely, so a blanket-deny policy is safe — and it
-- ensures even service-role clients going through the PostgREST API
-- (with RLS enabled) cannot mutate streak rows directly.
CREATE POLICY "Deny direct writes to student streaks" ON public.student_streaks
  FOR ALL TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- --------------------------------------------------------------------------
-- recalculate_student_streak: walk recent revision events for one student,
-- compute the consecutive-day count anchored on the most recent event, and
-- upsert the resulting streak row.
--
-- Algorithm:
--   1. Pull every distinct revision date for this student from juz_revisions
--      / sabaq_para / progress (whichever tables exist), most-recent first.
--   2. If none exist: clear the streak to 0.
--   3. Otherwise, walk dates in descending order and count days where each
--      successive date is exactly 1 day before the previous one.
--   4. Reconcile with stored state:
--        * gap = today - latest_revision_date
--        * gap = 0  → today's entry already counted, keep computed streak
--        * gap = 1 → no entry today; computed streak still valid
--        * gap > 1 and freezes_remaining > 0  → consume one freeze, keep streak
--        * gap > 1 and freezes_remaining = 0  → reset to 1 only if today has an
--          entry, otherwise to 0
--      (Steps 1–3 already produce the correct count given the events; the
--       reconciliation above only fires when the freshest event is in the
--       past relative to current_date.)
--   5. Update longest_streak = greatest(longest_streak, current_streak).
--
-- The function is SECURITY DEFINER so callers (edge functions, triggers on
-- juz_revisions/sabaq_para/progress, pg_cron) do not need write RLS on
-- public.student_streaks.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_student_streak(_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_has_juz_revisions boolean;
  v_has_sabaq_para    boolean;
  v_has_progress      boolean;
  v_today             date := current_date;
  v_latest            date;
  v_prev              date;
  v_curr              date;
  v_computed_streak   int  := 0;
  v_existing          public.student_streaks%ROWTYPE;
  v_freezes           int;
  v_freezes_reset     date;
  v_longest           int;
  v_gap               int;
BEGIN
  IF _student_id IS NULL THEN
    RETURN;
  END IF;

  -- Discover which event tables exist in this environment.
  SELECT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'juz_revisions')
    INTO v_has_juz_revisions;

  SELECT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sabaq_para')
    INTO v_has_sabaq_para;

  SELECT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'progress')
    INTO v_has_progress;

  -- Materialise the distinct event-date set into a temp table for this txn.
  CREATE TEMP TABLE IF NOT EXISTS _streak_events (d date PRIMARY KEY)
    ON COMMIT DROP;
  TRUNCATE _streak_events;

  IF v_has_juz_revisions THEN
    EXECUTE $sql$
      INSERT INTO _streak_events(d)
      SELECT DISTINCT revision_date
      FROM public.juz_revisions
      WHERE student_id = $1
        AND revision_date IS NOT NULL
      ON CONFLICT DO NOTHING
    $sql$ USING _student_id;
  END IF;

  IF v_has_sabaq_para THEN
    EXECUTE $sql$
      INSERT INTO _streak_events(d)
      SELECT DISTINCT revision_date
      FROM public.sabaq_para
      WHERE student_id = $1
        AND revision_date IS NOT NULL
      ON CONFLICT DO NOTHING
    $sql$ USING _student_id;
  END IF;

  IF v_has_progress THEN
    -- public.progress uses "date" (or "last_revision_date" as a fallback).
    EXECUTE $sql$
      INSERT INTO _streak_events(d)
      SELECT DISTINCT COALESCE(date, last_revision_date)
      FROM public.progress
      WHERE student_id = $1
        AND COALESCE(date, last_revision_date) IS NOT NULL
      ON CONFLICT DO NOTHING
    $sql$ USING _student_id;
  END IF;

  -- Load (or seed) the existing streak row so we know freeze state.
  SELECT * INTO v_existing
  FROM public.student_streaks
  WHERE student_id = _student_id;

  IF NOT FOUND THEN
    v_freezes       := 2;
    v_freezes_reset := (v_today + interval '1 month')::date;
    v_longest       := 0;
  ELSE
    v_freezes       := v_existing.freezes_remaining;
    v_freezes_reset := v_existing.freezes_reset_at;
    v_longest       := v_existing.longest_streak;
  END IF;

  -- No events ever — clear the streak.
  SELECT MAX(d) INTO v_latest FROM _streak_events;

  IF v_latest IS NULL THEN
    INSERT INTO public.student_streaks
      (student_id, current_streak, longest_streak,
       last_revised_date, freezes_remaining, freezes_reset_at, updated_at)
    VALUES
      (_student_id, 0, v_longest, NULL, v_freezes, v_freezes_reset, now())
    ON CONFLICT (student_id) DO UPDATE
      SET current_streak    = 0,
          last_revised_date = NULL,
          updated_at        = now();
    RETURN;
  END IF;

  -- Count consecutive days walking back from v_latest.
  v_computed_streak := 1;
  v_prev := v_latest;
  FOR v_curr IN
    SELECT d FROM _streak_events
    WHERE d < v_latest
    ORDER BY d DESC
  LOOP
    IF v_curr = v_prev - 1 THEN
      v_computed_streak := v_computed_streak + 1;
      v_prev := v_curr;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Reconcile with "today". If the freshest event is older than yesterday and
  -- the student has freezes available, consume one and keep the streak alive.
  -- Otherwise reset to 0 (no entry today) — the next revision will start at 1.
  v_gap := v_today - v_latest;

  IF v_gap > 1 THEN
    IF v_freezes > 0 THEN
      v_freezes := v_freezes - 1;
      -- Streak preserved; do not bump current_streak (no new event today).
    ELSE
      v_computed_streak := 0;
      v_latest := NULL;
    END IF;
  END IF;

  v_longest := GREATEST(v_longest, v_computed_streak);

  INSERT INTO public.student_streaks
    (student_id, current_streak, longest_streak,
     last_revised_date, freezes_remaining, freezes_reset_at, updated_at)
  VALUES
    (_student_id, v_computed_streak, v_longest,
     v_latest, v_freezes, v_freezes_reset, now())
  ON CONFLICT (student_id) DO UPDATE
    SET current_streak    = EXCLUDED.current_streak,
        longest_streak    = EXCLUDED.longest_streak,
        last_revised_date = EXCLUDED.last_revised_date,
        freezes_remaining = EXCLUDED.freezes_remaining,
        freezes_reset_at  = EXCLUDED.freezes_reset_at,
        updated_at        = now();
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_student_streak(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.recalculate_student_streak(uuid)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.recalculate_student_streak(uuid) IS
  'Recompute current_streak / longest_streak / last_revised_date for one student from juz_revisions / sabaq_para / progress, consuming a freeze if the gap > 1 day. SECURITY DEFINER — bypasses student_streaks deny-all RLS.';

-- --------------------------------------------------------------------------
-- reset_streak_freezes: monthly cron — top each row's freezes_remaining back
-- to 2 whenever current_date >= freezes_reset_at, and advance freezes_reset_at
-- to the first day of the next calendar month.
--
-- Intended to be called by a pg_cron job or an edge function cron once a day
-- (running it more often than that is harmless because of the date check).
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_streak_freezes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_today        date := current_date;
  v_next_month_1 date := (date_trunc('month', v_today) + interval '1 month')::date;
BEGIN
  UPDATE public.student_streaks
     SET freezes_remaining = 2,
         freezes_reset_at  = v_next_month_1,
         updated_at        = now()
   WHERE freezes_reset_at <= v_today;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_streak_freezes() FROM public;
GRANT EXECUTE ON FUNCTION public.reset_streak_freezes()
  TO authenticated, service_role;

COMMENT ON FUNCTION public.reset_streak_freezes() IS
  'Monthly cron: replenish freezes_remaining to 2 for any row past its freezes_reset_at, and advance freezes_reset_at to the first day of next month. SECURITY DEFINER — bypasses student_streaks deny-all RLS.';
