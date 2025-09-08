-- =====================================================
-- MINIMAL DEPLOYMENT - WORK WITH EXISTING SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add missing columns to styles table
DO $$ 
BEGIN
    -- Check and add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='styles' AND column_name='description') THEN
        ALTER TABLE styles ADD COLUMN description TEXT;
    END IF;
    
    -- Check and add prompt_template column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='styles' AND column_name='prompt_template') THEN
        ALTER TABLE styles ADD COLUMN prompt_template JSONB DEFAULT '{}';
    END IF;
    
    -- Check and add cultural_tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='styles' AND column_name='cultural_tags') THEN
        ALTER TABLE styles ADD COLUMN cultural_tags TEXT[] DEFAULT '{}';
    END IF;
    
    -- Check and add regional_style column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='styles' AND column_name='regional_style') THEN
        ALTER TABLE styles ADD COLUMN regional_style VARCHAR(50);
    END IF;
    
    -- Check and add preview_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='styles' AND column_name='preview_url') THEN
        ALTER TABLE styles ADD COLUMN preview_url TEXT;
    END IF;
    
    -- Check and add thumbnail_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='styles' AND column_name='thumbnail_url') THEN
        ALTER TABLE styles ADD COLUMN thumbnail_url TEXT;
    END IF;
    
    -- Check and add sort_order column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='styles' AND column_name='sort_order') THEN
        ALTER TABLE styles ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add missing columns to generated_images table
DO $$ 
BEGIN
    -- Check and add style_name column if it doesn't exist (for backward compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_images' AND column_name='style_name') THEN
        ALTER TABLE generated_images ADD COLUMN style_name VARCHAR(100);
    END IF;
    
    -- Check and add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_images' AND column_name='created_by') THEN
        ALTER TABLE generated_images ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Check and add is_featured column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_images' AND column_name='is_featured') THEN
        ALTER TABLE generated_images ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =====================================================
-- 2. CREATE MISSING ESSENTIAL TABLES
-- =====================================================

-- User Projects table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) DEFAULT 'wedding',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Images relationship table
CREATE TABLE IF NOT EXISTS project_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
    image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, image_id)
);

-- System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logging table
CREATE TABLE IF NOT EXISTS style_application_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(50) NOT NULL,
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
-- 3. INSERT BASIC SEED DATA
-- =====================================================

-- Insert system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('demo_mode_enabled', 'false', 'Enable demo mode for testing', true),
('max_generations_per_hour', '50', 'Maximum generations per user per hour', false),
('default_style_strength', '0.8', 'Default strength for style application', false)
ON CONFLICT (key) DO NOTHING;

-- Insert some basic styles if the table is empty
-- First check what type the column is
DO $$
DECLARE
    column_type TEXT;
BEGIN
    -- Get the data type of the 'type' column
    SELECT data_type INTO column_type 
    FROM information_schema.columns 
    WHERE table_name = 'styles' AND column_name = 'type';
    
    -- Only insert if the table is empty
    IF NOT EXISTS (SELECT 1 FROM styles LIMIT 1) THEN
        -- If it's a custom enum type, cast the values
        IF column_type = 'USER-DEFINED' THEN
            INSERT INTO styles (name, type, category, description, prompt_template, cultural_tags, regional_style, sort_order, is_active) VALUES
            ('Red Lehenga', 'attire'::style_type, 'bride', 'Traditional Indian bridal red lehenga with intricate golden embroidery', 
             '{"positive": "beautiful Indian bride in stunning red lehenga, heavy golden zari work", "negative": "western dress"}', 
             ARRAY['indian', 'traditional'], 'indian', 1, true),
            ('Classic Sherwani', 'attire'::style_type, 'groom', 'Traditional cream-colored sherwani with matching turban', 
             '{"positive": "handsome groom in classic cream sherwani, traditional turban", "negative": "western suit"}', 
             ARRAY['traditional', 'indian'], 'indian', 1, true),
            ('Nauvari Saree', 'attire'::style_type, 'bride', 'Traditional 9-yard Maharashtrian saree', 
             '{"positive": "Maharashtrian bride in traditional nauvari saree, bright colors", "negative": "regular saree"}', 
             ARRAY['maharashtrian'], 'maharashtrian', 2, true),
            ('Paithani Saree', 'attire'::style_type, 'bride', 'Elegant Maharashtrian Paithani saree with peacock motifs', 
             '{"positive": "bride in exquisite Paithani saree with peacock motifs", "negative": "plain saree"}', 
             ARRAY['maharashtrian', 'silk'], 'maharashtrian', 3, true);
        ELSE
            -- If it's regular text/varchar, insert without casting
            INSERT INTO styles (name, type, category, description, prompt_template, cultural_tags, regional_style, sort_order, is_active) VALUES
            ('Red Lehenga', 'attire', 'bride', 'Traditional Indian bridal red lehenga with intricate golden embroidery', 
             '{"positive": "beautiful Indian bride in stunning red lehenga, heavy golden zari work", "negative": "western dress"}', 
             ARRAY['indian', 'traditional'], 'indian', 1, true),
            ('Classic Sherwani', 'attire', 'groom', 'Traditional cream-colored sherwani with matching turban', 
             '{"positive": "handsome groom in classic cream sherwani, traditional turban", "negative": "western suit"}', 
             ARRAY['traditional', 'indian'], 'indian', 1, true),
            ('Nauvari Saree', 'attire', 'bride', 'Traditional 9-yard Maharashtrian saree', 
             '{"positive": "Maharashtrian bride in traditional nauvari saree, bright colors", "negative": "regular saree"}', 
             ARRAY['maharashtrian'], 'maharashtrian', 2, true),
            ('Paithani Saree', 'attire', 'bride', 'Elegant Maharashtrian Paithani saree with peacock motifs', 
             '{"positive": "bride in exquisite Paithani saree with peacock motifs", "negative": "plain saree"}', 
             ARRAY['maharashtrian', 'silk'], 'maharashtrian', 3, true);
        END IF;
    END IF;
END $$;

-- =====================================================
-- 4. CREATE ESSENTIAL INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_generated_images_created ON generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_country_role ON generated_images(country_id, role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_styles_type_category ON styles(type, category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id) WHERE is_active = true;

-- =====================================================
-- 5. BASIC RLS POLICIES (Essential ones only)
-- =====================================================

-- Enable RLS on key tables
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_application_logs ENABLE ROW LEVEL SECURITY;

-- Basic policies for user projects
DROP POLICY IF EXISTS "Users can manage their own projects" ON user_projects;
CREATE POLICY "Users can manage their own projects"
    ON user_projects FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Basic policies for project images
DROP POLICY IF EXISTS "Users can manage images in their own projects" ON project_images;
CREATE POLICY "Users can manage images in their own projects"
    ON project_images FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE id = project_id AND user_id = auth.uid()
        )
    );

-- Basic policies for generated images (if not already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'generated_images' 
        AND policyname = 'Users can view their own generated images'
    ) THEN
        ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their own generated images"
            ON generated_images FOR SELECT
            USING (auth.uid() = created_by OR created_by IS NULL OR is_featured = true);
        
        CREATE POLICY "Users can create generated images"
            ON generated_images FOR INSERT
            WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
            
        CREATE POLICY "Users can update their own generated images"
            ON generated_images FOR UPDATE
            USING (auth.uid() = created_by OR created_by IS NULL);
    END IF;
END $$;

-- =====================================================
-- 6. UPDATE TRIGGERS
-- =====================================================

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to tables that have updated_at columns
DO $$
BEGIN
    -- Add trigger to user_projects if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_projects_updated_at') THEN
        CREATE TRIGGER update_user_projects_updated_at 
        BEFORE UPDATE ON user_projects 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- DEPLOYMENT COMPLETE
-- =====================================================

SELECT 
    'Minimal database deployment completed successfully!' as status,
    (SELECT COUNT(*) FROM countries) as countries_count,
    (SELECT COUNT(*) FROM styles) as styles_count,
    (SELECT COUNT(*) FROM generated_images) as generated_images_count;