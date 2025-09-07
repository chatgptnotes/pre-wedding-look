-- ===================================
-- PRE-WEDDING LOOK AI - DATABASE MIGRATIONS
-- ===================================
-- This file contains incremental database migrations
-- Run these in order if you have an existing database

-- Migration 1: Add missing columns to generated_images table
-- Run this if your generated_images table is missing these columns
DO $$
BEGIN
    -- Add storage_path column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generated_images' 
        AND column_name = 'storage_path'
    ) THEN
        ALTER TABLE public.generated_images ADD COLUMN storage_path TEXT;
    END IF;
    
    -- Add is_downloaded column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generated_images' 
        AND column_name = 'is_downloaded'
    ) THEN
        ALTER TABLE public.generated_images ADD COLUMN is_downloaded BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Migration 2: Add new indexes for better performance
-- These will only be created if they don't already exist
CREATE INDEX IF NOT EXISTS user_profiles_created_at_idx ON public.user_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS pre_wedding_projects_user_created_idx ON public.pre_wedding_projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pre_wedding_projects_project_name_idx ON public.pre_wedding_projects(project_name) WHERE project_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS generated_images_created_at_idx ON public.generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS generated_images_project_type_idx ON public.generated_images(project_id, image_type);
CREATE INDEX IF NOT EXISTS generated_images_downloaded_idx ON public.generated_images(is_downloaded) WHERE is_downloaded = true;
CREATE INDEX IF NOT EXISTS generated_images_storage_path_idx ON public.generated_images(storage_path) WHERE storage_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_profiles_active_idx ON public.user_profiles(id) WHERE full_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS projects_with_images_idx ON public.pre_wedding_projects(id) WHERE bride_image_url IS NOT NULL OR groom_image_url IS NOT NULL;

-- Migration 3: Add new RLS policies
-- Update policy for generated_images to include UPDATE
DO $$
BEGIN
    -- Check if the UPDATE policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'generated_images' 
        AND policyname = 'Users can update own generated images'
    ) THEN
        CREATE POLICY "Users can update own generated images" ON public.generated_images
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.pre_wedding_projects 
                    WHERE id = project_id AND user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Migration 4: Add service role policies (if they don't exist)
DO $$
BEGIN
    -- Service role policy for user_profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Service role can manage all data'
    ) THEN
        CREATE POLICY "Service role can manage all data" ON public.user_profiles
            FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
    
    -- Service role policy for pre_wedding_projects
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pre_wedding_projects' 
        AND policyname = 'Service role can manage all projects'
    ) THEN
        CREATE POLICY "Service role can manage all projects" ON public.pre_wedding_projects
            FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
    
    -- Service role policy for generated_images
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'generated_images' 
        AND policyname = 'Service role can manage all images'
    ) THEN
        CREATE POLICY "Service role can manage all images" ON public.generated_images
            FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;

-- Migration 5: Create storage bucket and policies (idempotent)
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
    
    -- Create storage policies if they don't exist
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
        RAISE NOTICE 'Storage policies could not be created: %', SQLERRM;
END $$;

-- Migration 6: Create materialized view for analytics
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

-- Migration 7: Refresh analytics data
REFRESH MATERIALIZED VIEW public.project_analytics;

-- Migration completion log
DO $$
BEGIN
    RAISE NOTICE 'Database migrations completed successfully at %', NOW();
    RAISE NOTICE 'Tables: user_profiles, pre_wedding_projects, generated_images';
    RAISE NOTICE 'Storage bucket: images (configured)';
    RAISE NOTICE 'Functions: get_project_with_stats, get_user_projects_with_stats, get_user_storage_stats, cleanup_old_images, refresh_analytics';
    RAISE NOTICE 'Analytics: project_analytics materialized view created';
END $$;