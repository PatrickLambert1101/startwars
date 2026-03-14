# RevenueCat 3-Tier Setup Guide

## Overview

HerdTrackr uses a **3-tier subscription model**:
- **Starter** (Free) - Basic features
- **Farm** - Premium features for individual farmers
- **Commercial** - Full access including team features for larger operations

## Tier Features

### 🆓 Starter (Free)
- Basic animal tracking
- Limited to 10 animals
- Core features only

### 🌾 Farm ($X/month or $Y/year)
- ✅ Unlimited animals
- ✅ Pasture management
- ✅ Vaccine/health tracking
- ❌ Team members
- ❌ Advanced reports

### 🏢 Commercial ($Z/month or $W/year)
- ✅ Everything in Farm
- ✅ Team member management
- ✅ Advanced reports & analytics
- ✅ Priority support

## RevenueCat Dashboard Setup

### Step 1: Create Products in App Stores

#### iOS (App Store Connect)
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select HerdTrackr app
3. Go to **Subscriptions** tab
4. Create **Subscription Group**: "HerdTrackr Subscriptions"
5. Add **4 products**:

   **Farm Plan:**
   - Product ID: `farm_monthly`
   - Duration: 1 month
   - Price: Set your price

   - Product ID: `farm_yearly`
   - Duration: 1 year
   - Price: Set your price

   **Commercial Plan:**
   - Product ID: `commercial_monthly`
   - Duration: 1 month
   - Price: Set your price

   - Product ID: `commercial_yearly`
   - Duration: 1 year
   - Price: Set your price

#### Android (Google Play Console)
1. Go to [Google Play Console](https://play.google.com/console)
2. Select HerdTrackr app
3. **Monetize** → **Subscriptions**
4. Create same 4 products with identical IDs:
   - `farm_monthly`
   - `farm_yearly`
   - `commercial_monthly`
   - `commercial_yearly`

### Step 2: Configure RevenueCat Dashboard

#### 1. Add Your Apps
1. [RevenueCat Dashboard](https://app.revenuecat.com/)
2. **Projects** → Your project
3. **Apps** → Add both:
   - iOS: `com.herdtrackr`
   - Android: `com.herdtrackr`

#### 2. Add Products
1. Go to **Products** tab
2. Add all 4 products for **both platforms** (8 total):

   **iOS Products:**
   - Product ID: `farm_monthly`, App: iOS, Store: App Store
   - Product ID: `farm_yearly`, App: iOS, Store: App Store
   - Product ID: `commercial_monthly`, App: iOS, Store: App Store
   - Product ID: `commercial_yearly`, App: iOS, Store: App Store

   **Android Products:**
   - Product ID: `farm_monthly`, App: Android, Store: Play Store
   - Product ID: `farm_yearly`, App: Android, Store: Play Store
   - Product ID: `commercial_monthly`, App: Android, Store: Play Store
   - Product ID: `commercial_yearly`, App: Android, Store: Play Store

#### 3. Create Entitlements
1. Go to **Entitlements** tab
2. Create **2 entitlements**:

   **Farm Entitlement:**
   - Identifier: `farm` (must match code exactly!)
   - Description: "Farm Plan Features"
   - Click **Save**
   - Click **Attach** → Select `farm_monthly` and `farm_yearly` (both iOS & Android)

   **Commercial Entitlement:**
   - Identifier: `commercial` (must match code exactly!)
   - Description: "Commercial Plan Features"
   - Click **Save**
   - Click **Attach** → Select `commercial_monthly` and `commercial_yearly` (both iOS & Android)

#### 4. Create Offering
1. Go to **Offerings** tab
2. Click **+ New Offering**
3. **Identifier**: `default`
4. **Description**: "HerdTrackr Subscription Plans"
5. Click **Save**

#### 5. Add Packages to Offering
Click on the `default` offering, then add **4 packages**:

**Farm Monthly:**
- Click **+ Add Package**
- Identifier: `farm_monthly`
- Type: **Monthly**
- Product: Select `farm_monthly` (both platforms)
- Save

**Farm Yearly:**
- Click **+ Add Package**
- Identifier: `farm_annual`
- Type: **Annual**
- Product: Select `farm_yearly` (both platforms)
- Save

**Commercial Monthly:**
- Click **+ Add Package**
- Identifier: `commercial_monthly`
- Type: **Monthly**
- Product: Select `commercial_monthly` (both platforms)
- Save

**Commercial Yearly:**
- Click **+ Add Package**
- Identifier: `commercial_annual`
- Type: **Annual**
- Product: Select `commercial_yearly` (both platforms)
- Save

#### 6. Make Default Offering
1. Go back to **Offerings** tab
2. Find your `default` offering
3. Click **⋮** (three dots) → **Make Default**

## RevenueCat Structure

```
Project: HerdTrackr
├── Apps
│   ├── iOS (com.herdtrackr)
│   └── Android (com.herdtrackr)
│
├── Products (8 total)
│   ├── farm_monthly (iOS)
│   ├── farm_monthly (Android)
│   ├── farm_yearly (iOS)
│   ├── farm_yearly (Android)
│   ├── commercial_monthly (iOS)
│   ├── commercial_monthly (Android)
│   ├── commercial_yearly (iOS)
│   └── commercial_yearly (Android)
│
├── Entitlements (2)
│   ├── farm
│   │   ├── farm_monthly (iOS & Android)
│   │   └── farm_yearly (iOS & Android)
│   └── commercial
│       ├── commercial_monthly (iOS & Android)
│       └── commercial_yearly (iOS & Android)
│
└── Offerings
    └── default ⭐ (default offering)
        ├── farm_monthly (Monthly package)
        ├── farm_annual (Annual package)
        ├── commercial_monthly (Monthly package)
        └── commercial_annual (Annual package)
```

## App Code (Already Configured!)

The app is already set up to handle 3 tiers:

```typescript
// SubscriptionContext.tsx
export type PlanTier = "starter" | "farm" | "commercial"

// Entitlement IDs (must match RevenueCat exactly!)
const FARM_ENTITLEMENT_ID = "farm"
const COMMERCIAL_ENTITLEMENT_ID = "commercial"

// Features by tier
const TIER_FEATURES = {
  starter: [],
  farm: ["vaccines", "pastures", "unlimited_animals"],
  commercial: ["vaccines", "pastures", "unlimited_animals", "team_members", "advanced_reports"],
}
```

## Usage in Code

```typescript
import { useSubscription } from "@/context/SubscriptionContext"

const { plan, isPremium, isFarm, isCommercial, hasFeature } = useSubscription()

// Check tier
if (plan === "starter") {
  // Show upgrade prompt
}

// Check for premium (Farm OR Commercial)
if (isPremium) {
  // Allow access
}

// Check for specific features
if (hasFeature("team_members")) {
  // Only Commercial users see this
}
```

## Paywall Display

The app uses RevenueCat's native Paywall UI which will automatically display all packages from your default offering:

- Users see Farm and Commercial plans
- Monthly and Yearly options for each
- Native purchase flow
- Automatic subscription management

## Testing

### With Test API Key (Current)
- Using: `test_HiAakRXKRndBIBZdYHlGVISoCmX`
- All purchases are simulated (free)
- No real money charged
- Perfect for development

### With Production API Key
- Replace test key with production key
- Real purchases through App Store/Play Store
- Real money charged
- Use sandbox accounts for testing

## Customer Center

Premium users (Farm & Commercial) can manage their subscription:
- Settings → Subscription section → "Manage Subscription"
- Opens RevenueCat Customer Center
- Change/cancel subscription
- View billing history
- Restore purchases

## Pricing Recommendations

### Farm Plan
- **Monthly**: $9.99/month
- **Annual**: $99/year (save 17%)
- Target: Individual farmers, small operations

### Commercial Plan
- **Monthly**: $29.99/month
- **Annual**: $299/year (save 17%)
- Target: Larger farms, commercial operations with teams

## Next Steps

1. ✅ Code is ready
2. ⏳ Create products in App Store Connect
3. ⏳ Create products in Google Play Console
4. ⏳ Configure RevenueCat Dashboard
5. ⏳ Test with sandbox accounts
6. ⏳ Replace test key with production key
7. ⏳ Submit for App Review

---

**Status:** Code complete, waiting for RevenueCat dashboard configuration

**Last Updated:** March 12, 2026
