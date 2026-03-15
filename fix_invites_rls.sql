-- Check current memberships
SELECT COUNT(*) as membership_count FROM memberships;

-- Check current invites policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'invites';

-- Drop and recreate RLS policies for invites
DROP POLICY IF EXISTS "Users can view invites for their organizations" ON invites;
DROP POLICY IF EXISTS "Admins can create invites" ON invites;
DROP POLICY IF EXISTS "Admins can delete invites" ON invites;
DROP POLICY IF EXISTS "Admins can update invites" ON invites;
DROP POLICY IF EXISTS "Users can view invites by code" ON invites;

-- Enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Allow admins to create invites
-- This checks if user has an admin membership for the organization
CREATE POLICY "Admins can create invites"
ON invites
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM memberships m
    WHERE m.organization_id = organization_id
    AND m.user_id = auth.uid()
    AND m.role = 'admin'
  )
);

-- Allow users to view invites for their organizations
CREATE POLICY "Users can view invites for their organizations"
ON invites
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM memberships m
    WHERE m.organization_id = invites.organization_id
    AND m.user_id = auth.uid()
  )
  OR
  TRUE  -- Allow anyone to view (for accepting invites by code)
);

-- Allow admins to delete invites
CREATE POLICY "Admins can delete invites"
ON invites
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM memberships m
    WHERE m.organization_id = invites.organization_id
    AND m.user_id = auth.uid()
    AND m.role = 'admin'
  )
);

-- Allow admins to update invites
CREATE POLICY "Admins can update invites"
ON invites
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM memberships m
    WHERE m.organization_id = invites.organization_id
    AND m.user_id = auth.uid()
    AND m.role = 'admin'
  )
);

-- Check the policies were created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'invites';

-- Also check if we have any memberships for the current user
SELECT m.organization_id, m.role, o.name as org_name
FROM memberships m
JOIN organizations o ON o.id = m.organization_id
WHERE m.user_id = auth.uid()
LIMIT 5;
