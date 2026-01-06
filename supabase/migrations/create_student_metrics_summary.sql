-- Create student_metrics_summary table for pre-aggregated per-student metrics
-- This table stores daily aggregated student metrics to avoid heavy calculations on page load

CREATE TABLE IF NOT EXISTS student_metrics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  student_id UUID NOT NULL,
  student_name TEXT,
  
  -- Essential student metrics
  at_risk_score DECIMAL(5,2) DEFAULT 0,
  memorization_pace DECIMAL(5,2) DEFAULT 0, -- pages per week
  attendance_rate DECIMAL(5,2) DEFAULT 0,
  is_stagnant BOOLEAN DEFAULT false,
  days_since_progress INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(date, student_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_student_metrics_date ON student_metrics_summary(date DESC);
CREATE INDEX IF NOT EXISTS idx_student_metrics_student ON student_metrics_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_student_metrics_at_risk ON student_metrics_summary(at_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_student_metrics_stagnant ON student_metrics_summary(is_stagnant, days_since_progress DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE student_metrics_summary ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read student metrics summary
CREATE POLICY "Admins can read student metrics summary"
  ON student_metrics_summary
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Allow service role to insert/update (for aggregation job)
CREATE POLICY "Service role can manage student metrics summary"
  ON student_metrics_summary
  FOR ALL
  USING (true)
  WITH CHECK (true);

