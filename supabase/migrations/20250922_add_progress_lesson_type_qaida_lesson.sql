-- Add lesson_type enum and columns for Nazirah & Qaida recording
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'lesson_type'
  ) THEN
    CREATE TYPE lesson_type AS ENUM ('hifz', 'nazirah', 'qaida');
  END IF;
END$$;

-- Add lesson_type column to progress if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'progress' AND column_name = 'lesson_type'
  ) THEN
    ALTER TABLE public.progress ADD COLUMN lesson_type lesson_type;
  END IF;
END$$;

-- Add qaida_lesson column to progress if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'progress' AND column_name = 'qaida_lesson'
  ) THEN
    ALTER TABLE public.progress ADD COLUMN qaida_lesson text;
  END IF;
END$$;


