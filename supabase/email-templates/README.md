# HerdTrackr Email Templates

Professional, branded email templates for Supabase authentication using table-based layouts for maximum email client compatibility.

## Templates Included

All templates follow the same earth-tone design with HerdTrackr branding:

- **otp.html** - One-time password (OTP) sign-in code
- **magic-link.html** - Magic link sign-in (passwordless)
- **confirm-signup.html** - Email verification for new signups
- **recovery.html** - Password reset link
- **email-change.html** - Email address change confirmation
- **invite.html** - Team invitation email

## Design Features

- **Colors**: Earth tones (#F5F3F0, #E2EDDF, #36712D, #4A8C3F)
- **Layout**: Table-based HTML for email client compatibility
- **Responsive**: Works on desktop and mobile
- **Accessible**: Clear text, good contrast, alt text on images
- **Professional**: Clean, modern design with consistent branding

## Installation Instructions

### Step 1: Upload Logo to Supabase Storage

1. Go to Supabase Dashboard → **Storage**:
   https://supabase.com/dashboard/project/geczhyukynirvpdjnbel/storage/buckets

2. Create a public bucket called `assets` (if it doesn't exist)

3. Upload your HerdTrackr logo as `herd-logo.png` (72x72px recommended)

**Note:** The image URL is already configured in all templates as:
```
https://geczhyukynirvpdjnbel.supabase.co/storage/v1/object/public/assets/herd-logo.png
```
Just upload the logo and you're done!

### Step 2: Configure Custom SMTP (Afrihost)

To send emails from `patrick@herdtrackr.co.za`:

1. Go to Supabase Dashboard → **Authentication → Settings**:
   https://supabase.com/dashboard/project/geczhyukynirvpdjnbel/settings/auth

2. Scroll to **SMTP Settings**

3. Enable **Custom SMTP**

4. Enter your Afrihost SMTP credentials:
   ```
   SMTP Host: mail.herdtrackr.co.za
   (or smtp.afrihost.com for shared hosting)

   SMTP Port: 587 (TLS) or 465 (SSL)

   SMTP Username: patrick@herdtrackr.co.za

   SMTP Password: [Your Afrihost email password]

   SMTP Sender Name: HerdTrackr

   SMTP Sender Email: patrick@herdtrackr.co.za
   ```

5. Click **Save**

**Need SMTP Settings?**
- Check your Afrihost cPanel/Webmail settings
- Or contact Afrihost support: support@afrihost.com
- Common ports: 587 (TLS), 465 (SSL), 25 (non-encrypted)

### Step 3: Update Email Templates in Supabase

Go to **Authentication → Email Templates**:
https://supabase.com/dashboard/project/geczhyukynirvpdjnbel/auth/templates

For each template type:

#### 1. Email OTP (Sign-in Code)
- Click **"Email OTP"**
- Replace content with `otp.html`
- Click **Save**

#### 2. Magic Link
- Click **"Magic Link"**
- Replace content with `magic-link.html`
- Click **Save**

#### 3. Confirm Signup
- Click **"Confirm Signup"**
- Replace content with `confirm-signup.html`
- Click **Save**

#### 4. Password Recovery
- Click **"Recovery"**
- Replace content with `recovery.html`
- Click **Save**

#### 5. Email Change
- Click **"Email Change"**
- Replace content with `email-change.html`
- Click **Save**

#### 6. Invite User
- Click **"Invite"**
- Replace content with `invite.html`
- Click **Save**

**Note:** All templates already have the correct logo URL and phone number (+27 60 878 3715) hardcoded.

## Template Variables Reference

Supabase provides these variables for use in templates:

### Common Variables (all templates)
- `{{ .Email }}` - The recipient's email address
- `{{ .SiteURL }}` - Your app's site URL

### OTP Templates
- `{{ .Token }}` - The verification code (e.g., "1234567")

### Link-based Templates
- `{{ .ConfirmationURL }}` - The magic link/confirmation URL
- `{{ .TokenHash }}` - The token hash (for custom implementations)

### Invite Template
- `{{ .Data.inviterEmail }}` - Email of the person who sent the invite
- `{{ .Data.organizationName }}` - Name of the organization (if you pass it)

## Testing Your Setup

### Test Email Delivery

1. Try signing in to the app with your email

2. Check your inbox (and spam folder)

3. Verify:
   - ✅ Email arrives within 1-2 minutes
   - ✅ Comes from `patrick@herdtrackr.co.za` (if SMTP configured)
   - ✅ Logo displays correctly
   - ✅ Design looks professional
   - ✅ Links/codes work

### Test Each Template Type

- **OTP**: Try signing in
- **Magic Link**: Request a magic link sign-in
- **Signup**: Create a new account
- **Recovery**: Click "Forgot Password"
- **Email Change**: Update your email in settings
- **Invite**: Invite a team member

## Customization

### Update Contact Information

In the footer of each template, the contact info is already configured as:

```html
<td style="font-size: 12px; color: #8C857C; padding: 0 8px;">
  &#9993; support@herdtrackr.com
</td>
<td style="font-size: 12px; color: #8C857C; padding: 0 8px;">
  &#9742; +27 60 878 3715
</td>
```

You can update these if needed.

### Change Colors

Main brand colors used throughout:

```css
Background: #F5F3F0 (light beige)
Card background: #FFFFFF (white)
OTP/Code box: #E2EDDF (light green)
Primary green: #36712D (dark green)
Secondary green: #4A8C3F (medium green)
Border: #C5DBBF (green border)
Text: #1E1A16 (dark brown/black)
Subdued text: #8C857C (brown/grey)
Lighter text: #B5AFA6 (light brown/grey)
```

### Adjust Expiry Times

Update the expiry text in each template:

```html
<p style="margin: 24px 0 0; font-size: 13px; color: #B5AFA6; text-align: center;">
  This code expires in <strong style="color: #8C857C;">10 minutes</strong>
</p>
```

Supabase default expiry times:
- OTP codes: 60 minutes (can be changed in auth settings)
- Magic links: 60 minutes
- Recovery links: 60 minutes
- Invite links: 7 days

## Troubleshooting

### Emails Not Sending

1. **Check Supabase Logs**:
   - Go to Dashboard → Project → Logs
   - Look for auth errors

2. **Verify SMTP Credentials**:
   - Test by sending a test email from your email client
   - Ensure password is correct
   - Check firewall isn't blocking SMTP ports

3. **Check Spam Folder**:
   - Emails might be filtered as spam initially
   - Add sender to contacts

4. **Try Without Custom SMTP**:
   - Temporarily disable custom SMTP
   - Use Supabase's default email service
   - If this works, issue is with SMTP config

### Logo Not Displaying

1. **Check Storage Bucket is Public**:
   - Go to Storage → Buckets → `assets`
   - Ensure bucket has public access

2. **Verify Image URL**:
   - Copy the URL from template
   - Open in browser to test
   - Should display the logo

3. **Check Image Format**:
   - Use PNG, JPG, or GIF
   - Recommended: PNG with transparency
   - Size: 72x72px or 144x144px (@2x)

### Template Not Updating

1. **Clear Cache**:
   - Use incognito/private browsing
   - Clear browser cache

2. **Wait for Propagation**:
   - Changes may take 1-2 minutes

3. **Check Template Type**:
   - Ensure you're editing the correct template
   - OTP vs Magic Link vs Confirm Signup, etc.

### Emails Look Broken

1. **Test in Different Clients**:
   - Gmail (web and mobile)
   - Outlook
   - Apple Mail
   - ProtonMail

2. **Check HTML Syntax**:
   - Ensure all tags are closed
   - Table structure is valid
   - No broken style attributes

3. **Validate Template Variables**:
   - Ensure `{{ .Token }}` and `{{ .ConfirmationURL }}` are present
   - Don't add spaces inside `{{ }}`

### Deliverability Issues (Spam)

To improve email deliverability:

1. **Set Up SPF Record**:
   - Add to your DNS (herdtrackr.co.za)
   - Example: `v=spf1 include:_spf.afrihost.com ~all`

2. **Set Up DKIM**:
   - Request DKIM keys from Afrihost
   - Add DKIM records to DNS

3. **Set Up DMARC**:
   - Add DMARC policy to DNS
   - Example: `v=DMARC1; p=none; rua=mailto:dmarc@herdtrackr.com`

4. **Warm Up Your Domain**:
   - Start with low volume
   - Gradually increase over days/weeks
   - Avoid sending hundreds of emails immediately

5. **Contact Afrihost**:
   - Ask about email authentication setup
   - Request help with SPF/DKIM/DMARC

## Support Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Supabase SMTP Docs**: https://supabase.com/docs/guides/auth/auth-smtp
- **Afrihost Support**: support@afrihost.com
- **Email Deliverability**: Check with MXToolbox.com

## Brand Assets

Logo location in project:
- `assets/images/herd-logo.png`
- `assets/images/herdtrackr-logo.png`
- `assets/images/splash-logo-all.png`

Use the splash logo (animated version) for best quality.

---

**All templates are production-ready!** Just update the logo URL and upload to Supabase. 🎉
