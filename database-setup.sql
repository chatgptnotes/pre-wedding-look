-- Pre-wedding Look AI Database Setup
-- Run these SQL commands in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
-- This is automatically enabled for new projects

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create pre_wedding_projects table
CREATE TABLE IF NOT EXISTS public.pre_wedding_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_name TEXT NOT NULL DEFAULT 'Untitled Project',
    bride_name TEXT,
    groom_name TEXT,
    bride_image_url TEXT,
    groom_image_url TEXT,
    generated_bride_image_url TEXT,
    generated_groom_image_url TEXT,
    final_image_url TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create generated_images table (for storing all generated variants)
CREATE TABLE IF NOT EXISTS public.generated_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.pre_wedding_projects(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    storage_path TEXT,
    image_type TEXT NOT NULL CHECK (image_type IN ('bride', 'groom', 'couple')),
    config_used JSONB DEFAULT '{}',
    is_downloaded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create optimized indexes for better performance
-- User profiles indexes
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS user_profiles_created_at_idx ON public.user_profiles(created_at DESC);

-- Pre-wedding projects indexes
CREATE INDEX IF NOT EXISTS pre_wedding_projects_user_id_idx ON public.pre_wedding_projects(user_id);
CREATE INDEX IF NOT EXISTS pre_wedding_projects_created_at_idx ON public.pre_wedding_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS pre_wedding_projects_user_created_idx ON public.pre_wedding_projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pre_wedding_projects_project_name_idx ON public.pre_wedding_projects(project_name) WHERE project_name IS NOT NULL;

-- Generated images indexes
CREATE INDEX IF NOT EXISTS generated_images_project_id_idx ON public.generated_images(project_id);
CREATE INDEX IF NOT EXISTS generated_images_type_idx ON public.generated_images(image_type);
CREATE INDEX IF NOT EXISTS generated_images_created_at_idx ON public.generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS generated_images_project_type_idx ON public.generated_images(project_id, image_type);
CREATE INDEX IF NOT EXISTS generated_images_downloaded_idx ON public.generated_images(is_downloaded) WHERE is_downloaded = true;
CREATE INDEX IF NOT EXISTS generated_images_storage_path_idx ON public.generated_images(storage_path) WHERE storage_path IS NOT NULL;

-- Partial indexes for performance optimization
CREATE INDEX IF NOT EXISTS user_profiles_active_idx ON public.user_profiles(id) WHERE full_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS projects_with_images_idx ON public.pre_wedding_projects(id) WHERE bride_image_url IS NOT NULL OR groom_image_url IS NOT NULL;

-- 5. Set up Row Level Security (RLS) Policies

-- User profiles: Users can only see and edit their own profile
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Pre-wedding projects: Users can only see and manage their own projects
ALTER TABLE public.pre_wedding_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.pre_wedding_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.pre_wedding_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.pre_wedding_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.pre_wedding_projects
    FOR DELETE USING (auth.uid() = user_id);

-- Generated images: Users can only see images from their own projects
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generated images" ON public.generated_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pre_wedding_projects 
            WHERE id = project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert generated images for own projects" ON public.generated_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pre_wedding_projects 
            WHERE id = project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own generated images" ON public.generated_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.pre_wedding_projects 
            WHERE id = project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own generated images" ON public.generated_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.pre_wedding_projects 
            WHERE id = project_id AND user_id = auth.uid()
        )
    );

-- Additional security policies for service role access
CREATE POLICY "Service role can manage all data" ON public.user_profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all projects" ON public.pre_wedding_projects
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all images" ON public.generated_images
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at columns
CREATE TRIGGER on_user_profiles_updated
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_pre_wedding_projects_updated
    BEFORE UPDATE ON public.pre_wedding_projects
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 8. Create a function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- 9. Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Create database functions for complex queries

-- Function to get project with image count
CREATE OR REPLACE FUNCTION public.get_project_with_stats(project_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    project_name TEXT,
    bride_name TEXT,
    groom_name TEXT,
    bride_image_url TEXT,
    groom_image_url TEXT,
    generated_bride_image_url TEXT,
    generated_groom_image_url TEXT,
    final_image_url TEXT,
    config JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    image_count BIGINT,
    bride_images_count BIGINT,
    groom_images_count BIGINT,
    couple_images_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.*,
        COALESCE(stats.total_images, 0) as image_count,
        COALESCE(stats.bride_count, 0) as bride_images_count,
        COALESCE(stats.groom_count, 0) as groom_images_count,
        COALESCE(stats.couple_count, 0) as couple_images_count
    FROM public.pre_wedding_projects p
    LEFT JOIN (
        SELECT 
            gi.project_id,
            COUNT(*) as total_images,
            COUNT(*) FILTER (WHERE gi.image_type = 'bride') as bride_count,
            COUNT(*) FILTER (WHERE gi.image_type = 'groom') as groom_count,
            COUNT(*) FILTER (WHERE gi.image_type = 'couple') as couple_count
        FROM public.generated_images gi
        WHERE gi.project_id = get_project_with_stats.project_id
        GROUP BY gi.project_id
    ) stats ON p.id = stats.project_id
    WHERE p.id = get_project_with_stats.project_id
    AND p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's recent projects with stats
CREATE OR REPLACE FUNCTION public.get_user_projects_with_stats(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    project_name TEXT,
    bride_name TEXT,
    groom_name TEXT,
    bride_image_url TEXT,
    groom_image_url TEXT,
    generated_bride_image_url TEXT,
    generated_groom_image_url TEXT,
    final_image_url TEXT,
    config JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    image_count BIGINT,
    last_generated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.*,
        COALESCE(stats.total_images, 0) as image_count,
        stats.last_generated
    FROM public.pre_wedding_projects p
    LEFT JOIN (
        SELECT 
            gi.project_id,
            COUNT(*) as total_images,
            MAX(gi.created_at) as last_generated
        FROM public.generated_images gi
        GROUP BY gi.project_id
    ) stats ON p.id = stats.project_id
    WHERE p.user_id = auth.uid()
    ORDER BY p.updated_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old generated images (for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_images(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Only allow service role to run this function
    IF auth.jwt() ->> 'role' != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: service role required';
    END IF;
    
    DELETE FROM public.generated_images 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old
    AND is_downloaded = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage usage stats
CREATE OR REPLACE FUNCTION public.get_user_storage_stats()
RETURNS TABLE (
    total_images BIGINT,
    downloaded_images BIGINT,
    storage_used_mb NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_images,
        COUNT(*) FILTER (WHERE gi.is_downloaded = true) as downloaded_images,
        -- Estimate storage usage (rough calculation)
        ROUND((COUNT(*) * 0.5)::NUMERIC, 2) as storage_used_mb
    FROM public.generated_images gi
    JOIN public.pre_wedding_projects p ON gi.project_id = p.id
    WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create enhanced storage policies for bucket management

-- Storage policies for the images bucket
DO $$
BEGIN
    -- Create bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'images',
        'images',
        true,
        5242880, -- 5MB
        '{"image/jpeg","image/png","image/webp"}'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Create storage policies
    INSERT INTO storage.policies (bucket_id, name, definition, command, check)
    VALUES 
    (
        'images',
        'Users can view their own images',
        'auth.uid()::text = (storage.foldername(name))[1]',
        'SELECT',
        'auth.uid()::text = (storage.foldername(name))[1]'
    ),
    (
        'images',
        'Users can upload their own images',
        'auth.uid()::text = (storage.foldername(name))[1]',
        'INSERT',
        'auth.uid()::text = (storage.foldername(name))[1]'
    ),
    (
        'images',
        'Users can delete their own images',
        'auth.uid()::text = (storage.foldername(name))[1]',
        'DELETE',
        'auth.uid()::text = (storage.foldername(name))[1]'
    ) ON CONFLICT (bucket_id, name) DO NOTHING;
EXCEPTION
    WHEN others THEN
        -- Ignore errors if storage schema doesn't exist yet
        NULL;
END $$;

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.pre_wedding_projects TO anon, authenticated;
GRANT ALL ON public.generated_images TO anon, authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_project_with_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_projects_with_stats(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_storage_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_images(INTEGER) TO service_role;

-- 13. Create materialized view for analytics (optional)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.project_analytics AS
SELECT 
    DATE_TRUNC('day', p.created_at) as date,
    COUNT(DISTINCT p.id) as projects_created,
    COUNT(DISTINCT p.user_id) as active_users,
    COUNT(gi.id) as images_generated,
    AVG(EXTRACT(EPOCH FROM (gi.created_at - p.created_at))/3600) as avg_hours_to_first_image
FROM public.pre_wedding_projects p
LEFT JOIN public.generated_images gi ON p.id = gi.project_id
GROUP BY DATE_TRUNC('day', p.created_at)
ORDER BY date DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS project_analytics_date_idx ON public.project_analytics(date DESC);

-- Function to refresh analytics
CREATE OR REPLACE FUNCTION public.refresh_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.project_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
