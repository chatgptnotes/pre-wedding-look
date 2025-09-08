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
