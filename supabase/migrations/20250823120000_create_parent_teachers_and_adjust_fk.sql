-- Create parent_teachers table to store parent accounts separate from profiles
CREATE TABLE IF NOT EXISTS public.parent_teachers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text UNIQUE,
  phone text,
  address text,
  madrassah_id uuid REFERENCES public.madrassahs(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parent_teachers ENABLE ROW LEVEL SECURITY;

-- Trigger function to keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_parent_teachers_updated_at ON public.parent_teachers;
CREATE TRIGGER set_parent_teachers_updated_at
BEFORE UPDATE ON public.parent_teachers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Policy: parents can select their own record
DROP POLICY IF EXISTS "parent_select_own_record" ON public.parent_teachers;
CREATE POLICY "parent_select_own_record"
  ON public.parent_teachers
  FOR SELECT
  USING (id = auth.uid());

-- Adjust parent_children to reference parent_teachers(id) instead of profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
      AND table_name = 'parent_children'
      AND constraint_name = 'parent_children_parent_id_fkey'
  ) THEN
    ALTER TABLE public.parent_children DROP CONSTRAINT parent_children_parent_id_fkey;
  END IF;
END $$;

ALTER TABLE public.parent_children
  ADD CONSTRAINT parent_children_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES public.parent_teachers(id) ON DELETE CASCADE;


