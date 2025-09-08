-- ===================================
-- COMPLETE DATABASE SETUP FOR PRE-WEDDING AI
-- This script sets up all necessary database objects, types, and functions
-- ===================================

-- Drop existing objects if they exist to prevent conflicts
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP TYPE IF EXISTS public.model_role CASCADE;
DROP TYPE IF EXISTS public.style_type CASCADE;

-- Create required ENUM types
CREATE TYPE public.model_role AS ENUM ('bride', 'groom');
CREATE TYPE public.style_type AS ENUM ('attire', 'hair', 'jewelry', 'location', 'pose', 'art_style');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create alias function for compatibility
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  RETURN public.handle_updated_at();
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- PROFILES TABLE (Auth Integration)
-- ===================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT profiles_email_key UNIQUE (email)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Add RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ===================================
-- COUNTRIES TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_code TEXT NOT NULL UNIQUE CHECK (char_length(iso_code) = 2),
  name TEXT NOT NULL,
  flag_emoji TEXT NOT NULL,
  cultural_styles JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON public.countries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================================
-- STYLES TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS public.styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.style_type NOT NULL,
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  regional_style VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_styles_type_category ON public.styles(type, category) WHERE is_active = true;

CREATE TRIGGER update_styles_updated_at BEFORE UPDATE ON public.styles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================================
-- COUNTRY MODELS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS public.country_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  role public.model_role NOT NULL,
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT country_models_country_role_active_unique 
    UNIQUE (country_id, role, is_active) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_country_models_country_role ON public.country_models(country_id, role) WHERE is_active = true;

CREATE TRIGGER update_country_models_updated_at BEFORE UPDATE ON public.country_models
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================================
-- USER PROJECTS TABLE (alias for pre_wedding_projects)
-- ===================================
CREATE TABLE IF NOT EXISTS public.user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL DEFAULT 'Untitled Project',
  bride_name TEXT,
  groom_name TEXT,
  bride_image_url TEXT,
  groom_image_url TEXT,
  generated_bride_image_url TEXT,
  generated_groom_image_url TEXT,
  final_image_url TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Create alias view for compatibility
CREATE OR REPLACE VIEW public.pre_wedding_projects AS
SELECT * FROM public.user_projects;

CREATE INDEX IF NOT EXISTS user_projects_user_id_idx ON public.user_projects(user_id);
CREATE INDEX IF NOT EXISTS user_projects_created_at_idx ON public.user_projects(created_at DESC);

CREATE TRIGGER on_user_projects_updated BEFORE UPDATE ON public.user_projects
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===================================
-- GENERATED IMAGES TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS public.generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.user_projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type = ANY (ARRAY['bride', 'groom', 'couple'])),
  config_used JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  storage_path TEXT,
  is_downloaded BOOLEAN DEFAULT false,
  country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
  model_id UUID REFERENCES public.country_models(id) ON DELETE CASCADE,
  style_id UUID REFERENCES public.styles(id) ON DELETE CASCADE,
  role public.model_role NOT NULL DEFAULT 'bride'::model_role,
  image_path TEXT,
  thumbnail_url TEXT,
  generation_params JSONB DEFAULT '{}'::jsonb,
  quality_score DOUBLE PRECISION CHECK (quality_score >= 0 AND quality_score <= 1),
  user_ratings JSONB DEFAULT '[]'::jsonb,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  style_name VARCHAR(100),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS generated_images_project_id_idx ON public.generated_images(project_id);
CREATE INDEX IF NOT EXISTS generated_images_type_idx ON public.generated_images(image_type);
CREATE INDEX IF NOT EXISTS idx_generated_images_country_role ON public.generated_images(country_id, role);
CREATE INDEX IF NOT EXISTS idx_generated_images_featured ON public.generated_images(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_generated_images_created ON public.generated_images(created_at DESC);

CREATE TRIGGER update_generated_images_updated_at BEFORE UPDATE ON public.generated_images
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================================
-- PROJECT IMAGES JUNCTION TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS public.project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.user_projects(id) ON DELETE CASCADE,
  image_id UUID REFERENCES public.generated_images(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT project_images_project_id_image_id_key UNIQUE (project_id, image_id)
);

-- ===================================
-- STYLE APPLICATION LOGS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS public.style_application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL,
  country_iso VARCHAR(3),
  role VARCHAR(20),
  style_id UUID REFERENCES public.styles(id) ON DELETE SET NULL,
  image_id UUID REFERENCES public.generated_images(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- USER PROFILES TABLE (Alias for compatibility)
-- ===================================
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT * FROM public.profiles;

-- ===================================
-- ENABLE RLS ON ALL TABLES
-- ===================================
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_application_logs ENABLE ROW LEVEL SECURITY;

-- ===================================
-- BASIC RLS POLICIES
-- ===================================

-- Countries: Public read access
CREATE POLICY "Countries are publicly readable" ON public.countries
  FOR SELECT USING (true);

-- Styles: Public read access
CREATE POLICY "Styles are publicly readable" ON public.styles
  FOR SELECT USING (true);

-- Country Models: Public read access
CREATE POLICY "Country models are publicly readable" ON public.country_models
  FOR SELECT USING (true);

-- User Projects: Users can manage their own projects
CREATE POLICY "Users can view own projects" ON public.user_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.user_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.user_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.user_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Generated Images: Users can manage their own images
CREATE POLICY "Users can view own images" ON public.generated_images
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own images" ON public.generated_images
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own images" ON public.generated_images
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

-- Project Images: Users can manage their own project images
CREATE POLICY "Users can view own project images" ON public.project_images
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project images" ON public.project_images
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

-- Style Application Logs: Users can view their own logs
CREATE POLICY "Users can view own logs" ON public.style_application_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert logs" ON public.style_application_logs
  FOR INSERT WITH CHECK (true);

-- ===================================
-- BLIND DATE MINI GAME TABLES
-- ===================================

-- Main game sessions table
CREATE TABLE IF NOT EXISTS public.blinddate_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT CHECK (status IN ('waiting','active','reveal','finished')) DEFAULT 'waiting',
  is_private BOOLEAN DEFAULT false,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Players in each game session
CREATE TABLE IF NOT EXISTS public.blinddate_participants (
  session_id UUID REFERENCES public.blinddate_sessions ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('A','B')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_revealed BOOLEAN DEFAULT false,
  avatar_name TEXT DEFAULT 'Mystery Person',
  PRIMARY KEY (session_id, user_id)
);

-- Game rounds (Attire, Hair & Accessories, Location & Vibe)
CREATE TABLE IF NOT EXISTS public.blinddate_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.blinddate_sessions ON DELETE CASCADE,
  round_no INTEGER CHECK (round_no BETWEEN 1 AND 3),
  topic TEXT CHECK (topic IN ('attire', 'hair', 'location')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  time_limit_seconds INTEGER DEFAULT 180
);

-- The styling designs created by each player
CREATE TABLE IF NOT EXISTS public.blinddate_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.blinddate_sessions ON DELETE CASCADE,
  round_id UUID REFERENCES public.blinddate_rounds ON DELETE CASCADE,
  designer_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT CHECK (target_role IN ('A','B')),
  prompt JSONB,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions and votes after the big reveal
CREATE TABLE IF NOT EXISTS public.blinddate_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.blinddate_sessions ON DELETE CASCADE,
  voter_user_id UUID REFERENCES public.profiles(id),
  vote TEXT CHECK (vote IN ('A', 'B', 'tie')),
  reaction TEXT CHECK (reaction IN ('heart','fire','laugh','surprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generated share content (for social media)
CREATE TABLE IF NOT EXISTS public.blinddate_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.blinddate_sessions ON DELETE CASCADE,
  video_url TEXT,
  caption TEXT,
  watermark_position JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blinddate_sessions_status ON public.blinddate_sessions(status);
CREATE INDEX IF NOT EXISTS idx_blinddate_sessions_invite_code ON public.blinddate_sessions(invite_code);
CREATE INDEX IF NOT EXISTS idx_blinddate_participants_session ON public.blinddate_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_blinddate_rounds_session ON public.blinddate_rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_blinddate_designs_session ON public.blinddate_designs(session_id);
CREATE INDEX IF NOT EXISTS idx_blinddate_designs_round ON public.blinddate_designs(round_id);
CREATE INDEX IF NOT EXISTS idx_blinddate_shares_expires ON public.blinddate_shares(expires_at);

-- Security policies (RLS)
ALTER TABLE public.blinddate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blinddate_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blinddate_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blinddate_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blinddate_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blinddate_shares ENABLE ROW LEVEL SECURITY;

-- Players can see sessions they're part of
CREATE POLICY "Players can view their sessions" ON public.blinddate_sessions
  FOR SELECT USING (
    id IN (
      SELECT session_id FROM public.blinddate_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Players can join sessions
CREATE POLICY "Players can join sessions" ON public.blinddate_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Players can view other participants in their sessions
CREATE POLICY "Players can view session participants" ON public.blinddate_participants
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM public.blinddate_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Players can view rounds in their sessions
CREATE POLICY "Players can view session rounds" ON public.blinddate_rounds
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM public.blinddate_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Players can create designs in their sessions
CREATE POLICY "Players can create designs" ON public.blinddate_designs
  FOR INSERT WITH CHECK (
    designer_user_id = auth.uid() AND
    session_id IN (
      SELECT session_id FROM public.blinddate_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Players can view designs in their sessions (after reveal)
CREATE POLICY "Players can view revealed designs" ON public.blinddate_designs
  FOR SELECT USING (
    session_id IN (
      SELECT bp.session_id FROM public.blinddate_participants bp
      JOIN public.blinddate_sessions bs ON bp.session_id = bs.id
      WHERE bp.user_id = auth.uid() AND bs.status IN ('reveal', 'finished')
    )
  );

-- Players can give feedback
CREATE POLICY "Players can give feedback" ON public.blinddate_feedback
  FOR INSERT WITH CHECK (
    voter_user_id = auth.uid() AND
    session_id IN (
      SELECT session_id FROM public.blinddate_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Players can view share content for their sessions
CREATE POLICY "Players can view share content" ON public.blinddate_shares
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM public.blinddate_participants 
      WHERE user_id = auth.uid()
    )
  );

-- ===================================
-- BLIND DATE HELPER FUNCTIONS
-- ===================================

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code() RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create rounds when session starts
CREATE OR REPLACE FUNCTION public.create_session_rounds(session_id UUID) RETURNS VOID AS $$
BEGIN
  -- Round 1: Attire (3 minutes)
  INSERT INTO public.blinddate_rounds (session_id, round_no, topic, time_limit_seconds)
  VALUES (session_id, 1, 'attire', 180);
  
  -- Round 2: Hair & Accessories (3 minutes)
  INSERT INTO public.blinddate_rounds (session_id, round_no, topic, time_limit_seconds)
  VALUES (session_id, 2, 'hair', 180);
  
  -- Round 3: Location & Vibe (2 minutes)
  INSERT INTO public.blinddate_rounds (session_id, round_no, topic, time_limit_seconds)
  VALUES (session_id, 3, 'location', 120);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired shares (run this with a cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares() RETURNS VOID AS $$
BEGIN
  DELETE FROM public.blinddate_shares WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- INSERT INITIAL DATA
-- ===================================

-- Insert sample countries
INSERT INTO public.countries (iso_code, name, flag_emoji, cultural_styles) VALUES
('IN', 'India', '🇮🇳', '[
  {"name": "Marathi", "region": "Maharashtra", "styles": ["nauvari_saree", "dhoti_pheta"]},
  {"name": "Tamil", "region": "Tamil Nadu", "styles": ["kanjivaram_saree", "veshti_kurta"]},
  {"name": "Punjabi", "region": "Punjab", "styles": ["lehenga_choli", "sherwani"]},
  {"name": "Bengali", "region": "West Bengal", "styles": ["tant_saree", "kurta_dhoti"]}
]'::jsonb),
('US', 'United States', '🇺🇸', '[{"name": "Western", "styles": ["wedding_dress", "tuxedo"]}]'::jsonb),
('FR', 'France', '🇫🇷', '[{"name": "French", "styles": ["haute_couture", "classic_suit"]}]'::jsonb),
('JP', 'Japan', '🇯🇵', '[{"name": "Japanese", "styles": ["kimono", "hakama"]}]'::jsonb),
('GB', 'United Kingdom', '🇬🇧', '[{"name": "British", "styles": ["morning_coat", "wedding_gown"]}]'::jsonb)
ON CONFLICT (iso_code) DO NOTHING;

-- Insert basic styles
INSERT INTO public.styles (name, type, category, prompt_template, description) VALUES
('Classic Red Lehenga', 'attire', 'bride', '{"color": "red", "style": "lehenga", "embroidery": "golden"}', 'Traditional Indian bridal lehenga in red with golden embroidery'),
('Elegant Sherwani', 'attire', 'groom', '{"color": "cream", "style": "sherwani", "accessories": "turban"}', 'Classic cream-colored sherwani with matching turban'),
('Romantic Beach', 'location', 'background', '{"setting": "beach", "time": "sunset", "mood": "romantic"}', 'Beautiful beach setting during golden hour'),
('Palace Courtyard', 'location', 'background', '{"setting": "palace", "architecture": "indian", "mood": "royal"}', 'Majestic Indian palace courtyard with traditional architecture')
ON CONFLICT DO NOTHING;

-- ===================================
-- COMPLETION MESSAGE
-- ===================================
DO $$
BEGIN
  RAISE NOTICE 'Database setup complete! All tables, functions, and policies have been created successfully.';
END $$;