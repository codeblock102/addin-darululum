-- Run this SQL in your Supabase SQL Editor to create the analytics_summary table
-- This is a one-time setup required for the optimized analytics dashboard

CREATE TABLE IF NOT EXISTS analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  institution_id UUID,
  
  -- Student metrics (aggregated)
  total_active_students INTEGER DEFAULT 0,
  students_on_track_count INTEGER DEFAULT 0,
  students_on_track_percentage DECIMAL(5,2) DEFAULT 0,
  at_risk_students_count INTEGER DEFAULT 0,
  at_risk_students_percentage DECIMAL(5,2) DEFAULT 0,
  overall_attendance_rate DECIMAL(5,2) DEFAULT 0,
  overall_memorization_velocity DECIMAL(5,2) DEFAULT 0,
  
  -- Teacher metrics (aggregated)
  total_active_teachers INTEGER DEFAULT 0,
  teachers_with_at_risk_count INTEGER DEFAULT 0,
  teachers_with_at_risk_percentage DECIMAL(5,2) DEFAULT 0,
  avg_session_reliability DECIMAL(5,2) DEFAULT 0,
  
  -- Program metrics
  student_retention_30day DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(date, institution_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON analytics_summary(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_institution ON analytics_summary(institution_id);

-- Enable RLS (Row Level Security)
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read analytics summary
CREATE POLICY "Admins can read analytics summary"
  ON analytics_summary
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Allow service role to insert/update (for aggregation job)
CREATE POLICY "Service role can manage analytics summary"
  ON analytics_summary
  FOR ALL
  USING (true)
  WITH CHECK (true);

