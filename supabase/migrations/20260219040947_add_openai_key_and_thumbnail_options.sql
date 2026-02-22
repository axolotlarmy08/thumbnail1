/*
  # Add OpenAI API Key Storage and Thumbnail Options

  1. Modified Tables
    - `agencies`
      - Add `openai_api_key` (text, nullable) - stores the agency's own OpenAI API key
    - `thumbnails`
      - Add `thumbnail_options` (jsonb, default '[]') - stores array of 3 extracted frame objects
      - Add `selected_index` (integer, default 0) - which of the 3 frames the user selected

  2. Notes
    - Agencies without an API key will use the platform default key
    - thumbnail_options stores: [{url, timestamp, index}] for 3 frames
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agencies' AND column_name = 'openai_api_key'
  ) THEN
    ALTER TABLE agencies ADD COLUMN openai_api_key text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'thumbnails' AND column_name = 'thumbnail_options'
  ) THEN
    ALTER TABLE thumbnails ADD COLUMN thumbnail_options jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'thumbnails' AND column_name = 'selected_index'
  ) THEN
    ALTER TABLE thumbnails ADD COLUMN selected_index integer DEFAULT 0;
  END IF;
END $$;
