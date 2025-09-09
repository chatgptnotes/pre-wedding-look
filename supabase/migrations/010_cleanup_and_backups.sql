-- ============================================
-- CLEANUP & BACKUP CONFIGURATION
-- ============================================

-- Table for tracking cleanup operations
CREATE TABLE IF NOT EXISTS cleanup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    records_affected INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to clean up old unsaved images (24h retention)
CREATE OR REPLACE FUNCTION cleanup_old_images()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    -- Delete generation queue entries older than 24 hours
    DELETE FROM generation_queue
    WHERE created_at < NOW() - INTERVAL '24 hours'
    AND status IN ('completed', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup operation
    INSERT INTO cleanup_jobs (job_type, status, completed_at, records_affected)
    VALUES ('image_cleanup', 'completed', NOW(), deleted_count);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up abandoned sessions
CREATE OR REPLACE FUNCTION cleanup_abandoned_sessions()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    -- Mark sessions as cancelled if inactive for > 2 hours
    UPDATE blinddate_sessions
    SET status = 'cancelled'
    WHERE status IN ('waiting', 'matchmaking', 'active')
    AND updated_at < NOW() - INTERVAL '2 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup
    INSERT INTO cleanup_jobs (job_type, status, completed_at, records_affected)
    VALUES ('session_cleanup', 'completed', NOW(), deleted_count);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive old completed sessions
CREATE OR REPLACE FUNCTION archive_old_sessions()
RETURNS INT AS $$
DECLARE
    archived_count INT;
BEGIN
    -- Archive sessions older than 30 days
    INSERT INTO archived_sessions (
        SELECT * FROM blinddate_sessions
        WHERE status = 'completed'
        AND created_at < NOW() - INTERVAL '30 days'
    );
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Delete archived sessions from main table
    DELETE FROM blinddate_sessions
    WHERE status = 'completed'
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- Log operation
    INSERT INTO cleanup_jobs (job_type, status, completed_at, records_affected)
    VALUES ('session_archive', 'completed', NOW(), archived_count);
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Archive table structure
CREATE TABLE IF NOT EXISTS archived_sessions (
    LIKE blinddate_sessions INCLUDING ALL
);

CREATE TABLE IF NOT EXISTS archived_participants (
    LIKE blinddate_participants INCLUDING ALL
);

CREATE TABLE IF NOT EXISTS archived_designs (
    LIKE blinddate_round_designs INCLUDING ALL
);

-- Scheduled job configuration (use pg_cron extension or external scheduler)
-- These would be configured in your cron service or Supabase Dashboard

-- Daily cleanup jobs schedule:
-- 00:00 UTC - cleanup_old_images()
-- 01:00 UTC - cleanup_abandoned_sessions()
-- 02:00 UTC - archive_old_sessions()
-- 03:00 UTC - VACUUM ANALYZE

-- Backup configuration function
CREATE OR REPLACE FUNCTION configure_backup_retention()
RETURNS void AS $$
BEGIN
    -- This is a placeholder for backup configuration
    -- Actual backups should be configured through Supabase Dashboard
    -- or using pg_dump with a scheduled job
    
    -- Log backup configuration
    INSERT INTO cleanup_jobs (job_type, status, completed_at)
    VALUES ('backup_config', 'completed', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    retention_days INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default retention policies
INSERT INTO data_retention_policies (table_name, retention_days) VALUES
    ('generation_queue', 1),
    ('blinddate_sessions', 30),
    ('rate_limit_logs', 7),
    ('application_logs', 14),
    ('cleanup_jobs', 30)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_old_images() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_abandoned_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION archive_old_sessions() TO authenticated;
GRANT SELECT ON cleanup_jobs TO authenticated;
GRANT SELECT ON data_retention_policies TO authenticated;