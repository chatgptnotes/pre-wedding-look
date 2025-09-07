-- Storage Buckets Setup for Pre-Wedding Look AI
-- Run this in Supabase SQL Editor to ensure all required buckets exist with proper permissions

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
-- Main images bucket for uploads and generated content
('images', 'images', true, false, 10485760, '{"image/jpeg","image/png","image/webp","image/jpg"}'),

-- Faces bucket for model uploads (bride/groom photos)  
('faces', 'faces', true, false, 5242880, '{"image/jpeg","image/png","image/webp","image/jpg"}'),

-- Galleries bucket for AI generated images
('galleries', 'galleries', true, false, 10485760, '{"image/jpeg","image/png","image/webp","image/jpg"}'),

-- Audio bucket for voice slideshows (if needed)
('audio', 'audio', true, false, 52428800, '{"audio/mpeg","audio/wav","audio/mp3","audio/m4a"}'),

-- Video bucket for generated videos (if needed)  
('videos', 'videos', true, false, 104857600, '{"video/mp4","video/webm","video/quicktime"}')

ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remove any existing restrictive policies
DELETE FROM storage.policies WHERE bucket_id IN ('images', 'faces', 'galleries', 'audio', 'videos');

-- Create permissive storage policies for all buckets
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES 
-- Images bucket policies
('images', 'Public read access for images', 'true'),
('images', 'Authenticated upload for images', 'auth.role() = ''authenticated'' OR auth.role() = ''service_role'''),
('images', 'Authenticated delete for images', 'auth.role() = ''authenticated'' OR auth.role() = ''service_role'''),

-- Faces bucket policies (for model uploads)
('faces', 'Public read access for faces', 'true'),  
('faces', 'Authenticated upload for faces', 'auth.role() = ''authenticated'' OR auth.role() = ''service_role'''),
('faces', 'Authenticated delete for faces', 'auth.role() = ''authenticated'' OR auth.role() = ''service_role'''),

-- Galleries bucket policies (for generated images)
('galleries', 'Public read access for galleries', 'true'),
('galleries', 'Authenticated upload for galleries', 'auth.role() = ''authenticated'' OR auth.role() = ''service_role'''),
('galleries', 'Authenticated delete for galleries', 'auth.role() = ''authenticated'' OR auth.role() = ''service_role'''),

-- Audio bucket policies  
('audio', 'Public read access for audio', 'true'),
('audio', 'Authenticated upload for audio', 'auth.role() = ''authenticated'' OR auth.role() = ''service_role'''),

-- Video bucket policies
('videos', 'Public read access for videos', 'true'),
('videos', 'Authenticated upload for videos', 'auth.role() = ''authenticated'' OR auth.role() = ''service_role''')

ON CONFLICT (bucket_id, name) DO UPDATE SET 
  definition = EXCLUDED.definition;

-- Enable RLS on storage objects table (should be enabled by default but ensuring)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage object policies for accessing files
CREATE POLICY "Storage objects public read" ON storage.objects FOR SELECT USING (true);

CREATE POLICY "Storage objects authenticated manage" ON storage.objects 
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STORAGE BUCKETS SETUP COMPLETED ===';
  RAISE NOTICE 'Created/Updated buckets: images, faces, galleries, audio, videos';
  RAISE NOTICE 'All buckets are public for read access';
  RAISE NOTICE 'Authenticated users can upload/delete files';
  RAISE NOTICE 'File uploads should now work without storage permission errors';
  RAISE NOTICE '';
END $$;