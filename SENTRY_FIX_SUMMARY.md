# Sentry Integration Fix - Summary

## Problem
Sentry was not logging any events from TestFlight builds.

## Root Causes Found

### 1. Missing `sentry-expo` Package ❌
- You were using `@sentry/react-native` directly
- For Expo projects, `sentry-expo` is required for proper integration
- `sentry-expo` provides:
  - Automatic source map uploading for production builds
  - Better native module integration with Expo
  - Proper configuration for EAS builds

### 2. No Sentry Plugin in app.json ❌
- The Sentry Expo plugin was not configured in `app.json`
- This plugin is essential for:
  - Native code integration during prebuild
  - Automatic source map handling
  - Production build configuration

### 3. Development Mode Disabled Sentry ⚠️
- Sentry was completely disabled in `__DEV__` mode
- This made local testing impossible
- Not a production issue, but prevented debugging

## Changes Made

### 1. Installed `sentry-expo`
```bash
npm install sentry-expo --legacy-peer-deps
```

### 2. Updated `app/services/sentry.ts`
- Changed import from `@sentry/react-native` to `sentry-expo`
- Updated all Sentry calls to use `Sentry.Native.*`
- Enabled debug mode temporarily to verify events are sent
- Removed __DEV__ check that was blocking initialization

**Key changes:**
```typescript
// Before
import * as Sentry from "@sentry/react-native"
Sentry.init({ ... })

// After
import * as Sentry from "sentry-expo"
Sentry.init({ ... })
Sentry.Native.addBreadcrumb({ ... })
```

### 3. Updated `index.tsx`
```typescript
// Before
import * as Sentry from "@sentry/react-native"
const SentryWrappedApp = __DEV__ ? App : Sentry.wrap(App)

// After
import * as Sentry from "sentry-expo"
const SentryWrappedApp = Sentry.Native.wrap(App)
```

### 4. Added Sentry Plugin to `app.json`
```json
{
  "plugins": [
    // ... other plugins
    [
      "sentry-expo",
      {
        "organization": "patrick-sullivan",
        "project": "javascript-react-native"
      }
    ]
  ]
}
```

### 5. Updated `app/screens/SettingsScreen.tsx`
- Added a "Test Sentry" button in the DEBUG & TESTING section
- This button sends test events to verify Sentry is working
- Updated to use `Sentry.Native.*` API

### 6. Ran `npx expo prebuild --clean`
- Applied the Sentry plugin to native code
- Regenerated iOS and Android projects with Sentry integration

## Testing Locally

1. **Start the app**: `npx expo run:ios`
2. **Navigate to Settings** (bottom tab)
3. **Scroll to "DEBUG & TESTING"** section
4. **Tap "Test Sentry"** button
5. **Check console** for:
   ```
   [Sentry] Initializing with DSN: https://364ccaa7eef56c43b13c24596e75dd66@...
   [Sentry] Initialized successfully
   [DEBUG] Testing Sentry integration...
   [DEBUG] Test error captured and sent to Sentry
   ```
6. **Check Sentry dashboard** at https://sentry.io/ for the test event

## Next Steps for Production

### 1. Configure Sentry Auth Token for EAS
To enable source map uploads in production builds, add a Sentry auth token:

1. Create a Sentry auth token:
   - Go to https://sentry.io/settings/account/api/auth-tokens/
   - Create a token with "project:releases" and "org:read" scopes

2. Add to EAS secrets:
   ```bash
   eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "your-auth-token-here"
   ```

3. The `sentry-expo` plugin will automatically use this token to upload source maps during builds

### 2. Update app.json with Correct Project Info
Verify the organization and project names in the Sentry plugin config match your Sentry account.

### 3. Disable Development Mode Features in Production
In `app/services/sentry.ts`, change:
```typescript
enableInExpoDevelopment: true,  // Currently enabled for testing
debug: true,  // Currently always enabled
```
to:
```typescript
enableInExpoDevelopment: false,  // Disable for production (or remove this line)
debug: __DEV__,  // Only enable in development
```

**Note:** `sentry-expo` disables Sentry in Expo development mode by default. The `enableInExpoDevelopment: true` flag was added to allow local testing.

### 4. Test with a New TestFlight Build
1. Build a new version: `eas build --platform ios --profile production`
2. Submit to TestFlight: `eas submit -p ios`
3. Install on device and trigger some errors
4. Check Sentry dashboard for events

## Configuration Reference

### Current DSN
```
EXPO_PUBLIC_SENTRY_DSN=https://364ccaa7eef56c43b13c24596e75dd66@o270219.ingest.us.sentry.io/4511059299729408
```

### Environment Variables
Set in both `.env` (local) and `eas.json` (production builds)

### Sentry Settings
- **Environment**: Auto-detected (`development` or `production`)
- **Debug Mode**: Currently enabled (should disable in production later)
- **Traces Sample Rate**: 100% in dev, 10% in production
- **Session Tracking**: Enabled with 30-second intervals
- **Performance Tracking**: Enabled with app start and stall tracking

## Verification Checklist

- [x] `sentry-expo` package installed
- [x] Sentry plugin added to `app.json`
- [x] All imports updated to use `sentry-expo`
- [x] All Sentry calls updated to use `Sentry.Native.*`
- [x] Prebuild run to apply changes
- [ ] Local test successful (in progress)
- [ ] New TestFlight build created
- [ ] Events appearing in Sentry dashboard from production builds

## Additional Notes

- **Source Maps**: The `sentry-expo` plugin automatically handles source map uploads during EAS builds
- **Release Tracking**: Sentry will automatically track releases and associate errors with specific app versions
- **Native Crashes**: The native Sentry SDK will also capture native crashes (not just JS errors)
- **Performance Monitoring**: Enabled with 10% sample rate in production

## Resources

- [Sentry Expo Docs](https://docs.sentry.io/platforms/react-native/manual-setup/expo/)
- [EAS Build with Sentry](https://docs.expo.dev/guides/using-sentry/)
