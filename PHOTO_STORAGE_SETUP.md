# Photo Storage Setup Guide

Photo support has been added to HerdTrackr! This guide will help you set up Supabase Storage to enable photo uploads.

## Features

- **Attach photos to records**: Weight, health, and breeding records can now include up to 3 photos each
- **Animal photos**: Add photos directly to animals for identification
- **Pasture photos**: Document pasture conditions over time
- **Automatic compression**: Photos are automatically compressed and thumbnails are generated
- **Cloud storage**: Photos are stored in Supabase Storage and synced across devices

## Setup Steps

### 1. Create Supabase Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your HerdTrackr project
3. Click **Storage** in the left sidebar
4. Click **New bucket**
5. Enter the following settings:
   - **Name**: `herdtrackr-photos`
   - **Public bucket**: ✅ Enabled (photos need to be publicly accessible)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/jpg`
6. Click **Create bucket**

### 2. Set Up Row Level Security (RLS) Policies

The bucket needs proper RLS policies so users can only access photos from their own organization.

Go to **Storage** → **Policies** → **herdtrackr-photos**, then add these policies:

#### Policy 1: Users can upload photos to their organization

```sql
CREATE POLICY "Users can upload to own org"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'herdtrackr-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text
    FROM organizations o
    INNER JOIN memberships m ON m.organization_id = o.id
    WHERE m.user_id = auth.uid()
  )
);
```

#### Policy 2: Users can view photos from their organization

```sql
CREATE POLICY "Users can view own org photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'herdtrackr-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text
    FROM organizations o
    INNER JOIN memberships m ON m.organization_id = o.id
    WHERE m.user_id = auth.uid()
  )
);
```

#### Policy 3: Users can delete photos from their organization

```sql
CREATE POLICY "Users can delete own org photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'herdtrackr-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text
    FROM organizations o
    INNER JOIN memberships m ON m.organization_id = o.id
    WHERE m.user_id = auth.uid()
  )
);
```

### 3. Apply Database Migration

The app has already been updated with the necessary database schema changes (migration v8). You need to apply this migration to Supabase:

**Option 1: Using SQL Editor (Easiest)**

1. Go to **SQL Editor** → **New query**
2. Copy and paste the contents of `supabase/migrations/00008_add_photos.sql`
3. Click **Run**

**Option 2: Using Supabase CLI**

```bash
npx supabase db push
```

### 4. Update Environment Variables (if needed)

Ensure your `.env` file has the correct Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Rebuild the App

```bash
# Clear cache and restart
npm start -- --clear

# For iOS
npm run ios

# For Android
npm run android
```

## How It Works

### Photo Storage Structure

Photos are organized in Supabase Storage using this folder structure:

```
herdtrackr-photos/
├── {org_id}/
│   ├── animals/{animal_id}/{timestamp}.jpg
│   ├── pastures/{pasture_id}/{timestamp}.jpg
│   ├── records/
│   │   ├── weight/{record_id}/{timestamp}.jpg
│   │   ├── health/{record_id}/{timestamp}.jpg
│   │   └── breeding/{record_id}/{timestamp}.jpg
│   └── thumbnails/
│       ├── animals/{animal_id}/{timestamp}.jpg
│       ├── pastures/{pasture_id}/{timestamp}.jpg
│       └── records/...
```

### Photo Processing

When a photo is added:
1. User selects or takes a photo
2. Photo is compressed and resized (max 1920x1920)
3. Thumbnail is created (300x300)
4. Both are uploaded to Supabase Storage
5. URLs are saved in the database record
6. Photos sync across devices via WatermelonDB sync

### Database Schema

Each model with photo support has a `photos` column that stores a JSON array:

```typescript
{
  uri: string              // Full-size photo URL
  thumbnailUri: string     // Thumbnail URL
  createdAt: number        // Timestamp
  createdBy: string        // User ID
  caption?: string         // Optional caption
}
```

## Using Photos in the App

### Adding Photos to Records

1. **Weight Records**:
   - Go to Animal Detail → Weight tab
   - Tap **+ Add Weight Record**
   - Enter weight data
   - Scroll to **Photos (Optional)**
   - Tap **+** to add photos (camera or gallery)
   - Tap **Save Record**

2. **Health Records**:
   - Similar to weight records
   - Useful for documenting injuries, conditions, or vaccination sites

3. **Breeding Records**:
   - Document breeding events, pregnancy progress, or calving

### Viewing Photos

- Photos appear as small thumbnails in record cards
- Tap any thumbnail to view full-size
- Swipe to navigate between photos
- Tap X or background to close

## Troubleshooting

### Photos not uploading

1. **Check bucket exists**: Go to Storage in Supabase Dashboard
2. **Check RLS policies**: Ensure all 3 policies are created
3. **Check org membership**: User must be a member of an organization
4. **Check network**: Ensure device has internet connection
5. **Check file size**: Photos larger than 10MB will fail

### Photos not displaying

1. **Check bucket is public**: Public bucket must be enabled
2. **Check photo URLs**: URLs should start with `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/herdtrackr-photos/`
3. **Check migration applied**: Run `SELECT * FROM weight_records LIMIT 1` and verify `photos` column exists

### Permission denied errors

- Verify RLS policies are set up correctly
- Check that the user has an active membership in the organization
- Ensure authenticated users are accessing their own organization's photos

## Migration from Existing Data

If you have existing records without photos, they will continue to work normally. The `photos` field is optional and defaults to `null`.

## Next Steps

Once photo storage is set up:

1. ✅ Users can attach photos to weight, health, and breeding records
2. ✅ Photos are automatically compressed and uploaded to Supabase
3. ✅ Thumbnails are generated for efficient display
4. ✅ Photos sync across devices
5. 🔜 Future: Add photo support for pastures (coming soon)
6. 🔜 Future: Add animal profile photos (coming soon)
7. 🔜 Future: Add photo captions and metadata

## Cost Considerations

Supabase Storage pricing:
- Free tier: 1GB storage, 2GB bandwidth
- Pro tier: 100GB storage, 200GB bandwidth
- Estimated storage per photo: ~500KB (compressed) + ~50KB (thumbnail) = ~550KB
- 1GB = ~1,800 photos

For most farms, the free tier should be sufficient. Monitor storage usage in Supabase Dashboard.
