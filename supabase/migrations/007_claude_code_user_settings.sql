-- Claude Code User Settings Migration
-- This creates the table for storing user-specific Claude Code configurations

-- Create the claude_code_user_settings table
CREATE TABLE IF NOT EXISTS claude_code_user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_claude_code_user_settings_user_id ON claude_code_user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_claude_code_user_settings_updated_at ON claude_code_user_settings(updated_at);

-- Create the audit log table for tracking bypass operations
CREATE TABLE IF NOT EXISTS claude_code_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    operation TEXT NOT NULL,
    bypassed BOOLEAN NOT NULL DEFAULT false,
    reason TEXT,
    context JSONB,
    result TEXT CHECK (result IN ('success', 'failure', 'rollback')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_claude_code_audit_log_user_id ON claude_code_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_claude_code_audit_log_created_at ON claude_code_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_claude_code_audit_log_operation ON claude_code_audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_claude_code_audit_log_bypassed ON claude_code_audit_log(bypassed);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_claude_code_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER claude_code_settings_updated_at
    BEFORE UPDATE ON claude_code_user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_claude_code_settings_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE claude_code_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_code_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own settings
CREATE POLICY "Users can view their own Claude Code settings"
    ON claude_code_user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Claude Code settings"
    ON claude_code_user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Claude Code settings"
    ON claude_code_user_settings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Claude Code settings"
    ON claude_code_user_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Audit log policies
CREATE POLICY "Users can view their own audit logs"
    ON claude_code_audit_log
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audit logs"
    ON claude_code_audit_log
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to get default Claude Code settings
CREATE OR REPLACE FUNCTION get_default_claude_code_config()
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'confirmationBypass', false,
        'autoAcceptAll', false,
        'commandPrefix', '/',
        'sessionTimeout', 1800000,
        'debugMode', false,
        'riskLevel', 'moderate',
        'allowedOperations', jsonb_build_array(
            'file-read',
            'file-write',
            'directory-list',
            'git-status',
            'npm-install',
            'build-project'
        ),
        'blockedOperations', jsonb_build_array(
            'system-shutdown',
            'format-drive',
            'delete-database',
            'expose-secrets'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to initialize user settings with defaults
CREATE OR REPLACE FUNCTION initialize_claude_code_settings(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO claude_code_user_settings (user_id, settings)
    VALUES (user_uuid, get_default_claude_code_config())
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to log bypass operations
CREATE OR REPLACE FUNCTION log_claude_code_bypass(
    p_user_id UUID,
    p_operation TEXT,
    p_bypassed BOOLEAN,
    p_reason TEXT DEFAULT NULL,
    p_context JSONB DEFAULT NULL,
    p_result TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO claude_code_audit_log (
        user_id,
        operation,
        bypassed,
        reason,
        context,
        result
    )
    VALUES (
        p_user_id,
        p_operation,
        p_bypassed,
        p_reason,
        p_context,
        p_result
    )
    RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's bypass statistics
CREATE OR REPLACE FUNCTION get_claude_code_bypass_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'totalOperations', COUNT(*),
        'bypassedOperations', COUNT(*) FILTER (WHERE bypassed = true),
        'successfulOperations', COUNT(*) FILTER (WHERE result = 'success'),
        'failedOperations', COUNT(*) FILTER (WHERE result = 'failure'),
        'rollbackOperations', COUNT(*) FILTER (WHERE result = 'rollback'),
        'lastOperation', MAX(created_at)
    )
    INTO stats
    FROM claude_code_audit_log
    WHERE user_id = p_user_id;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON claude_code_user_settings TO authenticated;
GRANT ALL ON claude_code_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_default_claude_code_config() TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_claude_code_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_claude_code_bypass(UUID, TEXT, BOOLEAN, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_claude_code_bypass_stats(UUID) TO authenticated;