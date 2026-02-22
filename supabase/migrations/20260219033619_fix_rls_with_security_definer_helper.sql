/*
  # Fix RLS policies using a SECURITY DEFINER helper

  1. New Functions
    - `is_agency_member(agency_uuid)` - Checks if the current user is a member of the given agency
      - Uses SECURITY DEFINER to avoid RLS recursion issues
      - Returns boolean

  2. Modified Policies
    - Updates all policies on `client_workspaces` that reference `agency_members` 
      to use the new helper function instead of direct subqueries
    - Updates `agency_members` co-members policy to use the helper

  3. Security
    - Helper function checks auth.uid() internally
    - SECURITY DEFINER bypasses RLS only for the membership check
    - All existing access patterns remain the same
*/

CREATE OR REPLACE FUNCTION public.is_agency_member(agency_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM agency_members
    WHERE agency_id = agency_uuid
    AND user_id = auth.uid()
  );
END;
$$;

DROP POLICY IF EXISTS "Agency members can create workspaces" ON client_workspaces;
CREATE POLICY "Agency members can create workspaces"
  ON client_workspaces FOR INSERT
  TO authenticated
  WITH CHECK (is_agency_member(agency_id));

DROP POLICY IF EXISTS "Agency members can view workspaces" ON client_workspaces;
CREATE POLICY "Agency members can view workspaces"
  ON client_workspaces FOR SELECT
  TO authenticated
  USING (is_agency_member(agency_id));

DROP POLICY IF EXISTS "Agency members can update workspaces" ON client_workspaces;
CREATE POLICY "Agency members can update workspaces"
  ON client_workspaces FOR UPDATE
  TO authenticated
  USING (is_agency_member(agency_id))
  WITH CHECK (is_agency_member(agency_id));

DROP POLICY IF EXISTS "Agency owners can delete workspaces" ON client_workspaces;
CREATE POLICY "Agency owners can delete workspaces"
  ON client_workspaces FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agencies
      WHERE agencies.id = client_workspaces.agency_id
      AND agencies.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can view co-members" ON agency_members;
CREATE POLICY "Members can view co-members"
  ON agency_members FOR SELECT
  TO authenticated
  USING (is_agency_member(agency_id));
