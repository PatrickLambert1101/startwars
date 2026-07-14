-- Add phone number and invite method to invites table
-- Supports email, SMS, and WhatsApp invitations

ALTER TABLE invites
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS invite_method TEXT CHECK (invite_method IN ('email', 'sms', 'whatsapp')) DEFAULT 'email';

-- Make email optional (can use phone instead)
ALTER TABLE invites
ALTER COLUMN email DROP NOT NULL;

-- Add constraint to ensure either email or phone is provided
ALTER TABLE invites
ADD CONSTRAINT email_or_phone_required CHECK (
  (email IS NOT NULL AND email != '') OR
  (phone IS NOT NULL AND phone != '')
);

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_invites_phone ON invites(phone);

-- Update existing records to have email method
UPDATE invites
SET invite_method = 'email'
WHERE invite_method IS NULL;

-- Comments
COMMENT ON COLUMN invites.phone IS 'Phone number for SMS/WhatsApp invites (E.164 format recommended, e.g., +27821234567)';
COMMENT ON COLUMN invites.invite_method IS 'How the invite was sent: email, sms, or whatsapp';
