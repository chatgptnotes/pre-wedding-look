# Supabase Storage Setup Instructions

✅ **Storage bucket already created!** You have an `images` bucket ready to use.

## Current Setup:
- **Bucket name**: `images` ✅ (Already created)
- **Public access**: Should be enabled for image viewing
- **Upload permissions**: Restricted to authenticated users

## Database Schema Updates Required

You also need to add these columns to your `generated_images` table:

```sql
-- Add missing columns to generated_images table
ALTER TABLE generated_images 
ADD COLUMN storage_path TEXT,
ADD COLUMN is_downloaded BOOLEAN DEFAULT FALSE;
```

## Test the Storage

Once the bucket is created:
1. Generate an image in your app
2. Click the "Save" button (green button)
3. After saving, the "Download" button (blue) will appear
4. Check your Supabase Storage to see the uploaded image

## Bucket Structure

Images will be stored in your `images` bucket with this structure:
```
images/
└── {user_id}/
    ├── {timestamp}-bride-{filename}.jpg
    ├── {timestamp}-groom-{filename}.jpg
    └── {timestamp}-couple-{filename}.jpg
```

## Ready to Use! 🎉

Your storage is now configured to use the existing `images` bucket. The save/download functionality will work once you add the missing database columns.