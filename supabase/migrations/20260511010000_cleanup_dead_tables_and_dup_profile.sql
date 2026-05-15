-- DB cleanup 2026-05-11:
-- 1) Drop 5 dead empty tables (zero rows, zero code refs)
-- 2) Resolve duplicate profile (maimoona.ansari@gmail.com orphan admin row)
-- 3) Add unique index on profiles.email to prevent future dups

DROP TABLE IF EXISTS public.analytics_alerts CASCADE;
DROP TABLE IF EXISTS public.analytics_summary CASCADE;
DROP TABLE IF EXISTS public.class_metrics_summary CASCADE;
DROP TABLE IF EXISTS public.student_metrics_summary CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;

DELETE FROM public.profiles
WHERE id = '794ca656-d5c8-4c28-bb36-e6f58baaa34e'
  AND email = 'maimoona.ansari@gmail.com'
  AND role = 'admin';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx ON public.profiles (LOWER(email));
