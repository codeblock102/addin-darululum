-- Interview Windows: admin creates a block of time for interviews
CREATE TABLE IF NOT EXISTS interview_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  slot_duration_minutes int NOT NULL DEFAULT 15,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Interview Slots: individual bookable time slots
CREATE TABLE IF NOT EXISTS interview_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  window_id uuid NOT NULL REFERENCES interview_windows(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot_date date NOT NULL,
  slot_time time NOT NULL,
  duration_minutes int NOT NULL DEFAULT 15,
  created_at timestamptz DEFAULT now()
);

-- Interview Bookings: parent books a slot
CREATE TABLE IF NOT EXISTS interview_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES interview_slots(id) ON DELETE CASCADE UNIQUE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'no_show')),
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE interview_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_bookings ENABLE ROW LEVEL SECURITY;

-- Windows: everyone reads, only admins write
CREATE POLICY "interview_windows_select" ON interview_windows FOR SELECT USING (true);
CREATE POLICY "interview_windows_admin_all" ON interview_windows FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Slots: everyone reads, only admins write
CREATE POLICY "interview_slots_select" ON interview_slots FOR SELECT USING (true);
CREATE POLICY "interview_slots_admin_all" ON interview_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Bookings: admins + teachers see all; parents see own
CREATE POLICY "interview_bookings_select" ON interview_bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  OR parent_id = auth.uid()
);
CREATE POLICY "interview_bookings_insert_parent" ON interview_bookings FOR INSERT WITH CHECK (
  parent_id = auth.uid()
);
CREATE POLICY "interview_bookings_update" ON interview_bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR parent_id = auth.uid()
);
CREATE POLICY "interview_bookings_delete_admin" ON interview_bookings FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
