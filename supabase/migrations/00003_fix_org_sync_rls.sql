-- Fix RLS policies to allow syncing organizations with memberships created locally
-- The issue: When an org is created locally with a membership, then synced,
-- both the trigger AND the sync try to create memberships, causing conflicts.

-- Solution: Make the trigger smarter to not create duplicate memberships,
-- and ensure RLS policies allow the sync to work properly.

-- Drop and recreate the auto_add_org_owner trigger function to be idempotent
CREATE OR REPLACE FUNCTION public.auto_add_org_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create membership if one doesn't already exist for this org+user
  -- This handles the case where the membership was created locally and synced
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = NEW.id
      AND user_id = auth.uid()
  ) THEN
    INSERT INTO public.memberships (
      user_id,
      organization_id,
      user_email,
      user_display_name,
      role,
      joined_at,
      is_active
    )
    SELECT
      auth.uid(),
      NEW.id,
      email,
      raw_user_meta_data->>'display_name',
      'admin',
      NOW(),
      TRUE
    FROM auth.users
    WHERE id = auth.uid();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger is already created, this just updates the function
