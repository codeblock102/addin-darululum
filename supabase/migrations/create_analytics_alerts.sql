-- Create analytics_alerts table for pre-computed alerts
-- This table stores daily generated alerts to avoid real-time calculations

CREATE TABLE IF NOT EXISTS analytics_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  
  -- Alert metadata
  type TEXT NOT NULL, -- 'missed_sessions_threshold', 'memorization_pace_drop', 'high_at_risk_concentration', 'class_overcapacity', 'excessive_teacher_cancellations'
  severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  
  -- Entity information
  entity_id UUID NOT NULL, -- student_id, teacher_id, or class_id
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'student', 'teacher', 'class', 'program'
  
  -- Alert details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  threshold DECIMAL(10,2),
  current_value DECIMAL(10,2),
  action_recommendation TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_date ON analytics_alerts(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_status ON analytics_alerts(status, severity DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_entity ON analytics_alerts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_type ON analytics_alerts(type, status);

-- Enable RLS (Row Level Security)
ALTER TABLE analytics_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read analytics alerts
CREATE POLICY "Admins can read analytics alerts"
  ON analytics_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Allow admins to update alerts (acknowledge/resolve)
CREATE POLICY "Admins can update analytics alerts"
  ON analytics_alerts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Note: Service role (used by aggregation job) bypasses RLS by default in Supabase
-- No explicit policy needed - service role has full access when using service_role key

