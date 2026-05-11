# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image and video uploads in your messaging system.

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account (includes 25GB storage and 25GB bandwidth per month)
3. Verify your email address

## Step 2: Get Your Cloud Name

1. Log in to your Cloudinary dashboard
2. You'll see your **Cloud Name** on the dashboard
3. Copy this cloud name (e.g., "your-cloud-name")

## Step 3: Create an Upload Preset

1. Go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: `subtask_media`
   - **Signing Mode**: **Unsigned** (important!)
   - **Folder**: `subtask` (optional, keeps files organized)
   - **Use filename or externally defined Public ID**: Enable if you want to preserve original filenames
5. Click **Save**

## Step 4: Configure Environment Variables

Create or update `.env.local` in your project root:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

**Important**: Replace `your-cloud-name` with your actual Cloud Name from Step 2.

## Step 5: Run the Database Migration

Run the SQL migration to add media support to the messages table:

1. Open **Supabase Dashboard** → **SQL Editor**
2. Open the file `add-media-to-messages.sql`
3. Copy and paste the content
4. Click **RUN**
5. You should see "✅ Media columns added to messages table successfully!"

## Step 6: Test the Upload

1. Go to your dashboard (client or admin)
2. Open any campaign/contract messages
3. Click the paperclip icon to attach an image or video
4. Send the message
5. The file will be uploaded to Cloudinary and appear in the chat

## Features

✅ **Image Upload** - Supports JPG, PNG, GIF, WebP
✅ **Video Upload** - Supports MP4, MOV, AVI, WebM
✅ **Real-time Updates** - Messages appear instantly for both parties
✅ **Preview on Click** - Click images to view full size in new tab
✅ **Video Playback** - Inline video player with controls
✅ **Upload Progress** - Shows "Sending..." while uploading
✅ **File Preview** - Shows selected file before sending

## File Size Limits

### Cloudinary Free Tier:
- **Max file size**: 100MB per file
- **Total storage**: 25GB
- **Bandwidth**: 25GB per month
- **Transformations**: 25,000 per month

### Recommended Limits:
- **Images**: Up to 10MB
- **Videos**: Up to 50MB

## Troubleshooting

### "Upload failed" Error

**Check**:
1. Cloud name is correct in `.env.local`
2. Upload preset `subtask_media` exists and is **unsigned**
3. File size is under 100MB
4. Internet connection is stable

### Videos Not Playing

**Check**:
1. Video format is supported (MP4, MOV, AVI, WebM)
2. Video file is not corrupted
3. Browser supports the video codec

### Images Not Loading

**Check**:
1. Cloudinary URL is correct
2. Image was successfully uploaded (check Cloudinary Media Library)
3. Browser can access cloudinary.com

## Security Notes

- Upload preset is **unsigned** for simplicity
- For production, consider using **signed uploads** with backend validation
- Add file type restrictions in the upload preset settings
- Set maximum file size limits in Cloudinary settings

## Cost Optimization

To stay within free tier limits:
1. Enable **auto-optimization** in Cloudinary settings
2. Use **lazy loading** for images
3. Set quality limits for uploads
4. Delete old/unused media regularly

## Next Steps

Your messaging system now supports:
- ✅ Text messages
- ✅ Image sharing
- ✅ Video sharing
- ✅ Real-time updates
- ✅ Full-height chat layout

You're all set! 🚀
