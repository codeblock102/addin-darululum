-- Sample madrassahs for testing admin creator functionality
-- Run this script if you don't have any madrassahs in your database

INSERT INTO madrassahs (id, name, location, section, created_at) VALUES
  (gen_random_uuid(), 'Jamia Darul Uloom', 'New York', ARRAY['Boys', 'Girls'], NOW()),
  (gen_random_uuid(), 'Madrassa Al-Noor', 'Chicago', ARRAY['Boys'], NOW()),
  (gen_random_uuid(), 'Darul Hadith Institute', 'Los Angeles', ARRAY['Boys', 'Girls'], NOW()),
  (gen_random_uuid(), 'Al-Fatah Academy', 'Houston', ARRAY['Girls'], NOW()),
  (gen_random_uuid(), 'Baitul Ilm Institute', 'Philadelphia', ARRAY['Boys', 'Girls'], NOW())
ON CONFLICT (id) DO NOTHING;

-- Display created madrassahs
SELECT id, name, location, section FROM madrassahs ORDER BY name; 