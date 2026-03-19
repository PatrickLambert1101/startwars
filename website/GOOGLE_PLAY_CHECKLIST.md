# ✅ Google Play Submission Checklist

This checklist covers all the requirements for submitting HerdTrackr to Google Play Store.

## Required Pages (All Complete! ✅)

### 1. Privacy Policy ✅
- **File:** `privacy-policy.html`
- **Status:** Complete and comprehensive
- **Covers:** Camera permissions, location data, data collection, encryption, user rights
- **URL for Google Play:** `https://herdtrackr.co.za/privacy-policy.html`

### 2. Data Deletion Request ✅
- **File:** `data-deletion.html`
- **Status:** Complete with multiple deletion methods
- **Covers:** In-app deletion, email requests, deletion form, timeline, what gets deleted
- **URL for Google Play:** `https://herdtrackr.co.za/data-deletion.html`

### 3. Terms of Service ✅
- **File:** `terms-of-service.html`
- **Status:** Complete with subscription terms, liability, compliance
- **URL for users:** `https://herdtrackr.co.za/terms-of-service.html`

## Website Files Ready to Upload

```
website/
├── index.html                    ✅ Landing page
├── privacy-policy.html           ✅ Required for Google Play
├── terms-of-service.html         ✅ Terms of service
├── data-deletion.html            ✅ Required for Google Play
└── assets/images/
    └── herdtrackr-logo.png       ✅ Logo (fixed for dark mode)
```

## Step-by-Step Google Play Setup

### Step 1: Upload Website to Afrihost

```bash
# Use FTP/SFTP or Afrihost File Manager
# Upload all files from website/ folder to public_html/
```

See `website/README.md` for detailed upload instructions.

### Step 2: Verify URLs Work

Test these URLs in your browser:
- ✅ https://herdtrackr.co.za/
- ✅ https://herdtrackr.co.za/privacy-policy.html
- ✅ https://herdtrackr.co.za/data-deletion.html
- ✅ https://herdtrackr.co.za/terms-of-service.html

### Step 3: Add Privacy Policy to Google Play Console

1. Go to: https://play.google.com/console
2. Select **HerdTrackr** app
3. Navigate to: **Policy** → **App content**
4. Click **Privacy policy** section
5. Click **Start** or **Manage**
6. Enter URL: `https://herdtrackr.co.za/privacy-policy.html`
7. Click **Save**

### Step 4: Complete Data Safety Section

1. In **App content**, find **Data safety**
2. Click **Start** or **Manage**
3. Answer questions about data collection:

#### Data Collection Questions:

**Does your app collect or share user data?**
- ✅ Yes

**Data Types Collected:**
- ✅ Personal info (Name, Email)
- ✅ Photos and videos (Camera for ear tag scanning, animal photos)
- ✅ Location (Approximate location for pasture tracking)
- ✅ App activity (Livestock records, health data, weight records)

**Is data encrypted in transit?**
- ✅ Yes (HTTPS/TLS encryption via Supabase)

**Can users request data deletion?**
- ✅ Yes
- Deletion URL: `https://herdtrackr.co.za/data-deletion.html`

**Data usage purposes:**
- ✅ App functionality (core livestock management)
- ✅ Analytics (usage tracking)
- ✅ Account management

### Step 5: Add App Description & Screenshots

1. Go to **Main store listing**
2. Add app description (can use content from landing page)
3. Upload screenshots (minimum 2 required)
4. Add app icon (1024x1024 PNG)
5. Add feature graphic (1024x500 PNG)

### Step 6: Submit for Review

1. Build and upload your APK/AAB:
   ```bash
   eas build --platform android --profile production
   eas submit --platform android
   ```

2. In Google Play Console:
   - Go to **Production** → **Releases**
   - Click **Create new release**
   - Upload your AAB file
   - Fill in release notes
   - Click **Review release**
   - Click **Start rollout to Production**

## Common Rejection Reasons (Now Fixed! ✅)

### ❌ Missing Privacy Policy
**Status:** ✅ Fixed - Privacy policy page created and comprehensive

### ❌ Camera Permission Not Explained
**Status:** ✅ Fixed - Privacy policy explains camera usage for:
- AI-powered ear tag scanning (OCR)
- Taking animal photos
- Documenting health conditions

### ❌ No Data Deletion Method
**Status:** ✅ Fixed - Data deletion page with 3 methods:
1. In-app deletion (Settings → Delete Account)
2. Email request (privacy@herdtrackr.co.za)
3. Deletion request form

### ❌ Data Not Encrypted
**Status:** ✅ Fixed - Privacy policy confirms:
- HTTPS/TLS encryption for all data in transit
- Supabase bank-level encryption
- Secure authentication protocols

## App Permissions Explained

Your app requests these permissions - make sure they're all explained in the privacy policy:

| Permission | Reason | Covered in Privacy Policy? |
|------------|--------|----------------------------|
| CAMERA | Ear tag scanning, animal photos | ✅ Yes |
| LOCATION | Pasture tracking, GPS tagging | ✅ Yes |
| INTERNET | Cloud sync, data backup | ✅ Yes |
| NETWORK_STATE | Offline detection | ✅ Yes |
| WRITE_EXTERNAL_STORAGE | Photo storage | ✅ Yes |

## Contact Information

Make sure these are consistent everywhere:

- **Email:** info@herdtrackr.co.za
- **Privacy Email:** privacy@herdtrackr.co.za
- **Phone:** +27 12 345 6789
- **Website:** https://herdtrackr.co.za
- **Location:** Johannesburg, South Africa

## Content Rating

Complete the content rating questionnaire:
1. Navigate to: **Policy** → **App content** → **Content rating**
2. Answer questions about your app
3. For HerdTrackr (livestock management):
   - No violence, gambling, drugs, or mature content
   - Likely rating: **Everyone** or **3+**

## Target Audience

Set your target audience:
1. Navigate to: **Policy** → **App content** → **Target audience**
2. Select: **18 and over** (business/farming app)
3. Save

## App Access

If your app requires an account:
1. Navigate to: **Policy** → **App content** → **App access**
2. Provide test account credentials for review team
3. Or enable DEV_SKIP_AUTH for easy testing

## Final Checklist Before Submission

- [ ] Website uploaded to Afrihost
- [ ] Privacy policy URL working
- [ ] Data deletion URL working
- [ ] Privacy policy added to Google Play Console
- [ ] Data safety section completed
- [ ] App description and screenshots added
- [ ] Content rating completed
- [ ] Target audience set
- [ ] AAB/APK built and uploaded
- [ ] Release notes written
- [ ] Clicked "Start rollout to Production"

## After Submission

**Review time:** Usually 2-7 days

**Possible outcomes:**
1. ✅ **Approved** - App goes live!
2. ⚠️ **Changes requested** - Fix issues and resubmit
3. ❌ **Rejected** - Address major issues and resubmit

**If rejected:**
1. Read the rejection email carefully
2. Fix the specific issues mentioned
3. Update app and resubmit
4. Respond to reviewers if needed

## Support Resources

- **Google Play Console:** https://play.google.com/console
- **Policy Center:** https://support.google.com/googleplay/android-developer/topic/9858052
- **Data Safety Form:** https://support.google.com/googleplay/android-developer/answer/10787469
- **Privacy Policy Requirements:** https://support.google.com/googleplay/android-developer/answer/9859455

## Encryption Details for Review Team

If asked about encryption:

**Question:** Is all user data encrypted in transit?
**Answer:** Yes

**Details:**
- All network requests use HTTPS/TLS 1.2+
- Supabase backend enforces SSL connections
- React Native default security enforces encrypted connections
- Local SQLite data protected by OS-level encryption
- Authentication tokens stored in secure storage

## Your URLs for Copy/Paste

```
Privacy Policy:
https://herdtrackr.co.za/privacy-policy.html

Data Deletion:
https://herdtrackr.co.za/data-deletion.html

Website:
https://herdtrackr.co.za

Support Email:
info@herdtrackr.co.za

Privacy Email:
privacy@herdtrackr.co.za
```

---

## 🎉 You're Ready!

All required pages are created and ready. Just:

1. Upload website to Afrihost
2. Add URLs to Google Play Console
3. Submit your app
4. Wait for approval

**Good luck with your submission!** 🚀
