-- Create email_logs table to track email sending events
CREATE TABLE email_logs (
    id BIGSERIAL PRIMARY KEY,
    trigger_source TEXT NOT NULL CHECK (trigger_source IN ('manual', 'scheduled', 'test', 'unknown')),
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'error')),
    emails_sent INTEGER DEFAULT 0,
    emails_skipped INTEGER DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_email_logs_triggered_at ON email_logs(triggered_at DESC);
CREATE INDEX idx_email_logs_trigger_source ON email_logs(trigger_source);
CREATE INDEX idx_email_logs_status ON email_logs(status);

-- Grant permissions
GRANT SELECT ON email_logs TO authenticated;
GRANT INSERT ON email_logs TO service_role;

-- Create a view for recent email activity
CREATE OR REPLACE VIEW recent_email_activity AS
SELECT 
    id,
    trigger_source,
    triggered_at,
    status,
    emails_sent,
    emails_skipped,
    message,
    CASE 
        WHEN status = 'completed' AND emails_sent > 0 THEN 'success'
        WHEN status = 'completed' AND emails_sent = 0 THEN 'no_data'
        WHEN status = 'error' THEN 'error'
        ELSE 'pending'
    END as activity_status
FROM email_logs
ORDER BY triggered_at DESC
LIMIT 50;

-- Grant permission to view
GRANT SELECT ON recent_email_activity TO authenticated; 