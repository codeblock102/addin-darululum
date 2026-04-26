-- Create a sample student
INSERT INTO public.students (name, guardian_name, guardian_email, status, madrassah_id, section)
VALUES 
  ('Test Student', 'Test Guardian', 'test@example.com', 'active', '1', 'A')
ON CONFLICT (id) DO NOTHING;

-- Create a sample progress record for today for the test student
-- Note: You might need to adjust the student_id if it's not the first record.
INSERT INTO public.progress (student_id, date, pages_memorized, current_surah, start_ayat, end_ayat, memorization_quality)
VALUES
  ((SELECT id FROM public.students WHERE name = 'Test Student' LIMIT 1), NOW()::date, 1, 1, 1, 5, 'Good'); 