-- Country Models System Database Schema
-- Phase 1: Foundation for Gallery System

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Model roles enum
CREATE TYPE model_role AS ENUM ('bride', 'groom');

-- Style types enum  
CREATE TYPE style_type AS ENUM ('attire', 'hairstyle', 'backdrop', 'jewelry', 'composite');

-- Generation status enum
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Countries table
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_code TEXT UNIQUE NOT NULL CHECK (char_length(iso_code) = 2),
  name TEXT NOT NULL,
  flag_emoji TEXT NOT NULL,
  cultural_styles JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial countries (Phase 1: 5 countries)
INSERT INTO countries (iso_code, name, flag_emoji, cultural_styles) VALUES
  ('IN', 'India', '🇮🇳', '["traditional", "bollywood", "royal", "south-indian", "punjabi", "marathi"]'),
  ('US', 'United States', '🇺🇸', '["modern", "vintage", "hollywood", "rustic", "beach"]'),
  ('JP', 'Japan', '🇯🇵', '["traditional", "kimono", "modern", "sakura", "temple"]'),
  ('BR', 'Brazil', '🇧🇷', '["carnival", "beach", "modern", "traditional", "tropical"]'),
  ('GB', 'United Kingdom', '🇬🇧', '["royal", "vintage", "modern", "countryside", "castle"]');

-- Country models table (one active model per country per role)
CREATE TABLE country_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  role model_role NOT NULL,
  name TEXT,
  source_image_url TEXT NOT NULL,
  source_image_path TEXT NOT NULL, -- storage path
  source_image_sha256 TEXT NOT NULL,
  thumbnail_url TEXT,
  face_encoding JSONB, -- for consistency checking
  metadata JSONB DEFAULT '{}'::jsonb, -- age_range, ethnicity, description
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_id, role, is_active) -- ensures only one active model per country/role
);

-- Styles catalog (reusable across countries)
CREATE TABLE styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type style_type NOT NULL,
  category TEXT NOT NULL, -- 'bride', 'groom', 'couple', 'universal'
  prompt_template JSONB NOT NULL,
  -- Example: {"positive": "wearing red lehenga", "negative": "low quality", "params": {"strength": 0.8}}
  cultural_tags TEXT[] DEFAULT '{}',
  preview_url TEXT,
  thumbnail_url TEXT,
  asset_refs JSONB DEFAULT '[]'::jsonb, -- LoRAs, IP-Adapters, ControlNets
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated images for model galleries
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES country_models(id) ON DELETE CASCADE,
  style_id UUID NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
  role model_role NOT NULL,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL, -- storage path
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

-- Generation queue for batch processing
CREATE TABLE generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id),
  model_id UUID NOT NULL REFERENCES country_models(id),
  style_id UUID NOT NULL REFERENCES styles(id),
  role model_role NOT NULL,
  status generation_status NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0, -- higher = more priority
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  variations INTEGER DEFAULT 1 CHECK (variations >= 1 AND variations <= 5),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_country_models_country_role ON country_models(country_id, role) WHERE is_active = true;
CREATE INDEX idx_generated_images_country_role ON generated_images(country_id, role);
CREATE INDEX idx_generated_images_featured ON generated_images(is_featured) WHERE is_featured = true;
CREATE INDEX idx_generation_queue_status ON generation_queue(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_styles_type_category ON styles(type, category) WHERE is_active = true;

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
END;
$$;

-- Row Level Security (RLS)
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;

-- Countries policies
CREATE POLICY "Countries are viewable by everyone" 
  ON countries FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can modify countries" 
  ON countries FOR ALL 
  USING (is_admin());

-- Country models policies
CREATE POLICY "Country models are viewable by everyone" 
  ON country_models FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage country models" 
  ON country_models FOR ALL 
  USING (is_admin());

-- Styles policies
CREATE POLICY "Styles are viewable by everyone" 
  ON styles FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage styles" 
  ON styles FOR ALL 
  USING (is_admin());

-- Generated images policies
CREATE POLICY "Generated images are viewable by everyone" 
  ON generated_images FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage generated images" 
  ON generated_images FOR ALL 
  USING (is_admin());

-- Generation queue policies
CREATE POLICY "Admins can view all queue items" 
  ON generation_queue FOR SELECT 
  USING (is_admin());

CREATE POLICY "Only admins can manage queue" 
  ON generation_queue FOR ALL 
  USING (is_admin());

-- Functions for common operations

-- Get active model for country and role
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

-- Get featured images across all countries
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
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_country_models_updated_at BEFORE UPDATE ON country_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_styles_updated_at BEFORE UPDATE ON styles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_images_updated_at BEFORE UPDATE ON generated_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();