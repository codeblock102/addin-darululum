-- Add new values to student_status enum
ALTER TYPE student_status ADD VALUE IF NOT EXISTS 'vacation';
ALTER TYPE student_status ADD VALUE IF NOT EXISTS 'hospitalized';
ALTER TYPE student_status ADD VALUE IF NOT EXISTS 'suspended';
ALTER TYPE student_status ADD VALUE IF NOT EXISTS 'graduated';

-- Add columns for tracking status details
ALTER TABLE students ADD COLUMN IF NOT EXISTS status_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS status_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS status_notes TEXT;

