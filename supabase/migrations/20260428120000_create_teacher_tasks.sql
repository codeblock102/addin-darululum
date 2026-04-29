CREATE TABLE teacher_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  due_date DATE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE teacher_tasks ENABLE ROW LEVEL SECURITY;
-- Admins see all; teachers see only their own
CREATE POLICY "Admins manage all tasks" ON teacher_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Teachers read own tasks" ON teacher_tasks FOR SELECT USING (
  assigned_to = auth.uid()
);
CREATE POLICY "Teachers update own tasks" ON teacher_tasks FOR UPDATE USING (
  assigned_to = auth.uid()
);
