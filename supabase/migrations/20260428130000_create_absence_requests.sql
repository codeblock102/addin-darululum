CREATE TABLE absence_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  end_date DATE,
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE absence_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own requests" ON absence_requests FOR ALL USING (
  teacher_id = auth.uid()
);
CREATE POLICY "Admins manage all requests" ON absence_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
