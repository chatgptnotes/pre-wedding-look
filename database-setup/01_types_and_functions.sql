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
