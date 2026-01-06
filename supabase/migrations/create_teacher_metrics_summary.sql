-- Create teacher_metrics_summary table for pre-aggregated per-teacher metrics
-- This table stores weekly aggregated teacher metrics to avoid heavy calculations on page load

CREATE TABLE IF NOT EXISTS teacher_metrics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL, -- Start of the week (Monday)
  teacher_id UUID NOT NULL,
  teacher_name TEXT,
  
  -- Essential teacher metrics
  student_count INTEGER DEFAULT 0,
  avg_student_pace DECIMAL(5,2) DEFAULT 0, -- average pages per week across students
  at_risk_students_count INTEGER DEFAULT 0,
  session_reliability DECIMAL(5,2) DEFAULT 0, -- sessions_conducted / sessions_scheduled
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(week_start, teacher_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_teacher_metrics_week ON teacher_metrics_summary(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_metrics_teacher ON teacher_metrics_summary(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_metrics_at_risk ON teacher_metrics_summary(at_risk_students_count DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE teacher_metrics_summary ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read teacher metrics summary
CREATE POLICY "Admins can read teacher metrics summary"
  ON teacher_metrics_summary
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Allow service role to insert/update (for aggregation job)
CREATE POLICY "Service role can manage teacher metrics summary"
  ON teacher_metrics_summary
  FOR ALL
  USING (true)
  WITH CHECK (true);

