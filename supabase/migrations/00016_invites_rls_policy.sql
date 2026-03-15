-- Add RLS policies for invites table to allow team admins to create and manage invites

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view invites for their organizations" ON invites;
DROP POLICY IF EXISTS "Admins can create invites" ON invites;
DROP POLICY IF EXISTS "Admins can delete invites" ON invites;
DROP POLICY IF EXISTS "Users can view invites by code" ON invites;

-- Enable RLS on invites table
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invites for organizations they belong to
CREATE POLICY "Users can view invites for their organizations"
ON invites
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM memberships
    WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can create invites for their organizations
CREATE POLICY "Admins can create invites"
ON invites
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM memberships
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Admins can delete/update invites for their organizations
CREATE POLICY "Admins can delete invites"
ON invites
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM memberships
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update invites"
ON invites
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM memberships
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Anyone can view invites by their unique code (for accepting invites)
CREATE POLICY "Users can view invites by code"
ON invites
FOR SELECT
TO authenticated
USING (true);
