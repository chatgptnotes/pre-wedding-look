-- =====================================================
-- COMPLETE DATABASE DEPLOYMENT SCRIPT
-- Handles existing tables and creates missing ones
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. COUNTRIES TABLE (Already exists, add missing columns if needed)
-- =====================================================

DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='countries' AND column_name='cultural_styles') THEN
        ALTER TABLE countries ADD COLUMN cultural_styles TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='countries' AND column_name='flag_emoji') THEN
        ALTER TABLE countries ADD COLUMN flag_emoji VARCHAR(10);
    END IF;
END $$;

-- =====================================================
-- 2. COUNTRY MODELS TABLE (Check and create if needed)
-- =====================================================

CREATE TABLE IF NOT EXISTS country_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('bride', 'groom')),
    name VARCHAR(100),
    source_image_url TEXT NOT NULL,
    source_image_path TEXT,
    source_image_sha256 VARCHAR(64),
    thumbnail_url TEXT,
    face_encoding JSONB,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'country_models_country_id_role_is_active_key') THEN
        ALTER TABLE country_models ADD CONSTRAINT country_models_country_id_role_is_active_key 
        UNIQUE(country_id, role, is_active) DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;

-- =====================================================
-- 3. STYLES TABLE (Check and create if needed)
-- =====================================================

CREATE TABLE IF NOT EXISTS styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('attire', 'hairstyle', 'jewelry', 'backdrop', 'composite', 'makeup')),
    category VARCHAR(20) NOT NULL CHECK (category IN ('bride', 'groom', 'both')),
    description TEXT,
    prompt_template JSONB NOT NULL DEFAULT '{}',
    cultural_tags TEXT[] DEFAULT '{}',
    regional_style VARCHAR(50),
    preview_url TEXT,
    thumbnail_url TEXT,
    asset_refs TEXT[] DEFAULT '{}',
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    popularity_score FLOAT DEFAULT 0.0,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. GENERATION QUEUE TABLE (Check and create if needed)
-- =====================================================

CREATE TABLE IF NOT EXISTS generation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    model_id UUID REFERENCES country_models(id) ON DELETE CASCADE,
    style_id UUID REFERENCES styles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('bride', 'groom')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    variations INTEGER DEFAULT 1,
    generation_params JSONB DEFAULT '{}',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. GENERATED IMAGES TABLE (Check and create if needed)
-- =====================================================

CREATE TABLE IF NOT EXISTS generated_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    model_id UUID REFERENCES country_models(id) ON DELETE CASCADE,
    style_id UUID REFERENCES styles(id) ON DELETE CASCADE,
    queue_id UUID REFERENCES generation_queue(id) ON DELETE SET NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('bride', 'groom')),
    image_url TEXT NOT NULL,
    image_path TEXT,
    thumbnail_url TEXT,
    generation_params JSONB DEFAULT '{}',
    style_strength FLOAT DEFAULT 0.8,
    seed INTEGER,
    quality_score FLOAT DEFAULT 0.0,
    user_ratings JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_saved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    style_name VARCHAR(100), -- For backward compatibility
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. USER PROJECTS TABLE (Create if missing)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) DEFAULT 'wedding' CHECK (project_type IN ('wedding', 'pre-wedding', 'anniversary', 'engagement')),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. PROJECT IMAGES TABLE (Create if missing)
-- =====================================================

CREATE TABLE IF NOT EXISTS project_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
    image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, image_id)
);

-- =====================================================
-- 8. SYSTEM SETTINGS TABLE (Create if missing)
-- =====================================================

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. USER PROFILES TABLE (Create if missing)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(200),
    avatar_url TEXT,
    country VARCHAR(3) REFERENCES countries(iso_code),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    cultural_background VARCHAR(50),
    preferences JSONB DEFAULT '{}',
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'professional', 'enterprise')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    credits_remaining INTEGER DEFAULT 10,
    total_generations INTEGER DEFAULT 0,
    profile_completion INTEGER DEFAULT 0,
    onboarding_completed BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. ACTIVITY LOGGING TABLE (Create if missing)
-- =====================================================

CREATE TABLE IF NOT EXISTS style_application_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(50) NOT NULL CHECK (action IN ('apply', 'save', 'delete', 'clear', 'download', 'view')),
    country_iso VARCHAR(3),
    role VARCHAR(20),
    style_id UUID REFERENCES styles(id) ON DELETE SET NULL,
    image_id UUID REFERENCES generated_images(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. ADVANCED FEATURE TABLES
-- =====================================================

-- Regional Styles
CREATE TABLE IF NOT EXISTS regional_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    description TEXT,
    cultural_significance TEXT,
    traditional_colors TEXT[] DEFAULT '{}',
    typical_fabrics TEXT[] DEFAULT '{}',
    jewelry_types TEXT[] DEFAULT '{}',
    hairstyle_features TEXT[] DEFAULT '{}',
    ritual_elements TEXT[] DEFAULT '{}',
    seasonal_preferences TEXT[] DEFAULT '{}',
    style_guide JSONB DEFAULT '{}',
    reference_images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Profiles
CREATE TABLE IF NOT EXISTS voice_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    voice_type VARCHAR(50) DEFAULT 'custom' CHECK (voice_type IN ('custom', 'ai_generated', 'celebrity_clone')),
    language VARCHAR(10) DEFAULT 'en',
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'neutral')),
    age_range VARCHAR(20) DEFAULT 'adult',
    voice_file_url TEXT,
    voice_characteristics JSONB DEFAULT '{}',
    sample_audio_url TEXT,
    is_trained BOOLEAN DEFAULT false,
    training_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story Templates
CREATE TABLE IF NOT EXISTS story_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) DEFAULT 'romantic' CHECK (category IN ('romantic', 'humorous', 'traditional', 'modern', 'poetic')),
    language VARCHAR(10) DEFAULT 'en',
    template_text TEXT NOT NULL,
    placeholders JSONB DEFAULT '{}',
    duration_estimate INTEGER,
    voice_instructions JSONB DEFAULT '{}',
    popularity_score INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Magic Presets
CREATE TABLE IF NOT EXISTS magic_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    preset_type VARCHAR(50) DEFAULT 'complete' CHECK (preset_type IN ('complete', 'style_only', 'background_only', 'enhancement')),
    automation_rules JSONB NOT NULL DEFAULT '{}',
    quality_weights JSONB DEFAULT '{}',
    success_rate FLOAT DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brush Tools
CREATE TABLE IF NOT EXISTS brush_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    tool_type VARCHAR(30) CHECK (tool_type IN ('clothing', 'makeup', 'hair', 'background', 'jewelry', 'effects')),
    icon_url TEXT,
    settings JSONB DEFAULT '{}',
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

-- =====================================================
-- 12. CREATE INDEXES (if they don't exist)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_country_models_country_role ON country_models(country_id, role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_styles_type_category ON styles(type, category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_styles_cultural_tags ON styles USING GIN(cultural_tags) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_generation_queue_status_priority ON generation_queue(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_generated_images_country_role ON generated_images(country_id, role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_generated_images_style ON generated_images(style_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_generated_images_featured ON generated_images(is_featured) WHERE is_featured = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_generated_images_created ON generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_style_logs_action_date ON style_application_logs(action, created_at);

-- =====================================================
-- 13. INSERT DEFAULT DATA (only if not exists)
-- =====================================================

-- Update existing countries with cultural styles if missing
UPDATE countries SET cultural_styles = ARRAY['indian', 'traditional', 'bollywood'] WHERE iso_code = 'IN' AND (cultural_styles IS NULL OR array_length(cultural_styles, 1) IS NULL);
UPDATE countries SET cultural_styles = ARRAY['american', 'western', 'modern'] WHERE iso_code = 'US' AND (cultural_styles IS NULL OR array_length(cultural_styles, 1) IS NULL);

-- Insert missing countries
INSERT INTO countries (iso_code, name, flag_emoji, cultural_styles) VALUES
('UK', 'United Kingdom', '🇬🇧', ARRAY['british', 'european', 'classic']),
('FR', 'France', '🇫🇷', ARRAY['french', 'romantic', 'vintage']),
('IT', 'Italy', '🇮🇹', ARRAY['italian', 'mediterranean', 'elegant']),
('JP', 'Japan', '🇯🇵', ARRAY['japanese', 'traditional', 'minimalist']),
('CN', 'China', '🇨🇳', ARRAY['chinese', 'traditional', 'ceremonial'])
ON CONFLICT (iso_code) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('max_generations_per_hour', '50', 'Maximum generations per user per hour', false),
('default_style_strength', '0.8', 'Default strength for style application', false),
('image_quality_threshold', '0.7', 'Minimum quality score for auto-approval', false),
('demo_mode_enabled', 'false', 'Enable demo mode for testing', true)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- COMPLETED SUCCESSFULLY
-- =====================================================

SELECT 'Database schema deployment completed successfully!' as status;