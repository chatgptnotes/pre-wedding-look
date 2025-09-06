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

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS pre_wedding_projects_user_id_idx ON public.pre_wedding_projects(user_id);
CREATE INDEX IF NOT EXISTS pre_wedding_projects_created_at_idx ON public.pre_wedding_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS generated_images_project_id_idx ON public.generated_images(project_id);
CREATE INDEX IF NOT EXISTS generated_images_type_idx ON public.generated_images(image_type);

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

CREATE POLICY "Users can delete own generated images" ON public.generated_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.pre_wedding_projects 
            WHERE id = project_id AND user_id = auth.uid()
        )
    );

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

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.pre_wedding_projects TO anon, authenticated;
GRANT ALL ON public.generated_images TO anon, authenticated;
