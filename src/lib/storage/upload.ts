// Browser-side upload helpers for Supabase Storage. Buckets and policies
// live in schema.sql section 10.
//
// Files are stored under <user-id>/<random>.<ext> so the RLS policies that
// gate writes by (storage.foldername(name))[1] = auth.uid() can rely on
// the path shape.

import { createClient } from '@/lib/supabase/client';

export const BUCKET_ABTEST_THUMBS = 'abtest-thumbnails';
export const BUCKET_AUDIENCE_EVIDENCE = 'audience-evidence';
export const BUCKET_PROJECT_UPLOADS = 'project-uploads';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB — matches bucket file_size_limit

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

function extensionFor(mime: string): string {
  switch (mime) {
    case 'image/png':  return 'png';
    case 'image/webp': return 'webp';
    default:           return 'jpg';
  }
}

function randomId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export async function uploadImage(
  file: File,
  bucket: string = BUCKET_ABTEST_THUMBS,
): Promise<UploadResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'unsupported_type' };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'file_too_large' };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const ext = extensionFor(file.type);
  const path = `${user.id}/${Date.now()}-${randomId()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
  if (uploadErr) return { ok: false, error: uploadErr.message };

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  return { ok: true, url: pub.publicUrl, path };
}
