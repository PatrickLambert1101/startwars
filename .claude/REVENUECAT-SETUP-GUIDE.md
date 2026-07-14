# RevenueCat Production Setup Guide

## 📱 App Store Connect - Create Subscription Products

### Step 1: Access Your App in App Store Connect

1. Go to: **https://appstoreconnect.apple.com**
2. Sign in with your Apple Developer account
3. Click on **"My Apps"**
4. Find and select **"Herdtrackr"** (Bundle ID: `com.herdtrackr`)

---

### Step 2: Navigate to Subscriptions

1. In the left sidebar, click **"Monetization"**
2. Click **"Subscriptions"**
3. If this is your first subscription, you'll need to:
   - Click **"Create Subscription Group"**
   - Name it: `Herdtrackr Premium Plans`
   - Click **"Create"**

---

### Step 3: Create Farm Monthly Subscription

1. Click the **"+" button** or **"Create Subscription"**
2. Fill in these details:

   **Reference Name:** `Farm Monthly`
   **Product ID:** `farm_monthly` ⚠️ **MUST BE EXACT**

3. Click **"Create"**

4. On the next screen, configure:

   **Subscription Duration:** `1 Month`

5. Under **"Subscription Prices"**:
   - Click **"Add Subscription Price"**
   - Select **"South Africa (ZAR)"**
   - Enter price: **R 249.99**
   - Click **"Next"** → **"Add"**

6. Under **"Subscription Localizations"**:
   - Click **"Add Localization"**
   - Select **"English (U.S.)"**
   - **Subscription Display Name:** `Farm Monthly`
   - **Description:** `Perfect for growing farms. Up to 1,000 animals, 15 pastures, full health tracking, and up to 5 users.`
   - Click **"Save"**

7. **Scroll to bottom and click "Save"**

---

### Step 4: Create Farm Yearly Subscription

1. Click **"+" button** again (in the subscription group)
2. Fill in:

   **Reference Name:** `Farm Yearly`
   **Product ID:** `farm_yearly` ⚠️ **MUST BE EXACT**

3. Click **"Create"**

4. Configure:

   **Subscription Duration:** `1 Year`

5. Under **"Subscription Prices"**:
   - Click **"Add Subscription Price"**
   - Select **"South Africa (ZAR)"**
   - Enter price: **R 2,499.00** (annual, saves ~17%)
   - Click **"Next"** → **"Add"**

6. Under **"Subscription Localizations"**:
   - Click **"Add Localization"**
   - Select **"English (U.S.)"**
   - **Subscription Display Name:** `Farm Yearly`
   - **Description:** `Annual subscription to Farm plan. Save 17% compared to monthly billing.`
   - Click **"Save"**

7. **Click "Save"**

---

### Step 5: Create Commercial Monthly Subscription

1. Click **"+" button** again
2. Fill in:

   **Reference Name:** `Commercial Monthly`
   **Product ID:** `commercial_monthly` ⚠️ **MUST BE EXACT**

3. Click **"Create"**

4. Configure:

   **Subscription Duration:** `1 Month`

5. Under **"Subscription Prices"**:
   - Click **"Add Subscription Price"**
   - Select **"South Africa (ZAR)"**
   - Enter price: **R 999.00**
   - Click **"Next"** → **"Add"**

6. Under **"Subscription Localizations"**:
   - Click **"Add Localization"**
   - Select **"English (U.S.)"**
   - **Subscription Display Name:** `Commercial Monthly`
   - **Description:** `For large commercial operations. Unlimited animals and pastures, advanced analytics, unlimited users, custom reports, and API access.`
   - Click **"Save"**

7. **Click "Save"**

---

### Step 6: Create Commercial Yearly Subscription

1. Click **"+" button** one last time
2. Fill in:

   **Reference Name:** `Commercial Yearly`
   **Product ID:** `commercial_yearly` ⚠️ **MUST BE EXACT**

3. Click **"Create"**

4. Configure:

   **Subscription Duration:** `1 Year`

5. Under **"Subscription Prices"**:
   - Click **"Add Subscription Price"**
   - Select **"South Africa (ZAR)"**
   - Enter price: **R 9,999.00** (annual, saves ~17%)
   - Click **"Next"** → **"Add"**

6. Under **"Subscription Localizations"**:
   - Click **"Add Localization"**
   - Select **"English (U.S.)"**
   - **Subscription Display Name:** `Commercial Yearly`
   - **Description:** `Annual subscription to Commercial plan. Save 17% compared to monthly billing.`
   - Click **"Save"**

7. **Click "Save"**

---

## 🔑 App Store Connect API Key Setup

### Step 7: Generate App Store Connect API Key

1. Still in App Store Connect, click your **profile icon** (top right)
2. Select **"Users and Access"**
3. Click the **"Integrations"** tab
4. Under **"Team Keys"**, click the **"+" button**
5. Fill in:
   - **Name:** `RevenueCat Integration`
   - **Access:** Select **"App Manager"** role
6. Click **"Generate"**
7. **IMPORTANT:** Download the `.p8` file immediately (you can only do this once!)
8. **Copy** the following information:
   - **Issuer ID** (looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - **Key ID** (looks like: `XXXXXXXXXX`)
   - Save the downloaded `.p8` file somewhere safe

---

## 🔗 RevenueCat Configuration

### Step 8: Upload API Key to RevenueCat

1. Go to: **https://app.revenuecat.com/projects/aba83407/apps/app2c10c6087b**
2. Click **"App settings"** (or look for App Store Connect section)
3. Find **"App Store Connect API"** section
4. Click **"Configure"** or **"Upload Key"**
5. Fill in:
   - **Issuer ID:** (paste from Step 7)
   - **Key ID:** (paste from Step 7)
   - **Upload the .p8 file** (from Step 7)
6. Click **"Save"** or **"Upload"**

**⏱️ Wait 15-30 minutes** for RevenueCat to sync your products from App Store Connect.

---

### Step 9: Link Products to Packages

After the sync completes:

1. Go to: **https://app.revenuecat.com/projects/aba83407/product-catalog/offerings**
2. Find the **"default"** offering
3. Click **"Edit"**
4. For each package, attach the corresponding product:

   | Package Name | Attach Product |
   |--------------|----------------|
   | Commercial Yearly | `commercial_yearly` |
   | Commercial Monthly | `commercial_monthly` |
   | Farm Annual | `farm_yearly` |
   | Farm Monthly | `farm_monthly` |

5. Click **"Save"**

---

## ✅ Verify Entitlement Mappings

### Step 10: Check Product → Entitlement Links

1. Go to: **https://app.revenuecat.com/projects/aba83407/product-catalog/products**
2. For each product, verify it's linked to the correct entitlement:

   | Product | Entitlement |
   |---------|-------------|
   | `farm_monthly` | `farm` |
   | `farm_yearly` | `farm` |
   | `commercial_monthly` | `commercial` |
   | `commercial_yearly` | `commercial` |

3. If any are missing, click on the product and add the entitlement

---

## 🧪 Testing

### Step 11: Test in Your App

1. **Restart your app** completely (force quit and reopen)
2. Navigate to the Paywall screen
3. Check the logs - you should see:
   ```
   [Subscriptions] Found packages: 4
   [Paywall] Available packages: [array of 4 packages]
   ```
4. Try making a **sandbox purchase** (requires a sandbox test account in App Store Connect)

---

## 🎯 Product IDs Summary (Copy/Paste Reference)

```
farm_monthly
farm_yearly
commercial_monthly
commercial_yearly
```

---

## 🆘 Troubleshooting

**If packages are still empty after 30 minutes:**
1. Check that the API key was uploaded successfully in RevenueCat
2. Verify all 4 products are in "Ready to Submit" or "Approved" status in App Store Connect
3. Check RevenueCat dashboard for any sync errors
4. Try manually refreshing in RevenueCat: Apps → Herdtrackr → Refresh Products

**If you see "Missing Product" errors:**
- The Product IDs in App Store Connect must **exactly match** the identifiers above
- Case-sensitive, no extra spaces
- Check for typos

---

## 📞 Need Help?

- RevenueCat Docs: https://docs.revenuecat.com/docs/ios-products
- App Store Connect Docs: https://developer.apple.com/help/app-store-connect/
- RevenueCat Support: https://community.revenuecat.com/

---

**Estimated Total Time:** 30-45 minutes
**Current Status:** Step 1 - Creating products in App Store Connect
