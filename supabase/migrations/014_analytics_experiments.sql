-- Analytics and A/B Testing Infrastructure
-- This migration creates tables and functions for event tracking and experiments

-- ================================================
-- ANALYTICS EVENTS SYSTEM
-- ================================================

-- Analytics events table for tracking user interactions
CREATE TABLE analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_properties JSONB DEFAULT '{}'::jsonb,
    user_properties JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT now(),
    
    -- Device and context info
    device_type TEXT, -- mobile, desktop, tablet
    user_agent TEXT,
    ip_address INET,
    country_code TEXT,
    city TEXT,
    
    -- App context
    page_url TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- Performance metrics
    page_load_time INTEGER, -- milliseconds
    connection_type TEXT, -- 4g, wifi, etc.
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_analytics_events_user_event ON analytics_events(user_id, event_name, timestamp DESC);
CREATE INDEX idx_analytics_events_event_time ON analytics_events(event_name, timestamp DESC);

-- User sessions table for tracking user behavior sessions
CREATE TABLE user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL UNIQUE,
    
    -- Session metadata
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    
    -- Device info
    device_type TEXT,
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,
    
    -- Geographic info
    country_code TEXT,
    city TEXT,
    timezone TEXT,
    
    -- Referral info
    landing_page TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- Engagement metrics
    bounce BOOLEAN DEFAULT false,
    converted BOOLEAN DEFAULT false,
    revenue_cents INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at DESC);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);

-- ================================================
-- A/B TESTING FRAMEWORK
-- ================================================

-- Experiments table for A/B testing configuration
CREATE TABLE experiments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Experiment configuration
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
    traffic_allocation DECIMAL(3,2) DEFAULT 1.0 CHECK (traffic_allocation >= 0.0 AND traffic_allocation <= 1.0),
    
    -- Targeting
    target_countries TEXT[], -- ['US', 'IN', 'GB']
    target_devices TEXT[], -- ['mobile', 'desktop', 'tablet']
    target_user_segments TEXT[], -- ['new_users', 'returning_users', 'premium_users']
    
    -- Variants configuration
    variants JSONB NOT NULL DEFAULT '[]'::jsonb,
    control_variant_id TEXT,
    
    -- Metrics to track
    primary_metric TEXT NOT NULL, -- conversion_rate, retention_rate, revenue_per_user
    secondary_metrics TEXT[], -- additional metrics to monitor
    
    -- Statistical configuration
    confidence_level DECIMAL(3,2) DEFAULT 0.95,
    minimum_detectable_effect DECIMAL(5,4) DEFAULT 0.05,
    minimum_sample_size INTEGER DEFAULT 1000,
    
    -- Schedule
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    
    -- Results
    statistical_significance DECIMAL(5,4),
    winning_variant_id TEXT,
    results_summary JSONB DEFAULT '{}'::jsonb,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for experiments
CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_experiments_start_date ON experiments(start_date);

-- User experiment assignments table
CREATE TABLE user_experiment_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    
    -- Assignment metadata
    assigned_at TIMESTAMPTZ DEFAULT now(),
    sticky BOOLEAN DEFAULT true, -- whether user stays in same variant
    
    -- Override capability
    override_reason TEXT, -- manual_assignment, qa_testing, etc.
    override_by UUID REFERENCES auth.users(id),
    
    UNIQUE(user_id, experiment_id)
);

-- Indexes for assignments
CREATE INDEX idx_user_experiment_assignments_user_id ON user_experiment_assignments(user_id);
CREATE INDEX idx_user_experiment_assignments_experiment_id ON user_experiment_assignments(experiment_id);
CREATE INDEX idx_user_experiment_assignments_variant_id ON user_experiment_assignments(variant_id);

-- Experiment events table for tracking experiment-specific metrics
CREATE TABLE experiment_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    
    -- Event details
    event_name TEXT NOT NULL,
    event_properties JSONB DEFAULT '{}'::jsonb,
    value DECIMAL(10,2), -- numerical value for the event (revenue, time, etc.)
    
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for experiment events
CREATE INDEX idx_experiment_events_experiment_id ON experiment_events(experiment_id);
CREATE INDEX idx_experiment_events_variant_id ON experiment_events(variant_id);
CREATE INDEX idx_experiment_events_user_id ON experiment_events(user_id);
CREATE INDEX idx_experiment_events_timestamp ON experiment_events(timestamp DESC);

-- ================================================
-- CONVERSION FUNNELS
-- ================================================

-- Funnel definitions table
CREATE TABLE conversion_funnels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Funnel steps configuration
    steps JSONB NOT NULL, -- [{"name": "land", "event": "page_viewed", "conditions": {...}}, ...]
    time_window_hours INTEGER DEFAULT 24, -- how long users have to complete the funnel
    
    -- Targeting
    user_segments TEXT[],
    countries TEXT[],
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Funnel user progress tracking
CREATE TABLE funnel_user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    funnel_id UUID REFERENCES conversion_funnels(id) ON DELETE CASCADE,
    session_id TEXT,
    
    -- Progress tracking
    current_step INTEGER DEFAULT 0,
    completed_steps INTEGER[] DEFAULT '{}',
    completed BOOLEAN DEFAULT false,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    time_to_complete_seconds INTEGER,
    
    -- Context
    entry_point TEXT, -- where user entered the funnel
    exit_point TEXT, -- where user dropped off
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, funnel_id, session_id)
);

-- Indexes for funnels
CREATE INDEX idx_funnel_user_progress_user_id ON funnel_user_progress(user_id);
CREATE INDEX idx_funnel_user_progress_funnel_id ON funnel_user_progress(funnel_id);
CREATE INDEX idx_funnel_user_progress_completed ON funnel_user_progress(completed, completed_at);

-- ================================================
-- RETENTION COHORTS
-- ================================================

-- User cohorts table for retention analysis
CREATE TABLE user_cohorts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Cohort definition
    cohort_type TEXT NOT NULL, -- registration_date, first_purchase_date, etc.
    cohort_period TEXT NOT NULL, -- 2024-01, 2024-W01, 2024-01-01
    cohort_size INTEGER NOT NULL,
    
    -- User metrics
    registration_date DATE,
    first_purchase_date DATE,
    total_revenue_cents INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    
    -- Retention tracking
    day_1_active BOOLEAN DEFAULT false,
    day_7_active BOOLEAN DEFAULT false,
    day_30_active BOOLEAN DEFAULT false,
    day_90_active BOOLEAN DEFAULT false,
    
    last_active_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for cohorts
CREATE INDEX idx_user_cohorts_user_id ON user_cohorts(user_id);
CREATE INDEX idx_user_cohorts_cohort_period ON user_cohorts(cohort_period);
CREATE INDEX idx_user_cohorts_cohort_type ON user_cohorts(cohort_type);

-- ================================================
-- RLS POLICIES
-- ================================================

-- Enable RLS on all analytics tables
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cohorts ENABLE ROW LEVEL SECURITY;

-- Analytics events policies
CREATE POLICY "Users can insert their own analytics events" ON analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Service role can manage all analytics events" ON analytics_events
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admins can view all analytics events" ON analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR role = 'super_admin')
        )
    );

-- User sessions policies
CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sessions" ON user_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Experiments policies (admin-only management)
CREATE POLICY "Admins can manage experiments" ON experiments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR role = 'super_admin')
        )
    );

CREATE POLICY "Service role can manage experiments" ON experiments
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User experiment assignments policies
CREATE POLICY "Users can view their own experiment assignments" ON user_experiment_assignments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage experiment assignments" ON user_experiment_assignments
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Experiment events policies
CREATE POLICY "Users can insert their own experiment events" ON experiment_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage experiment events" ON experiment_events
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Funnel policies
CREATE POLICY "Admins can manage conversion funnels" ON conversion_funnels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR role = 'super_admin')
        )
    );

CREATE POLICY "Users can view their funnel progress" ON funnel_user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage funnel progress" ON funnel_user_progress
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Cohort policies
CREATE POLICY "Admins can view cohort data" ON user_cohorts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR role = 'super_admin')
        )
    );

CREATE POLICY "Service role can manage cohorts" ON user_cohorts
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to update session duration
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
        NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
    END IF;
    
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for session duration updates
CREATE TRIGGER trigger_update_session_duration
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_session_duration();

-- Function to calculate funnel completion time
CREATE OR REPLACE FUNCTION update_funnel_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = true AND OLD.completed = false THEN
        NEW.completed_at := now();
        NEW.time_to_complete_seconds := EXTRACT(EPOCH FROM (now() - NEW.started_at))::INTEGER;
    END IF;
    
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for funnel completion updates
CREATE TRIGGER trigger_update_funnel_completion
    BEFORE UPDATE ON funnel_user_progress
    FOR EACH ROW EXECUTE FUNCTION update_funnel_completion();

-- Function to get experiment assignment
CREATE OR REPLACE FUNCTION get_experiment_assignment(
    p_user_id UUID,
    p_experiment_name TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_experiment_id UUID;
    v_assignment TEXT;
    v_traffic_allocation DECIMAL;
    v_variants JSONB;
    v_status TEXT;
    v_user_hash INTEGER;
    v_bucket DECIMAL;
    v_selected_variant JSONB;
BEGIN
    -- Get experiment details
    SELECT id, status, traffic_allocation, variants
    INTO v_experiment_id, v_status, v_traffic_allocation, v_variants
    FROM experiments
    WHERE name = p_experiment_name
    AND status = 'running'
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date > now());
    
    -- Return null if experiment not found or not running
    IF v_experiment_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Check for existing assignment
    SELECT variant_id INTO v_assignment
    FROM user_experiment_assignments
    WHERE user_id = p_user_id AND experiment_id = v_experiment_id;
    
    IF v_assignment IS NOT NULL THEN
        RETURN v_assignment;
    END IF;
    
    -- Calculate user hash for consistent assignment
    v_user_hash := hashtext(p_user_id::TEXT || p_experiment_name);
    v_bucket := (v_user_hash % 10000) / 10000.0;
    
    -- Check if user is in traffic allocation
    IF v_bucket > v_traffic_allocation THEN
        RETURN NULL;
    END IF;
    
    -- Assign to variant based on hash
    WITH variant_buckets AS (
        SELECT 
            (variant->>'id')::TEXT as variant_id,
            (variant->>'allocation')::DECIMAL as allocation,
            SUM((variant->>'allocation')::DECIMAL) OVER (ORDER BY ordinality) as cumulative_allocation
        FROM jsonb_array_elements(v_variants) WITH ORDINALITY AS t(variant, ordinality)
    )
    SELECT variant_id INTO v_assignment
    FROM variant_buckets
    WHERE v_bucket * v_traffic_allocation <= cumulative_allocation
    ORDER BY cumulative_allocation
    LIMIT 1;
    
    -- Insert assignment
    IF v_assignment IS NOT NULL THEN
        INSERT INTO user_experiment_assignments (user_id, experiment_id, variant_id)
        VALUES (p_user_id, v_experiment_id, v_assignment)
        ON CONFLICT (user_id, experiment_id) DO NOTHING;
    END IF;
    
    RETURN v_assignment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track experiment event
CREATE OR REPLACE FUNCTION track_experiment_event(
    p_user_id UUID,
    p_experiment_name TEXT,
    p_event_name TEXT,
    p_event_properties JSONB DEFAULT '{}',
    p_value DECIMAL DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_experiment_id UUID;
    v_variant_id TEXT;
BEGIN
    -- Get experiment and variant
    SELECT id INTO v_experiment_id FROM experiments WHERE name = p_experiment_name;
    
    IF v_experiment_id IS NULL THEN
        RETURN;
    END IF;
    
    SELECT variant_id INTO v_variant_id
    FROM user_experiment_assignments
    WHERE user_id = p_user_id AND experiment_id = v_experiment_id;
    
    IF v_variant_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Insert experiment event
    INSERT INTO experiment_events (user_id, experiment_id, variant_id, event_name, event_properties, value)
    VALUES (p_user_id, v_experiment_id, v_variant_id, p_event_name, p_event_properties, p_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_experiment_assignment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION track_experiment_event(UUID, TEXT, TEXT, JSONB, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_experiment_assignment(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION track_experiment_event(UUID, TEXT, TEXT, JSONB, DECIMAL) TO service_role;

-- ================================================
-- DEFAULT EXPERIMENTS AND FUNNELS
-- ================================================

-- Insert default conversion funnel for the main user journey
INSERT INTO conversion_funnels (name, description, steps) VALUES 
(
    'main_user_journey',
    'Complete user journey from landing to share',
    '[
        {"name": "land", "event": "page_viewed", "conditions": {"page_url": "/"}},
        {"name": "start_game", "event": "game_joined", "conditions": {}},
        {"name": "submit_round", "event": "round_submitted", "conditions": {}},
        {"name": "view_reveal", "event": "reveal_viewed", "conditions": {}},
        {"name": "share", "event": "share_clicked", "conditions": {}}
    ]'
);

-- Insert sample A/B test for landing page hero
INSERT INTO experiments (name, description, status, variants, primary_metric, control_variant_id) VALUES
(
    'landing_hero_test',
    'Test different hero sections on landing page',
    'draft',
    '[
        {"id": "control", "name": "Original Hero", "allocation": 0.5, "config": {"hero_type": "original"}},
        {"id": "variant_a", "name": "New Hero with Video", "allocation": 0.5, "config": {"hero_type": "video"}}
    ]',
    'conversion_rate',
    'control'
);

-- Comments for documentation
COMMENT ON TABLE analytics_events IS 'Stores all user interaction events with detailed context and properties';
COMMENT ON TABLE experiments IS 'Configuration for A/B tests and feature flags';
COMMENT ON TABLE user_experiment_assignments IS 'Maps users to specific experiment variants';
COMMENT ON TABLE conversion_funnels IS 'Defines multi-step conversion flows to track';
COMMENT ON TABLE user_cohorts IS 'Groups users for retention and lifecycle analysis';

-- Complete analytics and experiments infrastructure ready