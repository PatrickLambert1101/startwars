# Email, SMS, and WhatsApp Invites Setup

This document outlines the implementation of multi-channel team invites for HerdTrackr.

## Overview

Team invites can now be sent via three methods:
- **Email** (via Resend) - FREE for up to 3,000/month
- **SMS** (via Clickatell) - ~R0.22 per message
- **WhatsApp** (via Clickatell) - ~R0.72-R1.08 per message

## Implementation

### 1. Database Changes

**Migration: `00018_add_invite_phone_and_method.sql`**

Added support for phone numbers and invite methods:
```sql
ALTER TABLE invites
ADD COLUMN phone TEXT,
ADD COLUMN invite_method TEXT CHECK (invite_method IN ('email', 'sms', 'whatsapp')) DEFAULT 'email';

-- Made email optional (can use phone instead)
ALTER TABLE invites
ALTER COLUMN email DROP NOT NULL;

-- Constraint to ensure either email or phone is provided
ALTER TABLE invites
ADD CONSTRAINT email_or_phone_required CHECK (
  (email IS NOT NULL AND email != '') OR
  (phone IS NOT NULL AND phone != '')
);
```

### 2. Supabase Edge Function

**File: `supabase/functions/send-invite/index.ts`**

Created an Edge Function that:
- Accepts `inviteId` and `method` parameters
- Fetches invite details from database
- Sends via Resend (email) or Clickatell (SMS/WhatsApp)
- Returns success/error status

**Key Features:**
- Beautiful HTML email template with branding
- SMS/WhatsApp message with invite code
- Proper error handling
- CORS support

### 3. App Updates

#### Updated Files:

**`app/hooks/useTeam.ts`**
- Updated `inviteMember()` to accept `contact`, `role`, and `method`
- Calls Edge Function to send invite after creating record
- Handles both email and phone formats

**`app/screens/TeamScreen/TeamScreen.tsx`**
- Added method selector (Email/SMS/WhatsApp)
- Dynamic form labels based on selected method
- Different validation for email vs phone
- Icons for each method

**`app/i18n/en.ts`** (and other languages)
- Added translation keys for method selection
- Phone number labels and placeholders
- Updated error messages

**`app/services/sync_rpc.ts`**
- **CRITICAL FIX**: Fixed `watermelonToSupabase()` function
- Now properly extracts `_raw` data from WatermelonDB records
- Converts timestamps to ISO strings
- Parses JSONB fields correctly

## Setup Instructions

### Step 1: Get API Keys

#### Resend (Email)
1. Sign up at https://resend.com
2. Create an API key
3. Verify your sending domain (or use their sandbox for testing)

#### Clickatell (SMS/WhatsApp)
1. Sign up at https://www.clickatell.com
2. Create a new API integration
3. Get your API key
4. For WhatsApp: Apply for WhatsApp Business API access

### Step 2: Configure Supabase Secrets

Run these commands in your terminal:

```bash
# Set Resend API key
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx

# Set Clickatell API key
npx supabase secrets set CLICKATELL_API_KEY=your_clickatell_api_key
```

### Step 3: Deploy Edge Function

```bash
npx supabase functions deploy send-invite
```

### Step 4: Test the Invite Flow

1. Open the app and go to Team screen
2. Click "+ Invite"
3. Choose a method (Email/SMS/WhatsApp)
4. Enter contact info
5. Select role (Admin/Worker)
6. Send invite

## Pricing

### Resend (Email)
- **Free Tier**: 3,000 emails/month
- **Paid**: $20/month for 100,000 emails
- Perfect for your use case

### Clickatell (SMS/WhatsApp)
- **SMS**: ~R0.22 per message
- **WhatsApp**: R0.72-R1.08 per message
- Pay-as-you-go pricing

## Email Template

The email template includes:
- HerdTrackr branding
- Gradient header
- Invite code prominently displayed
- Step-by-step instructions
- Professional footer

## SMS/WhatsApp Template

```
Hi! [Inviter Name] invited you to join [Org Name] on HerdTrackr.

Your invite code: [CODE]

Download the app and enter this code to join the team. Valid for 7 days.
```

## Error Handling

The system gracefully handles failures:
- If email/SMS fails to send, invite is still created
- User gets the invite code to share manually
- Edge Function errors are logged but don't fail the operation

## Testing

### Test Email (Development)

For testing, Resend provides a sandbox mode that doesn't actually send emails but shows you the rendered HTML.

### Test SMS/WhatsApp

⚠️ **Warning**: SMS and WhatsApp will charge for test messages. Use sparingly or set up Clickatell's test credentials.

## Future Enhancements

- [ ] Track delivery status
- [ ] Resend failed invites
- [ ] Customize message templates per organization
- [ ] Add invite analytics (open rates, etc.)
- [ ] Support for other languages in emails

## Troubleshooting

### Email not sending

1. Check Supabase logs: Dashboard → Edge Functions → send-invite → Logs
2. Verify RESEND_API_KEY is set correctly
3. Check domain is verified in Resend dashboard
4. Look for errors in function invocation

### SMS/WhatsApp not sending

1. Check Clickatell account balance
2. Verify API key permissions
3. For WhatsApp: Ensure phone number has WhatsApp installed
4. Check phone number format (use E.164 format: +27821234567)

### Edge Function not being called

1. Ensure function is deployed: `npx supabase functions list`
2. Check authentication token is valid
3. Look for CORS errors in browser console
4. Verify function name matches: `send-invite`

## Security

- API keys are stored as Supabase secrets (never in code)
- Edge Function validates user authentication
- Only admins can send invites (enforced via RLS)
- Phone numbers and emails are validated

## Cost Estimation

For a farm with 10 workers:
- **Email invites**: FREE (well within 3,000/month limit)
- **SMS invites**: R2.20 (10 × R0.22)
- **WhatsApp invites**: R7.20-R10.80 (10 × R0.72-R1.08)

Recommendation: Use email by default, SMS/WhatsApp only when needed.
