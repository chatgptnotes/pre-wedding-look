-- =====================================================
-- CORE TABLES FOR PRE-WEDDING AI STUDIO
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. COUNTRIES & REGIONS
-- =====================================================

CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    iso_code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10),
    cultural_styles TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default countries
INSERT INTO countries (iso_code, name, flag_emoji, cultural_styles) VALUES
('IN', 'India', '🇮🇳', ARRAY['indian', 'traditional', 'bollywood']),
('US', 'United States', '🇺🇸', ARRAY['american', 'western', 'modern']),
('UK', 'United Kingdom', '🇬🇧', ARRAY['british', 'european', 'classic']),
('FR', 'France', '🇫🇷', ARRAY['french', 'romantic', 'vintage']),
('IT', 'Italy', '🇮🇹', ARRAY['italian', 'mediterranean', 'elegant']),
('JP', 'Japan', '🇯🇵', ARRAY['japanese', 'traditional', 'minimalist']),
('CN', 'China', '🇨🇳', ARRAY['chinese', 'traditional', 'ceremonial']);

-- =====================================================
-- 2. COUNTRY MODELS (Base Images)
-- =====================================================

CREATE TABLE country_models (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(country_id, role, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Index for fast lookups
CREATE INDEX idx_country_models_country_role ON country_models(country_id, role) WHERE is_active = true;

-- =====================================================
-- 3. STYLES & STYLING OPTIONS
-- =====================================================

CREATE TABLE styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('attire', 'hairstyle', 'jewelry', 'backdrop', 'composite', 'makeup')),
    category VARCHAR(20) NOT NULL CHECK (category IN ('bride', 'groom', 'both')),
    description TEXT,
    prompt_template JSONB NOT NULL DEFAULT '{}', -- {positive, negative, params}
    cultural_tags TEXT[] DEFAULT '{}',
    regional_style VARCHAR(50), -- maharashtrian, tamil, punjabi, etc.
    preview_url TEXT,
    thumbnail_url TEXT,
    asset_refs TEXT[] DEFAULT '{}', -- References to style assets
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    popularity_score FLOAT DEFAULT 0.0,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for filtering and sorting
CREATE INDEX idx_styles_type_category ON styles(type, category) WHERE is_active = true;
CREATE INDEX idx_styles_cultural_tags ON styles USING GIN(cultural_tags) WHERE is_active = true;
CREATE INDEX idx_styles_regional ON styles(regional_style) WHERE is_active = true;

-- =====================================================
-- 4. GENERATION QUEUE & PROCESSING
-- =====================================================

CREATE TABLE generation_queue (
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

-- Index for queue processing
CREATE INDEX idx_generation_queue_status_priority ON generation_queue(status, priority DESC, created_at);
CREATE INDEX idx_generation_queue_user ON generation_queue(created_by);

-- =====================================================
-- 5. GENERATED IMAGES & RESULTS
-- =====================================================

CREATE TABLE generated_images (
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
    user_ratings JSONB DEFAULT '[]', -- [{user_id, rating, comment}]
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_saved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_generated_images_country_role ON generated_images(country_id, role) WHERE is_active = true;
CREATE INDEX idx_generated_images_style ON generated_images(style_id) WHERE is_active = true;
CREATE INDEX idx_generated_images_featured ON generated_images(is_featured) WHERE is_featured = true AND is_active = true;
CREATE INDEX idx_generated_images_user ON generated_images(created_by);
CREATE INDEX idx_generated_images_created ON generated_images(created_at DESC);

-- =====================================================
-- 6. USER PROJECTS & SESSIONS
-- =====================================================

CREATE TABLE user_projects (
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

CREATE INDEX idx_user_projects_user ON user_projects(user_id) WHERE is_active = true;

-- Project images relationship
CREATE TABLE project_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
    image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, image_id)
);

-- =====================================================
-- 7. ACTIVITY LOGGING & ANALYTICS
-- =====================================================

CREATE TABLE style_application_logs (
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

-- Index for analytics
CREATE INDEX idx_style_logs_action_date ON style_application_logs(action, created_at);
CREATE INDEX idx_style_logs_user ON style_application_logs(user_id);

-- =====================================================
-- 8. SYSTEM CONFIGURATION
-- =====================================================

CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('max_generations_per_hour', '50', 'Maximum generations per user per hour', false),
('default_style_strength', '0.8', 'Default strength for style application', false),
('image_quality_threshold', '0.7', 'Minimum quality score for auto-approval', false),
('demo_mode_enabled', 'false', 'Enable demo mode for testing', true);