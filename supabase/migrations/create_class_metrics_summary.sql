-- Create class_metrics_summary table for pre-aggregated per-class metrics
-- This table stores weekly aggregated class metrics to avoid heavy calculations on page load

CREATE TABLE IF NOT EXISTS class_metrics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL, -- Start of the week (Monday)
  class_id UUID NOT NULL,
  class_name TEXT,
  
  -- Essential class metrics
  student_count INTEGER DEFAULT 0,
  capacity INTEGER DEFAULT 0,
  capacity_utilization DECIMAL(5,2) DEFAULT 0, -- current_students / capacity
  avg_progress DECIMAL(5,2) DEFAULT 0, -- average pages memorized per student
  attendance_rate DECIMAL(5,2) DEFAULT 0,
  dropoff_rate DECIMAL(5,2) DEFAULT 0, -- students_dropped / students_enrolled
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(week_start, class_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_class_metrics_week ON class_metrics_summary(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_class_metrics_class ON class_metrics_summary(class_id);
CREATE INDEX IF NOT EXISTS idx_class_metrics_capacity ON class_metrics_summary(capacity_utilization DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE class_metrics_summary ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read class metrics summary
CREATE POLICY "Admins can read class metrics summary"
  ON class_metrics_summary
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Allow service role to insert/update (for aggregation job)
CREATE POLICY "Service role can manage class metrics summary"
  ON class_metrics_summary
  FOR ALL
  USING (true)
  WITH CHECK (true);

