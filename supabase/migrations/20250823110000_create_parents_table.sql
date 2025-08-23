-- Parents consolidated table
CREATE TABLE IF NOT EXISTS public.parents (
  id uuid PRIMARY KEY, -- same as auth.users.id
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  address text,
  madrassah_id uuid,
  student_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Keep updated_at current
DROP TRIGGER IF EXISTS set_parents_updated_at ON public.parents;
CREATE TRIGGER set_parents_updated_at
BEFORE UPDATE ON public.parents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parents_madrassah_id ON public.parents(madrassah_id);
CREATE INDEX IF NOT EXISTS idx_parents_student_ids ON public.parents USING GIN (student_ids);

-- Enable RLS
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust as needed)
DROP POLICY IF EXISTS "parents_select_self_or_admin" ON public.parents;
CREATE POLICY "parents_select_self_or_admin"
  ON public.parents
  FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "parents_upsert_admin" ON public.parents;
CREATE POLICY "parents_upsert_admin"
  ON public.parents
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Backfill data from existing tables if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='parent_teachers'
  ) THEN
    INSERT INTO public.parents (id, name, email, phone, address, madrassah_id, student_ids)
    SELECT
      pt.id,
      pt.name,
      pt.email,
      pt.phone,
      pt.address,
      pt.madrassah_id,
      COALESCE(pc.student_ids, '{}'::uuid[]) AS student_ids
    FROM public.parent_teachers pt
    LEFT JOIN public.parent_children pc ON pc.parent_id = pt.id
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      madrassah_id = EXCLUDED.madrassah_id,
      student_ids = EXCLUDED.student_ids,
      updated_at = now();
  END IF;
END$$;

-- Remove legacy compatibility view if it exists
DROP VIEW IF EXISTS public.parent_teachers_view;

-- Drop legacy tables after consolidation
DROP TABLE IF EXISTS public.parent_children;
DROP TABLE IF EXISTS public.parent_teachers;


