-- =============================================
-- Add Media Support to Messages Table
-- =============================================
-- Run this in your Supabase SQL Editor to add image/video support to messages

-- Add media columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video'));

-- Create index for faster queries with media
CREATE INDEX IF NOT EXISTS idx_messages_media_type ON messages(media_type);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Media columns added to messages table successfully!';
  RAISE NOTICE 'Messages can now include images and videos.';
END $$;
