# Supabase Storage Bucket Setup

If the automatic bucket creation is failing, you can manually create the storage bucket:

## Option 1: Manual Creation via Supabase Dashboard

1. Go to your **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Enter these settings:
   - **Name**: `images`
   - **Public bucket**: ✅ **Enabled**
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

## Option 2: SQL Command

Run this in your **Supabase SQL Editor**:

```sql
-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images', 
  true,
  false,
  5242880,
  '{"image/jpeg","image/png","image/webp"}'
);

-- Create policies for the bucket
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition)
VALUES 
(
  'images_select_policy',
  'images',
  'Allow authenticated users to select images',
  '(auth.uid() IS NOT NULL)',
  '(auth.uid() IS NOT NULL)'
),
(
  'images_insert_policy', 
  'images',
  'Allow authenticated users to upload images',
  '(auth.uid() IS NOT NULL)',
  '(auth.uid() IS NOT NULL)'
);
```

## Option 3: Check Current Status

After setup, check if bucket exists by looking at the console logs when saving an image.