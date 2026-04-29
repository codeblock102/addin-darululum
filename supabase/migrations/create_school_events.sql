-- School Events table
-- Stores school calendar events: holidays, PD days, exams, special events

CREATE TABLE IF NOT EXISTS school_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  description text,
  event_type  text        NOT NULL DEFAULT 'event'
                          CHECK (event_type IN ('holiday', 'pd_day', 'exam', 'event', 'break')),
  start_date  date        NOT NULL,
  end_date    date,
  all_day     boolean     NOT NULL DEFAULT true,
  color       text,
  created_by  uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Update trigger
CREATE OR REPLACE FUNCTION update_school_events_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_school_events_updated_at
  BEFORE UPDATE ON school_events
  FOR EACH ROW EXECUTE FUNCTION update_school_events_updated_at();

-- RLS
ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;

-- Everyone can view events
CREATE POLICY "school_events_select_all"
  ON school_events FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "school_events_insert_admin"
  ON school_events FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "school_events_update_admin"
  ON school_events FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "school_events_delete_admin"
  ON school_events FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed a few starter events for the current year
INSERT INTO school_events (title, event_type, start_date, end_date, color)
VALUES
  ('Eid Al-Fitr — School Closed',    'holiday', '2025-03-30', '2025-03-31', '#16a34a'),
  ('Spring Break',                    'break',   '2025-04-14', '2025-04-18', '#0ea5e9'),
  ('PD Day — No Students',            'pd_day',  '2025-04-25', NULL,         '#8b5cf6'),
  ('Eid Al-Adha — School Closed',     'holiday', '2025-06-06', '2025-06-07', '#16a34a'),
  ('End of Year',                     'event',   '2025-06-20', NULL,         '#f59e0b'),
  ('Summer Break',                    'break',   '2025-06-21', '2025-08-31', '#0ea5e9'),
  ('First Day of School 2025-26',     'event',   '2025-09-02', NULL,         '#f59e0b'),
  ('Winter Break',                    'break',   '2025-12-22', '2026-01-04', '#0ea5e9')
ON CONFLICT DO NOTHING;
