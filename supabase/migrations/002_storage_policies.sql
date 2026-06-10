-- Virtuoso AI — Storage Policies
-- Creates the private recordings bucket and per-user RLS policies.
-- Run after 001_initial_schema.sql

-- ─────────────────────────────────────────
-- Bucket
-- ─────────────────────────────────────────
-- Create via Supabase dashboard OR via Management API.
-- Storage bucket creation is not supported in SQL migrations directly,
-- but you can run this via the Supabase JS client in a seed script.
-- The insert below is idempotent (on conflict do nothing).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recordings',
  'recordings',
  false,                     -- private bucket
  209715200,                 -- 200 MB in bytes
  array[
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/ogg',
    'audio/flac',
    'audio/x-flac',
    'audio/aac',
    'audio/m4a',
    'audio/x-m4a',
    'audio/mp4',
    'video/mp4'              -- some recorders produce .mp4 audio
  ]
)
on conflict (id) do nothing;

-- ─────────────────────────────────────────
-- Storage RLS Policies
-- Path pattern: {user_id}/{recording_id}/audio.{ext}
-- ─────────────────────────────────────────

-- Allow users to upload to their own folder
create policy "Users can upload recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read (download) their own recordings
create policy "Users can read own recordings"
  on storage.objects for select
  using (
    bucket_id = 'recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own recordings
create policy "Users can delete own recordings"
  on storage.objects for delete
  using (
    bucket_id = 'recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role can access all recordings (used by the audio analysis pipeline)
create policy "Service role full access recordings"
  on storage.objects for all
  using (
    bucket_id = 'recordings'
    and auth.role() = 'service_role'
  );
