-- Migration: add student dossier fields
-- Adds fields required by the DUM Application Feedback spec and the master student CSV.
-- Fields that already exist (permanent_code, health_card, gender, grade, section,
-- guardian_contact, street, city, province, postal_code) are left unchanged.

-- Language/system (French/English/Bilingual)
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS language         text,          -- French | English | Bilingual
  ADD COLUMN IF NOT EXISTS system           text,          -- French | English (school curriculum)
  ADD COLUMN IF NOT EXISTS hifz_program     boolean DEFAULT false,

-- Additional contact info (from the master CSV)
  ADD COLUMN IF NOT EXISTS secondary_contact      text,    -- secondary guardian name
  ADD COLUMN IF NOT EXISTS secondary_contact_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact       text,   -- emergency contact name + phone

-- Health & administrative
  ADD COLUMN IF NOT EXISTS health_notes     text,          -- allergies, IEP notes, medications
  ADD COLUMN IF NOT EXISTS financial_aid    boolean DEFAULT false,

-- Homeschool tracking fields (from Application Feedback → Homeschooling Reports)
  ADD COLUMN IF NOT EXISTS learning_traces        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS learning_project       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS final_evaluation       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS resource_person        text,    -- assigned resource/support person

-- Student folder reference
  ADD COLUMN IF NOT EXISTS student_folder_url     text;    -- link to Google Drive / external folder

-- Add a comment summarising the purpose of these columns
COMMENT ON COLUMN students.permanent_code       IS 'Quebec permanent student code (code permanent)';
COMMENT ON COLUMN students.health_card          IS 'Quebec health card number (carte soleil)';
COMMENT ON COLUMN students.language             IS 'Preferred language: French | English | Bilingual';
COMMENT ON COLUMN students.system               IS 'School curriculum system: French | English';
COMMENT ON COLUMN students.hifz_program         IS 'Whether student is enrolled in Hifz program';
COMMENT ON COLUMN students.health_notes         IS 'Allergies, IEP requirements, medications, accommodations';
COMMENT ON COLUMN students.financial_aid        IS 'Whether student has a financial aid application on file';
COMMENT ON COLUMN students.learning_traces      IS 'Homeschool: learning traces document on file';
COMMENT ON COLUMN students.learning_project     IS 'Homeschool: learning project document on file';
COMMENT ON COLUMN students.final_evaluation     IS 'Homeschool: final evaluation completed';
COMMENT ON COLUMN students.resource_person      IS 'Name of assigned resource/support person';
