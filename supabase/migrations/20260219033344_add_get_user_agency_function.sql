/*
  # Add get_user_agency RPC function

  1. New Functions
    - `get_user_agency()` - Returns the authenticated user's agency data
      - Uses SECURITY DEFINER to bypass RLS complexities
      - Returns agency id, name, owner_id, logo_url, plan_tier, stripe fields, created_at
      - Only returns data for the calling user's own membership

  2. Security
    - Function checks auth.uid() internally
    - Returns null if user has no agency membership
*/

CREATE OR REPLACE FUNCTION public.get_user_agency()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', a.id,
    'name', a.name,
    'owner_id', a.owner_id,
    'logo_url', a.logo_url,
    'plan_tier', a.plan_tier,
    'stripe_customer_id', a.stripe_customer_id,
    'stripe_subscription_id', a.stripe_subscription_id,
    'created_at', a.created_at
  ) INTO result
  FROM agency_members am
  JOIN agencies a ON a.id = am.agency_id
  WHERE am.user_id = auth.uid()
  LIMIT 1;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_membership()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', am.id,
    'agency_id', am.agency_id,
    'user_id', am.user_id,
    'role', am.role,
    'invited_at', am.invited_at,
    'joined_at', am.joined_at
  ) INTO result
  FROM agency_members am
  WHERE am.user_id = auth.uid()
  LIMIT 1;

  RETURN result;
END;
$$;
