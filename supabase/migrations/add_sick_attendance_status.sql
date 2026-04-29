-- Add 'sick' to the attendance_status enum
-- Run this against your Supabase project via the SQL editor or Supabase CLI

ALTER TYPE attendance_status ADD VALUE IF NOT EXISTS 'sick';
