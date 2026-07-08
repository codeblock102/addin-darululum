-- Pre-aggregated analytics + per-entity metrics summary tables.
-- Supersedes the malformed-name files create_analytics_summary.sql,
-- create_analytics_alerts.sql, create_class_metrics_summary.sql,
-- create_student_metrics_summary.sql, create_teacher_metrics_summary.sql
-- (which the Supabase CLI skipped because their names lacked a timestamp prefix).
-- Applied to the linked project 2026-07-08; captured here so repo == migration history.

CREATE TABLE IF NOT EXISTS analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL, institution_id UUID,
  total_active_students INTEGER DEFAULT 0, students_on_track_count INTEGER DEFAULT 0,
  students_on_track_percentage DECIMAL(5,2) DEFAULT 0, at_risk_students_count INTEGER DEFAULT 0,
  at_risk_students_percentage DECIMAL(5,2) DEFAULT 0, overall_attendance_rate DECIMAL(5,2) DEFAULT 0,
  overall_memorization_velocity DECIMAL(5,2) DEFAULT 0, total_active_teachers INTEGER DEFAULT 0,
  teachers_with_at_risk_count INTEGER DEFAULT 0, teachers_with_at_risk_percentage DECIMAL(5,2) DEFAULT 0,
  avg_session_reliability DECIMAL(5,2) DEFAULT 0, student_retention_30day DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(date, institution_id));
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON analytics_summary(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_institution ON analytics_summary(institution_id);
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read analytics summary" ON analytics_summary;
CREATE POLICY "Admins can read analytics summary" ON analytics_summary FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE TABLE IF NOT EXISTS analytics_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), date DATE NOT NULL,
  type TEXT NOT NULL, severity TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
  entity_id UUID NOT NULL, entity_name TEXT NOT NULL, entity_type TEXT NOT NULL,
  title TEXT NOT NULL, description TEXT NOT NULL, threshold DECIMAL(10,2), current_value DECIMAL(10,2),
  action_recommendation TEXT, created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ, resolved_at TIMESTAMPTZ, metadata JSONB);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_date ON analytics_alerts(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_status ON analytics_alerts(status, severity DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_entity ON analytics_alerts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_type ON analytics_alerts(type, status);
ALTER TABLE analytics_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read analytics alerts" ON analytics_alerts;
CREATE POLICY "Admins can read analytics alerts" ON analytics_alerts FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Admins can update analytics alerts" ON analytics_alerts;
CREATE POLICY "Admins can update analytics alerts" ON analytics_alerts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE TABLE IF NOT EXISTS class_metrics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), week_start DATE NOT NULL, class_id UUID NOT NULL, class_name TEXT,
  student_count INTEGER DEFAULT 0, capacity INTEGER DEFAULT 0, capacity_utilization DECIMAL(5,2) DEFAULT 0,
  avg_progress DECIMAL(5,2) DEFAULT 0, attendance_rate DECIMAL(5,2) DEFAULT 0, dropoff_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(week_start, class_id));
CREATE INDEX IF NOT EXISTS idx_class_metrics_week ON class_metrics_summary(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_class_metrics_class ON class_metrics_summary(class_id);
CREATE INDEX IF NOT EXISTS idx_class_metrics_capacity ON class_metrics_summary(capacity_utilization DESC);
ALTER TABLE class_metrics_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read class metrics summary" ON class_metrics_summary;
CREATE POLICY "Admins can read class metrics summary" ON class_metrics_summary FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE TABLE IF NOT EXISTS student_metrics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), date DATE NOT NULL, student_id UUID NOT NULL, student_name TEXT,
  at_risk_score DECIMAL(5,2) DEFAULT 0, memorization_pace DECIMAL(5,2) DEFAULT 0, attendance_rate DECIMAL(5,2) DEFAULT 0,
  is_stagnant BOOLEAN DEFAULT false, days_since_progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(date, student_id));
CREATE INDEX IF NOT EXISTS idx_student_metrics_date ON student_metrics_summary(date DESC);
CREATE INDEX IF NOT EXISTS idx_student_metrics_student ON student_metrics_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_student_metrics_at_risk ON student_metrics_summary(at_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_student_metrics_stagnant ON student_metrics_summary(is_stagnant, days_since_progress DESC);
ALTER TABLE student_metrics_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read student metrics summary" ON student_metrics_summary;
CREATE POLICY "Admins can read student metrics summary" ON student_metrics_summary FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE TABLE IF NOT EXISTS teacher_metrics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), week_start DATE NOT NULL, teacher_id UUID NOT NULL, teacher_name TEXT,
  student_count INTEGER DEFAULT 0, avg_student_pace DECIMAL(5,2) DEFAULT 0, at_risk_students_count INTEGER DEFAULT 0,
  session_reliability DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(week_start, teacher_id));
CREATE INDEX IF NOT EXISTS idx_teacher_metrics_week ON teacher_metrics_summary(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_metrics_teacher ON teacher_metrics_summary(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_metrics_at_risk ON teacher_metrics_summary(at_risk_students_count DESC);
ALTER TABLE teacher_metrics_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read teacher metrics summary" ON teacher_metrics_summary;
CREATE POLICY "Admins can read teacher metrics summary" ON teacher_metrics_summary FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
