-- Add secondary guardian fields to students table
ALTER TABLE IF EXISTS public.students
  ADD COLUMN IF NOT EXISTS guardian2_name text,
  ADD COLUMN IF NOT EXISTS guardian2_contact text,
  ADD COLUMN IF NOT EXISTS guardian2_email text;

-- Optional: no constraints; values are optional and free-form except email
-- You can add validation or indexes later if needed


