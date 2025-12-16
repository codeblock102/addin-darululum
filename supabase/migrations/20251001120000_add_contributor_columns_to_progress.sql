-- Add contributor tracking to progress entries
-- Stores which teacher/user entered the progress

-- 1) Add columns if they don't already exist
ALTER TABLE public.progress
  ADD COLUMN IF NOT EXISTS contributor_id uuid,
  ADD COLUMN IF NOT EXISTS contributor_name text;

-- 2) Index on contributor_id to speed up analytics grouping
CREATE INDEX IF NOT EXISTS idx_progress_contributor_id
  ON public.progress (contributor_id);

-- 3) Foreign key to profiles(id); use ON DELETE SET NULL to keep history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_progress_contributor_profile'
  ) THEN
    ALTER TABLE public.progress
      ADD CONSTRAINT fk_progress_contributor_profile
      FOREIGN KEY (contributor_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END
$$;





