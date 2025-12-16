-- Extend attendance_status enum for new workflows
ALTER TYPE attendance_status ADD VALUE IF NOT EXISTS 'excused';
ALTER TYPE attendance_status ADD VALUE IF NOT EXISTS 'early_departure';

