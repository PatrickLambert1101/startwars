# HerdTrackr Deployment Guide

Complete guide for deploying HerdTrackr to iOS App Store and Google Play Store.

## Prerequisites

```bash
# Install required tools
brew install cocoapods
npm install -g eas-cli

# Login to Expo
eas login

# Configure your accounts
eas whoami
```

## Project Setup

### 1. Configure app.json

Update `app.json` with your app details:

```json
{
  "expo": {
    "name": "HerdTrackr",
    "slug": "herdtrackr",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.herdtrackr",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.herdtrackr",
      "versionCode": 1
    }
  }
}
```

### 2. Initialize EAS Build

```bash
# Initialize EAS in your project
eas build:configure

# This creates eas.json with build profiles
```

## iOS Deployment

### Setup Apple Developer Account

1. Go to [Apple Developer](https://developer.apple.com)
2. Enroll in Apple Developer Program ($99/year)
3. Create App ID: `com.yourcompany.herdtrackr`
4. EAS will handle certificates automatically

### Build for iOS

```bash
# Production build for App Store
eas build --platform ios --profile production

# TestFlight build (internal testing)
eas build --platform ios --profile preview

# Development build (local testing)
eas build --platform ios --profile development --local
```

### Submit to App Store

```bash
# Automatic submission
eas submit --platform ios

# Or manually via App Store Connect:
# 1. Download .ipa from EAS dashboard
# 2. Upload via Transporter app
# 3. Submit for review in App Store Connect
```

### App Store Configuration

1. **App Store Connect Setup**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create new app
   - Fill in metadata:
     - Name: HerdTrackr
     - Subtitle: Cattle Management Made Simple
     - Category: Business / Productivity
     - Description: (see MARKETING.md)
     - Keywords: cattle, livestock, farm, ranch, herd, management
     - Screenshots: (1284x2778 for iPhone, 2048x2732 for iPad)

2. **Pricing & Availability**
   - Set price tier (Free or Paid)
   - Select countries
   - Set availability date

3. **Submit for Review**
   ```bash
   # After successful build
   eas submit -p ios
   ```

## Android Deployment

### Setup Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create Developer Account ($25 one-time fee)
3. Create new app
4. Fill in app details

### Build for Android

```bash
# Production build for Play Store
eas build --platform android --profile production

# Internal testing build
eas build --platform android --profile preview

# Development build (local testing)
eas build --platform android --profile development --local
```

### Generate Keystore (First Time Only)

EAS handles this automatically, but if needed manually:

```bash
# Generate keystore
keytool -genkey -v -keystore herdtrackr.keystore \
  -alias herdtrackr -keyalg RSA -keysize 2048 -validity 10000

# Store credentials in eas.json
```

### Submit to Play Store

```bash
# Automatic submission
eas submit --platform android

# Or manually:
# 1. Download .aab from EAS dashboard
# 2. Upload to Play Console → Production → Create release
```

### Play Store Configuration

1. **Store Listing**
   - App name: HerdTrackr
   - Short description: (50 chars)
   - Full description: (see MARKETING.md)
   - Screenshots: (1080x1920 minimum, 16:9 ratio)
   - Feature graphic: 1024x500
   - App icon: 512x512

2. **Content Rating**
   - Complete questionnaire
   - Should be rated "Everyone"

3. **Pricing & Distribution**
   - Set price (Free or Paid)
   - Select countries
   - Content rating
   - Target audience

## Build Profiles (eas.json)

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-production-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-production-key"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./play-store-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Environment Variables

Create `.env.production`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your-ios-key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your-android-key
```

## Quick Deploy Commands

```bash
# Build both platforms
eas build --platform all --profile production

# Submit both platforms
eas submit --platform all

# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Download build artifacts
eas build:download [build-id]
```

## Automated Release Script

Create `scripts/release.sh`:

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

echo "✅ Builds queued! Check status with: eas build:list"
echo "📦 After builds complete, submit with: eas submit --platform all"
```

Make it executable:
```bash
chmod +x scripts/release.sh
```

## Update Workflow

### Minor Updates (1.0.0 → 1.0.1)

```bash
# Run release script
./scripts/release.sh 1.0.1

# Wait for builds to complete
# Submit to stores
eas submit --platform all
```

### Major Updates (1.0.0 → 2.0.0)

Same as above, but also:
1. Update app screenshots
2. Update store descriptions
3. Prepare release notes
4. Notify users via in-app messaging

## Over-the-Air (OTA) Updates

For JavaScript changes only (no native code):

```bash
# Publish update to production channel
eas update --channel production --message "Bug fixes and improvements"

# Publish to preview channel (beta testers)
eas update --channel preview --message "Testing new features"

# View update status
eas update:list
```

## Testing Before Release

```bash
# Run tests
npm test

# Type check
npm run tsc

# Lint
npm run lint

# Build and test locally
eas build --platform ios --profile preview --local
# Install on device and test

# TestFlight (iOS)
eas build --platform ios --profile preview
eas submit -p ios --latest

# Internal Testing (Android)
eas build --platform android --profile preview
eas submit -p android --latest --track internal
```

## Monitoring & Analytics

1. **Setup Sentry** (Error Tracking)
   ```bash
   npm install @sentry/react-native
   ```

2. **Setup Analytics**
   - RevenueCat for subscriptions (already configured)
   - Google Analytics / Firebase
   - App Store Analytics
   - Play Console Analytics

3. **Monitor Crashes**
   - Xcode Organizer (iOS)
   - Play Console Vitals (Android)
   - Sentry Dashboard

## Troubleshooting

### Build Fails

```bash
# Clear EAS cache
eas build --clear-cache

# Check build logs
eas build:view [build-id]

# Local build for debugging
eas build --platform ios --profile development --local
```

### Submission Rejected

**Common Issues:**
- Missing privacy policy → Add to app
- Missing app privacy details → Update in App Store Connect
- Crashes on launch → Test with TestFlight first
- Guideline violations → Review App Store Review Guidelines

### OTA Updates Not Working

```bash
# Check update configuration
eas update:view

# Republish
eas update --channel production --message "Fix update delivery"
```

## Checklist Before Release

- [ ] Update version number in app.json
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Update screenshots
- [ ] Update store descriptions
- [ ] Prepare release notes
- [ ] Test in-app purchases
- [ ] Test offline functionality
- [ ] Test data sync
- [ ] Check app size (<100MB recommended)
- [ ] Review privacy policy
- [ ] Test on different screen sizes
- [ ] Enable production analytics
- [ ] Set up crash reporting

## Support & Maintenance

### Responding to Reviews

Monitor and respond to user reviews:
- App Store Connect → My Apps → Ratings and Reviews
- Play Console → User Feedback → Reviews

### Version Support

Support at least the last 2 major versions:
- Maintain backwards compatibility
- Provide upgrade paths for database migrations
- Test updates on older versions

## Resources

- [Expo EAS Documentation](https://docs.expo.dev/eas/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Console Help](https://support.google.com/googleplay/android-developer/)
- [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)

---

**Next Steps:**
1. Run `eas build:configure` to get started
2. Complete Apple Developer enrollment
3. Complete Google Play Developer enrollment
4. Run first build: `./scripts/release.sh 1.0.0`
