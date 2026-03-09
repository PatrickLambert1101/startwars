# HerdTrackr Complete Deployment Guide

**Step-by-step instructions for deploying to iOS App Store, Google Play Store, and Web**

---

## Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [iOS App Store Deployment](#ios-app-store-deployment)
3. [Google Play Store Deployment](#google-play-store-deployment)
4. [Web Deployment](#web-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites & Setup

### Step 1: Install Required Tools

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install CocoaPods (for iOS)
brew install cocoapods

# Install EAS CLI
npm install -g eas-cli

# Install dependencies
npm install --legacy-peer-deps
```

### Step 2: Login to Expo

```bash
# Login to your Expo account
eas login

# Verify login
eas whoami
```

### Step 3: Initialize EAS Build

```bash
# Initialize EAS in your project (if not already done)
eas build:configure
```

This creates `eas.json` with build profiles.

### Step 4: Configure Environment Variables

Create `.env.production`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your-ios-key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your-android-key
```

**Important:** Never commit this file to git. Add to `.gitignore`.

---

## iOS App Store Deployment

### Step 1: Apple Developer Account Setup

1. Go to [Apple Developer](https://developer.apple.com)
2. Enroll in Apple Developer Program ($99/year)
3. Wait for enrollment approval (1-2 days)

### Step 2: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in details:
   - **Platform:** iOS
   - **Name:** HerdTrackr
   - **Primary Language:** English
   - **Bundle ID:** Create new → `com.yourcompany.herdtrackr`
   - **SKU:** `herdtrackr-ios` (any unique identifier)

### Step 3: Update app.json

```bash
# Open app.json and update:
```

```json
{
  "expo": {
    "name": "HerdTrackr",
    "slug": "herdtrackr",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.herdtrackr",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "HerdTrackr needs camera access to scan animal tags",
        "NSPhotoLibraryUsageDescription": "HerdTrackr needs photo library access to save animal photos"
      }
    }
  }
}
```

### Step 4: Build for iOS

```bash
# First build (production)
eas build --platform ios --profile production
```

**This will:**
- Generate signing certificates automatically
- Build your app on EAS servers
- Take 15-30 minutes

**Watch build progress:**
```bash
eas build:list
```

### Step 5: Fill in App Store Metadata

While build is running, fill in App Store Connect:

1. **App Information:**
   - Category: **Business** (primary), **Productivity** (secondary)
   - Content Rights: Check if you have rights

2. **Pricing and Availability:**
   - Price: **Free** (or set price)
   - Availability: **All countries**

3. **App Privacy:**
   - Click **"Set Up"** under App Privacy
   - Answer questionnaire (data collection practices)

4. **Prepare Screenshots:**
   - iPhone 6.7": 1290 x 2796 pixels (iPhone 15 Pro Max)
   - iPhone 6.5": 1242 x 2688 pixels (iPhone 11 Pro Max)
   - iPad Pro 12.9": 2048 x 2732 pixels

   **Required: At least 3 screenshots per device size**

5. **Create App Icon:**
   - 1024 x 1024 pixels
   - No transparency
   - No rounded corners (Apple adds them)

### Step 6: Submit Build to App Store

```bash
# Once build completes, submit to App Store
eas submit --platform ios

# Or manually:
# 1. Go to App Store Connect
# 2. Select your app
# 3. Under "Build", click "+" and select the build
```

### Step 7: Fill in Version Information

In App Store Connect → **"Version 1.0.0"**:

1. **Screenshots:** Upload prepared screenshots
2. **Promotional Text:** "Manage your cattle herd with ease"
3. **Description:**
   ```
   HerdTrackr is the ultimate cattle management app for ranchers and farmers. Track your herd's health, weight, breeding, and more - all offline-first.

   Features:
   • Offline-first: Works without internet
   • Health tracking: Record vaccines, treatments, and observations
   • Weight tracking: Monitor growth with charts and trends
   • Breeding records: Track breeding history and calving dates
   • Batch processing: Scan and process multiple animals in Chute mode
   • Treatment protocols: Create and apply vaccine schedules
   • Reports: Generate insights on your herd

   Perfect for cattle ranchers, dairy farmers, and livestock managers.
   ```

4. **Keywords:** `cattle,livestock,farm,ranch,herd,management,farming,agriculture,beef,dairy`
5. **Support URL:** Your website or support email
6. **Marketing URL:** (optional)

### Step 8: Submit for Review

1. Click **"Add for Review"**
2. Fill in **Export Compliance** (if asked, select "No" for encryption)
3. Click **"Submit for Review"**

**Review time:** 1-3 days typically

---

## Google Play Store Deployment

### Step 1: Google Play Console Setup

1. Go to [Google Play Console](https://play.google.com/console)
2. Create Developer Account ($25 one-time fee)
3. Fill in account details and pay

### Step 2: Create App in Play Console

1. Click **"Create app"**
2. Fill in details:
   - **App name:** HerdTrackr
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
   - Accept declarations

3. Click **"Create app"**

### Step 3: Update app.json

```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.herdtrackr",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### Step 4: Build for Android

```bash
# Production build (generates .aab file)
eas build --platform android --profile production
```

**This will:**
- Generate signing keystore automatically
- Build Android App Bundle (.aab)
- Take 10-20 minutes

### Step 5: Set Up Store Listing

While build is running, fill in Play Console:

1. **Main store listing:**
   - **App name:** HerdTrackr
   - **Short description** (80 chars):
     ```
     Offline-first cattle management. Track health, weight, breeding & more.
     ```

   - **Full description** (4000 chars):
     ```
     HerdTrackr is the ultimate cattle management app for ranchers and farmers. Manage your entire herd from your phone - even without internet.

     OFFLINE-FIRST
     All your data is stored locally and syncs when you have connection. Never lose access to critical herd information.

     HEALTH TRACKING
     Record vaccines, treatments, and health observations. Track withdrawal periods and ensure compliance.

     WEIGHT TRACKING
     Monitor your herd's growth with weight records and trend charts. Identify animals that need attention.

     BREEDING RECORDS
     Track breeding history, calving dates, and breeding efficiency. Plan your herd's future.

     CHUTE MODE
     Batch process multiple animals quickly. Scan, weigh, and vaccinate your entire herd efficiently.

     TREATMENT PROTOCOLS
     Create vaccine schedules and apply them to groups of animals. Never miss a booster shot.

     REPORTS & INSIGHTS
     Generate reports on herd health, growth rates, and breeding performance.

     Perfect for:
     • Cattle ranchers
     • Dairy farmers
     • Livestock managers
     • Agricultural operations

     Download HerdTrackr today and take control of your herd management!
     ```

2. **App icon:** 512 x 512 pixels (PNG, 32-bit with alpha)

3. **Feature graphic:** 1024 x 500 pixels (JPG or PNG, no transparency)

4. **Screenshots:**
   - Phone: At least 2 (1080 x 1920 minimum)
   - 7" Tablet: At least 2 (1080 x 1920 minimum)
   - 10" Tablet: At least 2 (1920 x 1080 minimum)

### Step 6: Fill in App Content

1. **App access:**
   - Select **"All functionality is available without restrictions"**
   - (Or describe login requirements if you have authentication)

2. **Ads:**
   - Select **"No, my app does not contain ads"** (or "Yes" if using ads)

3. **Content rating:**
   - Click **"Start questionnaire"**
   - Category: **Utility, Productivity, Communication, or Other**
   - Answer questions honestly
   - Typical result: **"Everyone"** or **"PEGI 3"**

4. **Target audience:**
   - Age groups: **18+** (or adjust for your target market)

5. **News app:** No

6. **COVID-19 contact tracing:** No

7. **Data safety:**
   - Click **"Start"**
   - Answer questions about data collection:
     - Do you collect location? (if using GPS for pasture mapping)
     - Do you collect personal info? (if using authentication)
     - Do you share data with third parties? (Supabase, RevenueCat)
   - Be thorough - this is reviewed carefully

8. **Government apps:** No

### Step 7: Select App Category and Tags

1. **App category:** Business or Productivity
2. **Tags:** livestock, farming, agriculture, cattle

### Step 8: Set Up Pricing and Distribution

1. **Countries:** Select all countries (or specific ones)
2. **Pricing:** Free
3. **Distributed on Google Play for Chromebooks:** Yes (optional)

### Step 9: Create Release

1. Go to **"Production"** → **"Create new release"**
2. Click **"Choose signing key"** → **"Use Google-generated key"** (recommended)
3. Upload your `.aab` file:

```bash
# After build completes, submit to Play Store
eas submit --platform android

# Or manually download from EAS dashboard and upload
```

4. **Release name:** `1.0.0` (matches version in app.json)
5. **Release notes:**
   ```
   Initial release of HerdTrackr!

   Features:
   • Offline-first cattle management
   • Health and weight tracking
   • Breeding records
   • Treatment protocols
   • Batch processing in Chute mode
   • Comprehensive reports
   ```

6. Click **"Save"** → **"Review release"**

### Step 10: Review and Rollout

1. Review all information
2. Click **"Start rollout to Production"**
3. Confirm

**Review time:** Few hours to 7 days (usually 1-2 days)

---

## Web Deployment

HerdTrackr can be deployed as a Progressive Web App (PWA) to work in browsers.

### Option 1: Vercel (Recommended - Easiest)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Build Web Version

```bash
# Install web dependencies
npx expo install react-dom react-native-web

# Export static site
npx expo export:web
```

This creates a `web-build` folder with your static site.

#### Step 3: Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy (from project root)
vercel --prod

# Follow prompts:
# - Set up and deploy: Yes
# - Project name: herdtrackr
# - Directory: ./web-build
```

Your app will be live at: `https://herdtrackr.vercel.app`

#### Step 4: Set Up Custom Domain (Optional)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **"Settings"** → **"Domains"**
4. Add your domain (e.g., `app.herdtrackr.com`)
5. Update DNS records as instructed

---

### Option 2: Netlify

#### Step 1: Build Web Version

```bash
npx expo export:web
```

#### Step 2: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 3: Deploy

```bash
# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=web-build

# Follow prompts to create new site
```

Your app will be live at: `https://your-site-name.netlify.app`

---

### Option 3: Self-Hosted (nginx)

#### Step 1: Build Web Version

```bash
npx expo export:web
```

#### Step 2: Configure nginx

Create `/etc/nginx/sites-available/herdtrackr`:

```nginx
server {
    listen 80;
    server_name app.herdtrackr.com;

    root /var/www/herdtrackr/web-build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Step 3: Deploy Files

```bash
# Copy web-build to server
scp -r web-build/* user@your-server:/var/www/herdtrackr/web-build/

# Enable site
sudo ln -s /etc/nginx/sites-available/herdtrackr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 4: Set Up SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d app.herdtrackr.com
```

---

## Automated Release Script

### Step 1: Create Release Script

Save this as `scripts/release.sh`:

```bash
#!/bin/bash

# HerdTrackr Release Script
# Usage: ./scripts/release.sh [version]

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 1.0.1"
  exit 1
fi

echo "🚀 Releasing HerdTrackr v$VERSION"

# Update version in app.json
npx json -I -f app.json -e "this.expo.version='$VERSION'"

# Commit version bump
git add app.json
git commit -m "chore: bump version to $VERSION"
git tag "v$VERSION"
git push && git push --tags

# Build both platforms
echo "📱 Building iOS..."
eas build --platform ios --profile production --non-interactive

echo "🤖 Building Android..."
eas build --platform android --profile production --non-interactive

echo "🌐 Building Web..."
npx expo export:web

echo "✅ Builds queued!"
echo "📦 Check status with: eas build:list"
echo "📤 After builds complete, submit with: eas submit --platform all"
```

### Step 2: Make Executable

```bash
chmod +x scripts/release.sh
```

### Step 3: Create Web Deploy Script

Save as `scripts/deploy-web.sh`:

```bash
#!/bin/bash

echo "🌐 Deploying HerdTrackr Web..."

# Build web version
npx expo export:web

# Deploy to Vercel
vercel --prod --yes

echo "✅ Web deployment complete!"
```

Make executable:
```bash
chmod +x scripts/deploy-web.sh
```

---

## Complete Release Workflow

### First-Time Release (1.0.0)

```bash
# 1. Prepare release
./scripts/release.sh 1.0.0

# 2. Wait for builds to complete (check with)
eas build:list

# 3. Submit to both stores
eas submit --platform ios
eas submit --platform android

# 4. Deploy web
./scripts/deploy-web.sh

# 5. Monitor submissions
# - iOS: App Store Connect
# - Android: Play Console
```

### Update Release (1.0.1, 1.0.2, etc.)

```bash
# 1. Make your code changes and test

# 2. Run release script
./scripts/release.sh 1.0.1

# 3. Wait for builds, then submit
eas submit --platform all

# 4. Deploy web
./scripts/deploy-web.sh

# 5. Update release notes in stores
```

### Hotfix Release (Emergency)

```bash
# For JavaScript-only changes (no native code), use OTA updates:
eas update --channel production --message "Critical bug fix"

# Users get update automatically within minutes
# No store review required!
```

---

## Troubleshooting

### Build Fails on EAS

```bash
# Clear cache and retry
eas build --clear-cache --platform ios
eas build --clear-cache --platform android

# View detailed logs
eas build:list
eas build:view [build-id]
```

### iOS Build Issues

**"No valid code signing certificate":**
```bash
# Regenerate credentials
eas credentials
# Select iOS → Production → Remove all → Build again
```

**"Bundle identifier already exists":**
- Change `bundleIdentifier` in `app.json` to something unique
- Must match what you created in App Store Connect

### Android Build Issues

**"Keystore credentials not found":**
```bash
# Regenerate keystore
eas credentials
# Select Android → Production → Remove all → Build again
```

### App Store Rejection

**Common reasons:**
1. **Missing privacy policy** → Add link in app and App Store Connect
2. **Crashes on launch** → Test on physical device first
3. **Incomplete metadata** → Fill all required fields in App Store Connect
4. **Guideline 4.3 (spam)** → Make your app unique and valuable

### Play Store Rejection

**Common reasons:**
1. **Data safety incomplete** → Be thorough in data safety section
2. **Missing privacy policy** → Add to app and Play Console
3. **Inappropriate content rating** → Review content rating questionnaire

### Web Deployment Issues

**App won't load:**
```bash
# Check build output
npx expo export:web

# Test locally first
npx serve web-build
# Visit http://localhost:3000
```

**Service worker issues:**
```bash
# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

---

## Checklist Before Release

### Pre-Release Testing

- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test in web browser (Chrome, Safari, Firefox)
- [ ] Test offline functionality
- [ ] Test data sync (online → offline → online)
- [ ] Test in-app purchases / subscriptions
- [ ] Test all CRUD operations (create, read, update, delete)
- [ ] Test export/import functionality
- [ ] Verify app loads quickly
- [ ] Check for console errors

### Assets & Metadata

- [ ] App icon (1024x1024)
- [ ] iOS screenshots (all required sizes)
- [ ] Android screenshots (all required sizes)
- [ ] Feature graphic (Android, 1024x500)
- [ ] App description written
- [ ] Keywords researched
- [ ] Privacy policy URL ready
- [ ] Support email set up

### Legal & Compliance

- [ ] Privacy policy created and published
- [ ] Terms of service created (if needed)
- [ ] Data collection practices documented
- [ ] Content rating completed
- [ ] Export compliance answered (iOS)

### Technical

- [ ] Version number updated in app.json
- [ ] Environment variables configured
- [ ] Analytics set up (optional)
- [ ] Crash reporting enabled (Sentry)
- [ ] All API keys valid and production-ready
- [ ] Database migrations tested
- [ ] Supabase RLS policies configured

---

## Post-Release

### Monitor App Performance

1. **iOS:**
   - App Store Connect → Analytics
   - Xcode Organizer → Crashes & Energy

2. **Android:**
   - Play Console → Vitals
   - Play Console → Crashes & ANRs

3. **Web:**
   - Vercel/Netlify analytics
   - Google Analytics (if installed)

### Respond to Reviews

- Monitor reviews daily for first week
- Respond to negative reviews within 24 hours
- Thank users for positive reviews
- Use feedback to prioritize features

### Track Key Metrics

- Downloads / Installs
- Daily active users (DAU)
- Retention rate (Day 1, Day 7, Day 30)
- Crash rate (should be <1%)
- Conversion rate (free → paid)
- Average session duration

---

## Quick Reference Commands

```bash
# Login to Expo
eas login

# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production

# Build both
eas build --platform all --profile production

# Submit iOS
eas submit --platform ios

# Submit Android
eas submit --platform android

# Submit both
eas submit --platform all

# Check build status
eas build:list

# OTA update (JS only)
eas update --channel production --message "Bug fixes"

# Deploy web (Vercel)
npx expo export:web && vercel --prod

# View credentials
eas credentials

# Clear build cache
eas build --clear-cache
```

---

## Resources

- [Expo EAS Documentation](https://docs.expo.dev/eas/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)

---

## Support

If you encounter issues:

1. Check EAS build logs: `eas build:view [build-id]`
2. Check Expo forums: [forums.expo.dev](https://forums.expo.dev)
3. Check troubleshooting section above
4. File issue on GitHub (if applicable)

---

**You're ready to deploy HerdTrackr! 🚀**

Start with: `./scripts/release.sh 1.0.0`
