-- Create super_users table to grant full commercial access to specific users
-- This allows bypassing subscription checks for testing, demos, or special access

CREATE TABLE IF NOT EXISTS super_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by text,
    granted_at timestamptz DEFAULT now(),
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_super_users_email ON super_users(email);
CREATE INDEX IF NOT EXISTS idx_super_users_user_id ON super_users(user_id);
CREATE INDEX IF NOT EXISTS idx_super_users_is_active ON super_users(is_active);

-- Enable RLS
ALTER TABLE super_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own super user status
CREATE POLICY "Users can read own super user status"
    ON super_users
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR email = auth.jwt()->>'email'
    );

-- Policy: Only authenticated users can check super user status (needed for subscription checks)
CREATE POLICY "Authenticated users can read super users"
    ON super_users
    FOR SELECT
    TO authenticated
    USING (true);

-- Create a function to check if a user is a super user
CREATE OR REPLACE FUNCTION is_super_user(check_user_id uuid DEFAULT NULL, check_email text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
    user_uuid uuid;
BEGIN
    -- Get current user info if not provided
    IF check_user_id IS NULL THEN
        check_user_id := auth.uid();
    END IF;

    IF check_email IS NULL THEN
        check_email := auth.jwt()->>'email';
    END IF;

    -- Check if user is a super user
    RETURN EXISTS (
        SELECT 1
        FROM super_users
        WHERE is_active = true
        AND (
            user_id = check_user_id
            OR email = check_email
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_super_user TO authenticated;

-- Create a helper function to add super users (admin use only)
CREATE OR REPLACE FUNCTION add_super_user(
    user_email text,
    admin_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id uuid;
    target_user_id uuid;
BEGIN
    -- Try to find the user ID from auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;

    -- Insert or update super user record
    INSERT INTO super_users (email, user_id, granted_by, notes, is_active)
    VALUES (
        user_email,
        target_user_id,
        COALESCE(auth.jwt()->>'email', 'system'),
        admin_notes,
        true
    )
    ON CONFLICT (email)
    DO UPDATE SET
        is_active = true,
        user_id = COALESCE(EXCLUDED.user_id, super_users.user_id),
        notes = COALESCE(EXCLUDED.notes, super_users.notes),
        granted_by = COALESCE(auth.jwt()->>'email', 'system'),
        granted_at = now(),
        updated_at = now()
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;

-- Grant execute to service role only (for security)
GRANT EXECUTE ON FUNCTION add_super_user TO service_role;

-- Add some helpful comments
COMMENT ON TABLE super_users IS 'Users with full commercial access regardless of subscription tier';
COMMENT ON FUNCTION is_super_user IS 'Check if a user has super user access (full commercial features)';
COMMENT ON FUNCTION add_super_user IS 'Add a user to super users list (service_role only)';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_super_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_super_users_updated_at
    BEFORE UPDATE ON super_users
    FOR EACH ROW
    EXECUTE FUNCTION update_super_users_updated_at();
