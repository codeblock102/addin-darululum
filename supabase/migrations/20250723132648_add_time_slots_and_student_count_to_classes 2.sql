ALTER TABLE public.classes
ADD COLUMN time_slots JSONB;

ALTER TABLE public.classes
DROP COLUMN current_students;
