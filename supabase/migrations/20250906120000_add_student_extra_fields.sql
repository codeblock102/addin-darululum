-- Add additional student fields for registration
-- gender, grade, health_card, permanent_code, street, city, province, postal_code

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS grade text,
  ADD COLUMN IF NOT EXISTS health_card text,
  ADD COLUMN IF NOT EXISTS permanent_code text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS postal_code text;


