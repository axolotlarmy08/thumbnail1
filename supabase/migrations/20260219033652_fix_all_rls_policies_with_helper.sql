/*
  # Fix all RLS policies to use is_agency_member helper

  1. Modified Tables & Policies
    - `agencies` - SELECT policy now uses is_agency_member()
    - `videos` - SELECT, INSERT, UPDATE policies now use is_agency_member()
    - `captions` - SELECT, INSERT, UPDATE policies now use is_agency_member()
    - `hook_scores` - SELECT, INSERT policies now use is_agency_member()
    - `optimization_predictions` - SELECT, INSERT policies now use is_agency_member()
    - `thumbnails` - SELECT, INSERT, UPDATE policies now use is_agency_member()
    - `transcripts` - SELECT, INSERT policies now use is_agency_member()

  2. Security
    - All policies now use the SECURITY DEFINER helper function is_agency_member()
      to avoid RLS recursion issues when checking agency membership
    - Access patterns remain identical - only the implementation changes
    
  3. Important Notes
    - The is_agency_member() function was created in a previous migration
    - This migration replaces all inline agency_members subqueries
      with the helper function to prevent RLS chain failures
*/

-- Helper to check membership via workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM client_workspaces cw
    JOIN agency_members am ON am.agency_id = cw.agency_id
    WHERE cw.id = workspace_uuid
    AND am.user_id = auth.uid()
  );
END;
$$;

-- Helper to check membership via video
CREATE OR REPLACE FUNCTION public.is_video_member(video_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM videos v
    JOIN client_workspaces cw ON cw.id = v.workspace_id
    JOIN agency_members am ON am.agency_id = cw.agency_id
    WHERE v.id = video_uuid
    AND am.user_id = auth.uid()
  );
END;
$$;

-- agencies
DROP POLICY IF EXISTS "Agency members can view their agency" ON agencies;
CREATE POLICY "Agency members can view their agency"
  ON agencies FOR SELECT
  TO authenticated
  USING (is_agency_member(id));

-- videos
DROP POLICY IF EXISTS "Agency members can view videos" ON videos;
CREATE POLICY "Agency members can view videos"
  ON videos FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Agency members can create videos" ON videos;
CREATE POLICY "Agency members can create videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Agency members can update videos" ON videos;
CREATE POLICY "Agency members can update videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- captions
DROP POLICY IF EXISTS "Agency members can view captions" ON captions;
CREATE POLICY "Agency members can view captions"
  ON captions FOR SELECT
  TO authenticated
  USING (is_video_member(video_id));

DROP POLICY IF EXISTS "Agency members can create captions" ON captions;
CREATE POLICY "Agency members can create captions"
  ON captions FOR INSERT
  TO authenticated
  WITH CHECK (is_video_member(video_id));

DROP POLICY IF EXISTS "Agency members can update captions" ON captions;
CREATE POLICY "Agency members can update captions"
  ON captions FOR UPDATE
  TO authenticated
  USING (is_video_member(video_id))
  WITH CHECK (is_video_member(video_id));

-- hook_scores
DROP POLICY IF EXISTS "Agency members can view hook scores" ON hook_scores;
CREATE POLICY "Agency members can view hook scores"
  ON hook_scores FOR SELECT
  TO authenticated
  USING (is_video_member(video_id));

DROP POLICY IF EXISTS "Agency members can create hook scores" ON hook_scores;
CREATE POLICY "Agency members can create hook scores"
  ON hook_scores FOR INSERT
  TO authenticated
  WITH CHECK (is_video_member(video_id));

-- optimization_predictions
DROP POLICY IF EXISTS "Agency members can view predictions" ON optimization_predictions;
CREATE POLICY "Agency members can view predictions"
  ON optimization_predictions FOR SELECT
  TO authenticated
  USING (is_video_member(video_id));

DROP POLICY IF EXISTS "Agency members can create predictions" ON optimization_predictions;
CREATE POLICY "Agency members can create predictions"
  ON optimization_predictions FOR INSERT
  TO authenticated
  WITH CHECK (is_video_member(video_id));

-- thumbnails
DROP POLICY IF EXISTS "Agency members can view thumbnails" ON thumbnails;
CREATE POLICY "Agency members can view thumbnails"
  ON thumbnails FOR SELECT
  TO authenticated
  USING (is_video_member(video_id));

DROP POLICY IF EXISTS "Agency members can create thumbnails" ON thumbnails;
CREATE POLICY "Agency members can create thumbnails"
  ON thumbnails FOR INSERT
  TO authenticated
  WITH CHECK (is_video_member(video_id));

DROP POLICY IF EXISTS "Agency members can update thumbnails" ON thumbnails;
CREATE POLICY "Agency members can update thumbnails"
  ON thumbnails FOR UPDATE
  TO authenticated
  USING (is_video_member(video_id))
  WITH CHECK (is_video_member(video_id));

-- transcripts
DROP POLICY IF EXISTS "Agency members can view transcripts" ON transcripts;
CREATE POLICY "Agency members can view transcripts"
  ON transcripts FOR SELECT
  TO authenticated
  USING (is_video_member(video_id));

DROP POLICY IF EXISTS "Agency members can create transcripts" ON transcripts;
CREATE POLICY "Agency members can create transcripts"
  ON transcripts FOR INSERT
  TO authenticated
  WITH CHECK (is_video_member(video_id));
