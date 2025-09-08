-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_application_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_slideshows ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboard_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE fusion_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_progression_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PUBLIC READ POLICIES (No authentication required)
-- =====================================================

-- Countries can be read by anyone
CREATE POLICY "Countries are publicly readable"
    ON countries FOR SELECT
    USING (is_active = true);

-- Active styles can be read by anyone
CREATE POLICY "Active styles are publicly readable"
    ON styles FOR SELECT
    USING (is_active = true);

-- Regional styles can be read by anyone
CREATE POLICY "Regional styles are publicly readable"
    ON regional_styles FOR SELECT
    USING (is_active = true);

-- Story templates can be read by anyone
CREATE POLICY "Story templates are publicly readable"
    ON story_templates FOR SELECT
    USING (is_active = true);

-- Magic presets can be read by anyone
CREATE POLICY "Magic presets are publicly readable"
    ON magic_presets FOR SELECT
    USING (is_active = true);

-- Brush tools can be read by anyone
CREATE POLICY "Brush tools are publicly readable"
    ON brush_tools FOR SELECT
    USING (is_active = true);

-- Achievements can be read by anyone
CREATE POLICY "Achievements are publicly readable"
    ON achievements FOR SELECT
    USING (is_active = true);

-- =====================================================
-- AUTHENTICATED USER POLICIES
-- =====================================================

-- User profiles
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- User projects
CREATE POLICY "Users can manage their own projects"
    ON user_projects FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Project images
CREATE POLICY "Users can manage images in their own projects"
    ON project_images FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE id = project_id AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE id = project_id AND user_id = auth.uid()
        )
    );

-- Generation queue
CREATE POLICY "Users can view their own generations"
    ON generation_queue FOR SELECT
    USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can create generations"
    ON generation_queue FOR INSERT
    WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own generations"
    ON generation_queue FOR UPDATE
    USING (auth.uid() = created_by OR created_by IS NULL);

-- Generated images
CREATE POLICY "Users can view their own generated images"
    ON generated_images FOR SELECT
    USING (auth.uid() = created_by OR created_by IS NULL OR is_featured = true);

CREATE POLICY "Users can create generated images"
    ON generated_images FOR INSERT
    WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own generated images"
    ON generated_images FOR UPDATE
    USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can delete their own generated images"
    ON generated_images FOR DELETE
    USING (auth.uid() = created_by);

-- Voice profiles
CREATE POLICY "Users can manage their own voice profiles"
    ON voice_profiles FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Voice slideshows
CREATE POLICY "Users can manage their own voice slideshows"
    ON voice_slideshows FOR ALL
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Storyboard sequences
CREATE POLICY "Users can manage their own storyboard sequences"
    ON storyboard_sequences FOR ALL
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Fusion sessions
CREATE POLICY "Users can manage their own fusion sessions"
    ON fusion_sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Age progression sessions
CREATE POLICY "Users can manage their own age progression sessions"
    ON age_progression_sessions FOR ALL
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Batch operations
CREATE POLICY "Users can manage their own batch operations"
    ON batch_operations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Usage tracking
CREATE POLICY "Users can view their own usage"
    ON usage_tracking FOR SELECT
    USING (auth.uid() = user_id);

-- User feedback
CREATE POLICY "Users can create feedback"
    ON user_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own feedback"
    ON user_feedback FOR SELECT
    USING (auth.uid() = user_id);

-- User achievements
CREATE POLICY "Users can view their own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Referrals
CREATE POLICY "Users can view their own referrals"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- API keys
CREATE POLICY "Users can manage their own API keys"
    ON api_keys FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- ADMIN POLICIES
-- =====================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(required_permissions text[] DEFAULT ARRAY['*'])
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admin_users au
        JOIN admin_roles ar ON au.role_id = ar.id
        WHERE au.user_id = auth.uid() 
        AND au.is_active = true
        AND ar.is_active = true
        AND (ar.permissions && required_permissions OR '*' = ANY(ar.permissions))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for country models
CREATE POLICY "Admins can manage country models"
    ON country_models FOR ALL
    USING (is_admin(ARRAY['models:*', '*']))
    WITH CHECK (is_admin(ARRAY['models:*', '*']));

-- Regular users can view active models
CREATE POLICY "Users can view active country models"
    ON country_models FOR SELECT
    USING (is_active = true);

-- Admin policies for styles
CREATE POLICY "Admins can manage styles"
    ON styles FOR INSERT
    WITH CHECK (is_admin(ARRAY['styles:*', '*']));

CREATE POLICY "Admins can update styles"
    ON styles FOR UPDATE
    USING (is_admin(ARRAY['styles:*', '*']));

CREATE POLICY "Admins can delete styles"
    ON styles FOR DELETE
    USING (is_admin(ARRAY['styles:*', '*']));

-- Admin policies for system settings
CREATE POLICY "Admins can manage system settings"
    ON system_settings FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Users can read public settings
CREATE POLICY "Users can read public system settings"
    ON system_settings FOR SELECT
    USING (is_public = true);

-- =====================================================
-- LOGGING & AUDIT POLICIES
-- =====================================================

-- Style application logs (write-only for users, read for admins)
CREATE POLICY "Users can create activity logs"
    ON style_application_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all activity logs"
    ON style_application_logs FOR SELECT
    USING (is_admin(ARRAY['analytics:read', '*']));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_country_models_updated_at BEFORE UPDATE ON country_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_styles_updated_at BEFORE UPDATE ON styles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_images_updated_at BEFORE UPDATE ON generated_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON user_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- USAGE TRACKING FUNCTIONS
-- =====================================================

-- Function to track user usage
CREATE OR REPLACE FUNCTION track_usage(
    user_uuid UUID,
    resource_type_param TEXT,
    count_param INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
    INSERT INTO usage_tracking (user_id, resource_type, count, period_start)
    VALUES (user_uuid, resource_type_param, count_param, CURRENT_DATE)
    ON CONFLICT (user_id, resource_type, period_start)
    DO UPDATE SET count = usage_tracking.count + count_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
    user_uuid UUID,
    resource_type_param TEXT,
    limit_param INTEGER
)
RETURNS boolean AS $$
DECLARE
    current_usage INTEGER;
BEGIN
    SELECT COALESCE(count, 0) INTO current_usage
    FROM usage_tracking
    WHERE user_id = user_uuid 
    AND resource_type = resource_type_param 
    AND period_start = CURRENT_DATE;
    
    RETURN current_usage < limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Function to cleanup old logs and expired data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete old style application logs (older than 6 months)
    DELETE FROM style_application_logs 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    -- Delete expired user sessions
    DELETE FROM user_sessions 
    WHERE expires_at < NOW();
    
    -- Delete old API usage logs (older than 3 months)
    DELETE FROM api_usage_logs 
    WHERE created_at < NOW() - INTERVAL '3 months';
    
    -- Delete read notifications older than 30 days
    DELETE FROM notifications 
    WHERE is_read = true AND created_at < NOW() - INTERVAL '30 days';
    
    -- Delete expired notifications
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;