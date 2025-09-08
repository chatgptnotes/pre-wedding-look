-- =====================================================
-- ADVANCED FEATURES TABLES
-- =====================================================

-- =====================================================
-- 1. REGIONAL & CULTURAL STYLES
-- =====================================================

CREATE TABLE regional_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL, -- maharashtrian, tamil, punjabi, bengali, etc.
    description TEXT,
    cultural_significance TEXT,
    traditional_colors TEXT[] DEFAULT '{}',
    typical_fabrics TEXT[] DEFAULT '{}',
    jewelry_types TEXT[] DEFAULT '{}',
    hairstyle_features TEXT[] DEFAULT '{}',
    ritual_elements TEXT[] DEFAULT '{}',
    seasonal_preferences TEXT[] DEFAULT '{}',
    style_guide JSONB DEFAULT '{}', -- Detailed styling instructions
    reference_images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for regional filtering
CREATE INDEX idx_regional_styles_region ON regional_styles(region) WHERE is_active = true;

-- =====================================================
-- 2. VOICE STORYTELLING FEATURES
-- =====================================================

CREATE TABLE voice_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    voice_type VARCHAR(50) DEFAULT 'custom' CHECK (voice_type IN ('custom', 'ai_generated', 'celebrity_clone')),
    language VARCHAR(10) DEFAULT 'en',
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'neutral')),
    age_range VARCHAR(20) DEFAULT 'adult',
    voice_file_url TEXT,
    voice_characteristics JSONB DEFAULT '{}', -- pitch, tone, accent, etc.
    sample_audio_url TEXT,
    is_trained BOOLEAN DEFAULT false,
    training_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE story_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) DEFAULT 'romantic' CHECK (category IN ('romantic', 'humorous', 'traditional', 'modern', 'poetic')),
    language VARCHAR(10) DEFAULT 'en',
    template_text TEXT NOT NULL,
    placeholders JSONB DEFAULT '{}', -- {bride_name, groom_name, location, etc.}
    duration_estimate INTEGER, -- in seconds
    voice_instructions JSONB DEFAULT '{}',
    popularity_score INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE voice_slideshows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
    voice_profile_id UUID REFERENCES voice_profiles(id) ON DELETE SET NULL,
    story_template_id UUID REFERENCES story_templates(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    script_text TEXT NOT NULL,
    audio_url TEXT,
    video_url TEXT,
    duration INTEGER, -- in seconds
    image_sequence JSONB DEFAULT '[]', -- [{image_id, duration, transition}]
    background_music_url TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CINEMATIC STORYBOARD FEATURES
-- =====================================================

CREATE TABLE storyboard_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    sequence_type VARCHAR(50) DEFAULT 'journey' CHECK (sequence_type IN ('journey', 'transformation', 'celebration', 'romance')),
    total_scenes INTEGER DEFAULT 3,
    transition_style VARCHAR(50) DEFAULT 'fade',
    music_theme VARCHAR(50),
    narrative_arc TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE storyboard_scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_id UUID REFERENCES storyboard_sequences(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    location VARCHAR(100) NOT NULL,
    description TEXT,
    mood VARCHAR(50),
    lighting VARCHAR(50),
    camera_angle VARCHAR(50),
    duration INTEGER DEFAULT 3, -- seconds
    style_instructions JSONB DEFAULT '{}',
    generated_image_id UUID REFERENCES generated_images(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sequence_id, scene_number)
);

-- =====================================================
-- 4. FUSION REALITY & LIVE EDITING
-- =====================================================

CREATE TABLE fusion_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_image_url TEXT NOT NULL,
    session_data JSONB DEFAULT '{}', -- Brush strokes, mask data, etc.
    transformations JSONB DEFAULT '[]', -- [{type, params, timestamp}]
    current_result_url TEXT,
    history JSONB DEFAULT '[]', -- Undo/redo stack
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE brush_tools (
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
-- 5. FUTURE VISION & AGE PROGRESSION
-- =====================================================

CREATE TABLE age_progression_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
    base_image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
    target_age INTEGER NOT NULL CHECK (target_age BETWEEN 25 AND 80),
    progression_type VARCHAR(50) DEFAULT 'natural' CHECK (progression_type IN ('natural', 'graceful', 'distinguished')),
    life_events JSONB DEFAULT '[]', -- [{event, age, description}]
    generated_images JSONB DEFAULT '[]', -- [{age, image_id, description}]
    family_context JSONB DEFAULT '{}', -- Future children, grandchildren
    status VARCHAR(20) DEFAULT 'pending',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ONE-CLICK MAGIC & AUTOMATION
-- =====================================================

CREATE TABLE magic_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    preset_type VARCHAR(50) DEFAULT 'complete' CHECK (preset_type IN ('complete', 'style_only', 'background_only', 'enhancement')),
    automation_rules JSONB NOT NULL DEFAULT '{}', -- {style_selection, background_logic, voice_settings}
    quality_weights JSONB DEFAULT '{}', -- {face_preservation, style_accuracy, background_harmony}
    success_rate FLOAT DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. CULTURAL AUTHENTICITY & ACCURACY
-- =====================================================

CREATE TABLE cultural_validators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region VARCHAR(50) NOT NULL,
    validator_name VARCHAR(100) NOT NULL,
    credentials TEXT,
    specialization TEXT[] DEFAULT '{}',
    validation_rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE style_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    style_id UUID REFERENCES styles(id) ON DELETE CASCADE,
    validator_id UUID REFERENCES cultural_validators(id) ON DELETE CASCADE,
    accuracy_score INTEGER CHECK (accuracy_score BETWEEN 1 AND 10),
    feedback TEXT,
    recommendations JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(style_id, validator_id)
);

-- =====================================================
-- 8. BATCH OPERATIONS & WORKFLOWS
-- =====================================================

CREATE TABLE batch_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('bulk_generate', 'style_comparison', 'batch_export')),
    parameters JSONB NOT NULL DEFAULT '{}',
    total_items INTEGER NOT NULL DEFAULT 0,
    completed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    results JSONB DEFAULT '{}',
    error_log TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. AI MODEL MANAGEMENT
-- =====================================================

CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('style_transfer', 'face_swap', 'background_gen', 'voice_clone', 'age_progression')),
    version VARCHAR(20) NOT NULL,
    provider VARCHAR(50), -- openai, stability, runway, etc.
    model_endpoint TEXT,
    capabilities TEXT[] DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    cost_per_operation DECIMAL(10,4) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. QUALITY CONTROL & MONITORING
-- =====================================================

CREATE TABLE quality_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
    score_type VARCHAR(30) CHECK (score_type IN ('technical', 'aesthetic', 'cultural', 'user_satisfaction')),
    score FLOAT NOT NULL CHECK (score BETWEEN 0.0 AND 1.0),
    confidence FLOAT DEFAULT 0.0,
    details JSONB DEFAULT '{}',
    evaluated_by VARCHAR(20) DEFAULT 'ai' CHECK (evaluated_by IN ('ai', 'human', 'crowd')),
    evaluator_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quality analytics
CREATE INDEX idx_quality_scores_image_type ON quality_scores(image_id, score_type);
CREATE INDEX idx_quality_scores_score ON quality_scores(score DESC);