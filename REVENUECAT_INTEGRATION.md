# RevenueCat Integration Guide

## Overview

HerdTrackr now has full RevenueCat integration for in-app subscriptions! This document explains the implementation and how to use it.

## What's Implemented

### 1. **RevenueCat SDK** ✅
- Installed `react-native-purchases` (SDK) and `react-native-purchases-ui` (Paywall & Customer Center UI)
- Configured with test API key: `test_HiAakRXKRndBIBZdYHlGVISoCmX`
- Entitlement ID: `Herdtrackr Pro`

### 2. **Subscription Context** ✅
- Location: `app/context/SubscriptionContext.tsx`
- Provides subscription state to entire app
- Features:
  - `isPro` - Boolean indicating if user has Pro subscription
  - `plan` - Current plan tier ("free" or "pro")
  - `packages` - Available subscription packages from RevenueCat
  - `hasFeature()` - Check if specific premium features are unlocked
  - `purchasePackage()` - Purchase a subscription
  - `restorePurchases()` - Restore previous purchases

### 3. **Paywall Screen** ✅
- Location: `app/screens/PaywallScreen.tsx`
- Uses RevenueCat's native Paywall UI component
- Automatically displays:
  - Available subscription plans (Monthly, Yearly)
  - Pricing and features
  - Purchase buttons
  - Terms of service links
- Handles all purchase flows automatically
- Shows success message on purchase completion

### 4. **Customer Center Screen** ✅
- Location: `app/screens/CustomerCenterScreen.tsx`
- Uses RevenueCat's native Customer Center UI
- Allows Pro users to:
  - View subscription status
  - Manage subscription (cancel, change plan)
  - Restore purchases
  - View billing history
- Non-Pro users are redirected to Paywall

### 5. **Settings Integration** ✅
- Location: `app/screens/SettingsScreen.tsx`
- New "SUBSCRIPTION" section showing:
  - Current plan (Free or HerdTrackr Pro)
  - Subscription status (Active/Limited features)
  - PRO badge for subscribers
  - "Upgrade to Pro" button (Free users)
  - "Manage Subscription" button (Pro users → Customer Center)

### 6. **Navigation Routes** ✅
- Added to `app/navigators/navigationTypes.ts` and `AppNavigator.tsx`:
  - `/Paywall` - Show subscription plans
  - `/CustomerCenter` - Manage existing subscription

## How It Works

### User Flow

#### Free User → Pro User
1. User navigates to Settings
2. Sees "Free Plan" with "Upgrade to Pro" button
3. Taps "Upgrade to Pro" → Opens Paywall screen
4. Paywall shows Monthly and Yearly options
5. User selects plan and completes purchase
6. Success! User is now Pro
7. Settings now shows "HerdTrackr Pro" with "Manage Subscription" button

#### Pro User Management
1. Pro user navigates to Settings
2. Sees "HerdTrackr Pro" with PRO badge
3. Taps "Manage Subscription" → Opens Customer Center
4. Can view subscription details, change plan, or cancel

### Feature Gating

Use the `useSubscription()` hook to check if features are unlocked:

```typescript
import { useSubscription } from "@/context/SubscriptionContext"

const MyComponent = () => {
  const { isPro, hasFeature } = useSubscription()

  // Simple check
  if (!isPro) {
    return <UpgradePrompt />
  }

  // Feature-specific check
  if (!hasFeature("pastures")) {
    return <UpgradePrompt feature="pastures" />
  }

  return <PremiumFeature />
}
```

Currently defined premium features:
- `"vaccines"` - Vaccine/health tracking
- `"pastures"` - Pasture management

## RevenueCat Dashboard Setup

To complete the integration, you need to configure products in RevenueCat:

### 1. Create Products in App Store Connect / Google Play Console

**iOS (App Store Connect):**
- Product ID: `herdtrackr_pro_monthly`
- Type: Auto-renewable subscription
- Duration: 1 month

- Product ID: `herdtrackr_pro_yearly`
- Type: Auto-renewable subscription
- Duration: 1 year

**Android (Google Play Console):**
- Product ID: `herdtrackr_pro_monthly`
- Type: Subscription
- Duration: Monthly

- Product ID: `herdtrackr_pro_yearly`
- Type: Subscription
- Duration: Yearly

### 2. Configure RevenueCat Dashboard

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Add your iOS and Android apps
3. Create products:
   - Link the product IDs from App Store/Play Store
4. Create an Offering (e.g., "Default Offering")
5. Add packages to the offering:
   - **Monthly**: Link to `herdtrackr_pro_monthly`
   - **Yearly**: Link to `herdtrackr_pro_yearly`
6. Create Entitlement: `Herdtrackr Pro`
7. Attach products to the entitlement

### 3. Configure Paywall (Optional)

RevenueCat has a visual paywall builder:
1. Go to RevenueCat Dashboard → Paywalls
2. Create a new paywall template
3. Customize design, copy, and features
4. The app will automatically use your custom paywall!

## Testing

### Test with RevenueCat Sandbox

1. **iOS Testing:**
   - Create sandbox test account in App Store Connect
   - Sign out of App Store on device
   - Run the app and make a purchase
   - Use sandbox account when prompted

2. **Android Testing:**
   - Add your Google account to License Testing in Play Console
   - Install the app and make a purchase
   - Charges will be simulated (not real)

3. **RevenueCat Test Mode:**
   - The current API key (`test_HiAakRXKRndBIBZdYHlGVISoCmX`) is in test mode
   - All purchases are free and won't charge users
   - Perfect for development!

### Manual Testing Checklist

- [ ] App loads and initializes RevenueCat
- [ ] Settings shows "Free Plan" for new users
- [ ] Tapping "Upgrade to Pro" opens Paywall
- [ ] Paywall displays Monthly and Yearly options
- [ ] Purchase flow completes successfully
- [ ] After purchase, Settings shows "HerdTrackr Pro"
- [ ] Pro badge appears in Settings
- [ ] "Manage Subscription" button opens Customer Center
- [ ] Customer Center shows subscription details
- [ ] Restore purchases works correctly

## Code Structure

```
app/
├── context/
│   └── SubscriptionContext.tsx        # Subscription state management
├── screens/
│   ├── PaywallScreen.tsx              # Subscription purchase screen
│   ├── CustomerCenterScreen.tsx       # Subscription management screen
│   └── SettingsScreen.tsx             # Updated with subscription UI
└── navigators/
    ├── AppNavigator.tsx               # Added Paywall & CustomerCenter routes
    └── navigationTypes.ts             # Added route types
```

## Environment Variables

No environment variables needed! The API key is hardcoded in `SubscriptionContext.tsx`:

```typescript
const REVENUECAT_API_KEY = "test_HiAakRXKRndBIBZdYHlGVISoCmX"
const PRO_ENTITLEMENT_ID = "Herdtrackr Pro"
```

For production, you may want to move these to `.env`:
```bash
EXPO_PUBLIC_REVENUECAT_API_KEY=your_production_key
```

## Premium Features

Currently, two features are gated behind Pro:
1. **Pastures** - Pasture management
2. **Vaccines** - Advanced health/vaccine tracking

To add more premium features:
1. Add to the `PremiumFeature` type in `SubscriptionContext.tsx`:
   ```typescript
   export type PremiumFeature = "vaccines" | "pastures" | "reports"
   ```
2. Add to `PREMIUM_FEATURES` array:
   ```typescript
   const PREMIUM_FEATURES: PremiumFeature[] = ["vaccines", "pastures", "reports"]
   ```
3. Use `hasFeature()` to check access

## Next Steps

1. **Configure Products in App Stores** (see RevenueCat Dashboard Setup above)
2. **Design Custom Paywall** (optional - use RevenueCat's paywall builder)
3. **Test Purchases** (use sandbox accounts)
4. **Replace Test Key** with production key when ready to launch
5. **Submit App for Review** (include test account for reviewers)

## Support & Resources

- [RevenueCat Docs](https://www.revenuecat.com/docs/)
- [React Native SDK](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
- [Paywalls Guide](https://www.revenuecat.com/docs/tools/paywalls)
- [Customer Center Guide](https://www.revenuecat.com/docs/tools/customer-center)
- [Testing Guide](https://www.revenuecat.com/docs/test-and-launch/testing)

## Troubleshooting

### "No packages available"
- Check RevenueCat Dashboard → Offerings → Make sure Default Offering has packages
- Verify product IDs match between App Store/Play Console and RevenueCat

### "Purchase failed"
- Make sure you're using sandbox test accounts
- Check RevenueCat logs in Dashboard → Customer History
- Verify entitlement is properly configured

### "Restore purchases doesn't work"
- User must be signed in with same App Store/Play account as original purchase
- Check RevenueCat Dashboard for user's purchase history

---

**Integration Status:** ✅ Complete and ready to test!

**Author:** Claude Code
**Date:** March 12, 2026
