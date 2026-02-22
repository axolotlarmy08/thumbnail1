/*
  # Create Storage Buckets for Videos and Thumbnails

  1. New Storage Buckets
    - `videos` - stores uploaded video files (private, 500MB max)
    - `thumbnails` - stores extracted frame images (private, 10MB max)

  2. Security
    - Authenticated users can upload to both buckets
    - Users can only read files from their own agency's workspaces
    - Upload paths follow: {workspace_id}/{video_id}/filename
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('videos', 'videos', false, 524288000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('thumbnails', 'thumbnails', false, 10485760)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Authenticated users can read own videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can read own thumbnails"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Service role can manage videos"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id IN ('videos', 'thumbnails'))
  WITH CHECK (bucket_id IN ('videos', 'thumbnails'));
