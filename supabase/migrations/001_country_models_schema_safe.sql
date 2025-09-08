-- Safe Country Models System Database Schema
-- Phase 1: Foundation for Gallery System (with existence checks)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums only if they don't exist
DO $$ BEGIN
    CREATE TYPE model_role AS ENUM ('bride', 'groom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE style_type AS ENUM ('attire', 'hairstyle', 'backdrop', 'jewelry', 'composite');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_code TEXT UNIQUE NOT NULL CHECK (char_length(iso_code) = 2),
  name TEXT NOT NULL,
  flag_emoji TEXT NOT NULL,
  cultural_styles JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial countries (only if they don't exist)
INSERT INTO countries (iso_code, name, flag_emoji, cultural_styles) 
SELECT * FROM (VALUES
  ('IN', 'India', '🇮🇳', '["traditional", "bollywood", "royal", "south-indian", "punjabi", "marathi"]'::jsonb),
  ('US', 'United States', '🇺🇸', '["modern", "vintage", "hollywood", "rustic", "beach"]'::jsonb),
  ('JP', 'Japan', '🇯🇵', '["traditional", "kimono", "modern", "sakura", "temple"]'::jsonb),
  ('BR', 'Brazil', '🇧🇷', '["carnival", "beach", "modern", "traditional", "tropical"]'::jsonb),
  ('GB', 'United Kingdom', '🇬🇧', '["royal", "vintage", "modern", "countryside", "castle"]'::jsonb)
) AS t(iso_code, name, flag_emoji, cultural_styles)
WHERE NOT EXISTS (SELECT 1 FROM countries WHERE countries.iso_code = t.iso_code);

-- Country models table
CREATE TABLE IF NOT EXISTS country_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  role model_role NOT NULL,
  name TEXT,
  source_image_url TEXT NOT NULL,
  source_image_path TEXT NOT NULL,
  source_image_sha256 TEXT NOT NULL,
  thumbnail_url TEXT,
  face_encoding JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'country_models_country_role_active_unique'
  ) THEN
    ALTER TABLE country_models 
    ADD CONSTRAINT country_models_country_role_active_unique 
    UNIQUE(country_id, role, is_active) 
    DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- Styles catalog
CREATE TABLE IF NOT EXISTS styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type style_type NOT NULL,
  category TEXT NOT NULL,
  prompt_template JSONB NOT NULL,
  cultural_tags TEXT[] DEFAULT '{}',
  preview_url TEXT,
  thumbnail_url TEXT,
  asset_refs JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated images table (this already exists, so we'll alter it if needed)
DO $$
BEGIN
  -- Check if generated_images table exists and has the columns we need
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'generated_images') THEN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_images' AND column_name = 'country_id') THEN
      ALTER TABLE generated_images ADD COLUMN country_id UUID REFERENCES countries(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_images' AND column_name = 'model_id') THEN
      ALTER TABLE generated_images ADD COLUMN model_id UUID REFERENCES country_models(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_images' AND column_name = 'style_id') THEN
      ALTER TABLE generated_images ADD COLUMN style_id UUID REFERENCES styles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_images' AND column_name = 'role') THEN
      ALTER TABLE generated_images ADD COLUMN role model_role NOT NULL DEFAULT 'bride';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_images' AND column_name = 'image_path') THEN
      ALTER TABLE generated_images ADD COLUMN image_path TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_images' AND column_name = 'thumbnail_url') THEN
      ALTER TABLE generated_images ADD COLUMN thumbnail_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_images' AND column_name = 'generation_params') THEN
      ALTER TABLE generated_images ADD COLUMN generation_params JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_images' AND column_name = 'quality_score') THEN
      ALTER TABLE generated_images ADD COLUMN quality_score FLOAT CHECK (quality_score >= 0 AND quality_score <= 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_images' AND column_name = 'user_ratings') THEN
      ALTER TABLE generated_images ADD COLUMN user_ratings JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_images' AND column_name = 'view_count') THEN
      ALTER TABLE generated_images ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_images' AND column_name = 'is_featured') THEN
      ALTER TABLE generated_images ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_images' AND column_name = 'is_active') THEN
      ALTER TABLE generated_images ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
  ELSE
    -- Create the table if it doesn't exist
    CREATE TABLE generated_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
      model_id UUID NOT NULL REFERENCES country_models(id) ON DELETE CASCADE,
      style_id UUID NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
      role model_role NOT NULL,
      image_url TEXT NOT NULL,
      image_path TEXT NOT NULL,
      thumbnail_url TEXT,
      generation_params JSONB DEFAULT '{}',
      quality_score FLOAT CHECK (quality_score >= 0 AND quality_score <= 1),
      user_ratings JSONB DEFAULT '[]'::jsonb,
      view_count INTEGER DEFAULT 0,
      is_featured BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- Generation queue
CREATE TABLE IF NOT EXISTS generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id),
  model_id UUID NOT NULL REFERENCES country_models(id),
  style_id UUID NOT NULL REFERENCES styles(id),
  role model_role NOT NULL,
  status generation_status NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  variations INTEGER DEFAULT 1 CHECK (variations >= 1 AND variations <= 5),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_country_models_country_role') THEN
    CREATE INDEX idx_country_models_country_role ON country_models(country_id, role) WHERE is_active = true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_generated_images_country_role') THEN
    CREATE INDEX idx_generated_images_country_role ON generated_images(country_id, role);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_generated_images_featured') THEN
    CREATE INDEX idx_generated_images_featured ON generated_images(is_featured) WHERE is_featured = true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_generation_queue_status') THEN
    CREATE INDEX idx_generation_queue_status ON generation_queue(status) WHERE status IN ('pending', 'processing');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_styles_type_category') THEN
    CREATE INDEX idx_styles_type_category ON styles(type, category) WHERE is_active = true;
  END IF;
END $$;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has admin role in user_profiles
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'super_admin')
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Enable RLS on all tables
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Countries policies
  DROP POLICY IF EXISTS "Countries are viewable by everyone" ON countries;
  CREATE POLICY "Countries are viewable by everyone" ON countries FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Only admins can modify countries" ON countries;
  CREATE POLICY "Only admins can modify countries" ON countries FOR ALL USING (is_admin());

  -- Country models policies
  DROP POLICY IF EXISTS "Country models are viewable by everyone" ON country_models;
  CREATE POLICY "Country models are viewable by everyone" ON country_models FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Only admins can manage country models" ON country_models;
  CREATE POLICY "Only admins can manage country models" ON country_models FOR ALL USING (is_admin());

  -- Styles policies
  DROP POLICY IF EXISTS "Styles are viewable by everyone" ON styles;
  CREATE POLICY "Styles are viewable by everyone" ON styles FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Only admins can manage styles" ON styles;
  CREATE POLICY "Only admins can manage styles" ON styles FOR ALL USING (is_admin());

  -- Generated images policies
  DROP POLICY IF EXISTS "Generated images are viewable by everyone" ON generated_images;
  CREATE POLICY "Generated images are viewable by everyone" ON generated_images FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Only admins can manage generated images" ON generated_images;
  CREATE POLICY "Only admins can manage generated images" ON generated_images FOR ALL USING (is_admin());

  -- Generation queue policies
  DROP POLICY IF EXISTS "Admins can view all queue items" ON generation_queue;
  CREATE POLICY "Admins can view all queue items" ON generation_queue FOR SELECT USING (is_admin());
  
  DROP POLICY IF EXISTS "Only admins can manage queue" ON generation_queue;
  CREATE POLICY "Only admins can manage queue" ON generation_queue FOR ALL USING (is_admin());
END $$;

-- Helper functions
CREATE OR REPLACE FUNCTION get_country_model(p_country_iso TEXT, p_role model_role)
RETURNS TABLE (
  id UUID,
  name TEXT,
  source_image_url TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.name,
    cm.source_image_url,
    cm.metadata
  FROM country_models cm
  JOIN countries c ON c.id = cm.country_id
  WHERE c.iso_code = p_country_iso
  AND cm.role = p_role
  AND cm.is_active = true
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION get_featured_gallery(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  image_id UUID,
  image_url TEXT,
  country_name TEXT,
  country_flag TEXT,
  style_name TEXT,
  role model_role
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gi.id,
    gi.image_url,
    c.name,
    c.flag_emoji,
    s.name,
    gi.role
  FROM generated_images gi
  JOIN countries c ON c.id = gi.country_id
  JOIN styles s ON s.id = gi.style_id
  WHERE gi.is_featured = true
  AND gi.is_active = true
  ORDER BY gi.created_at DESC
  LIMIT p_limit;
EXCEPTION
  WHEN OTHERS THEN
    RETURN;
END;
$$;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_countries_updated_at') THEN
    CREATE TRIGGER update_countries_updated_at 
    BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_country_models_updated_at') THEN
    CREATE TRIGGER update_country_models_updated_at 
    BEFORE UPDATE ON country_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_styles_updated_at') THEN
    CREATE TRIGGER update_styles_updated_at 
    BEFORE UPDATE ON styles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_generated_images_updated_at') THEN
    CREATE TRIGGER update_generated_images_updated_at 
    BEFORE UPDATE ON generated_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;