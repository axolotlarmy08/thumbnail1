/*
  # Add error_message column to videos

  1. Modified Tables
    - `videos`
      - Added `error_message` (text, nullable) - stores the actual failure reason when processing fails

  2. Notes
    - This allows the frontend to display specific error messages instead of generic "processing failed"
    - Helps users diagnose issues like missing API keys
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE videos ADD COLUMN error_message text;
  END IF;
END $$;