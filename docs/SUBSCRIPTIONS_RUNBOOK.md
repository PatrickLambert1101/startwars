# HerdTrackr subscriptions runbook

Last updated: 22 October 2026

This is the durable project memory for store subscriptions. Keep secrets out of this file. In particular, never add a RevenueCat secret API key or the contents of the Google service-account JSON.

## Current public plans

| Plan | Product ID | Billing | Current South Africa price | Limit |
| --- | --- | --- | --- | --- |
| Farm | `farm_monthly` | Monthly | R249.99/month | Up to 500 animals |
| Commercial | `commercial_monthly` | Monthly | R999.99/month | Unlimited animals |

Both products use the Google Play base-plan ID `monthly`. The app should display the localized price returned by Apple/Google through RevenueCat; prices must not be hard-coded in the UI.

## Identifiers and links

- App/package: HerdTrackr / `com.herdtrackr`
- RevenueCat project: `aba83407`
- RevenueCat Android app: `app171e7ffa29`
- RevenueCat Android public SDK key: `goog_AQIErCwrIwLFiVbjUoSDcXijFnb`
- RevenueCat iOS public SDK key: `appl_pYedWqOUJCZGNaNNxFwyPgpbZLV`
- RevenueCat Android app: <https://app.revenuecat.com/projects/aba83407/apps/app171e7ffa29>
- Google Play developer ID: `5043777649613802149`
- Google Play app ID: `4974443078827931977`
- Google Play production track ID: `4697622233588195589`
- Google Play closed Alpha track ID: `4700260937418162588`
- Farm base plan: <https://play.google.com/console/u/0/developers/5043777649613802149/app/4974443078827931977/subscriptions/s/farm_monthly/base-plans/b/monthly>
- Commercial base plan: <https://play.google.com/console/u/0/developers/5043777649613802149/app/4974443078827931977/subscriptions/s/commercial_monthly/base-plans/b/monthly>
- App Store Connect app ID: `6760476630`
- App Store subscription group ID: `21975836`
- App Store subscription group: <https://appstoreconnect.apple.com/apps/6760476630/distribution/subscription-groups/21975836>
- Farm Apple ID: `6760532359`
- Commercial Apple ID: `6760532393`

## Fast price-change checklist

### Google Play

1. Open the product link above.
2. Open the active `monthly` base plan and edit its regional pricing.
3. Change the South Africa price, save, and activate/publish the change.
4. Leave the product ID and base-plan ID unchanged.
5. Check RevenueCat after Google processes the update. A price-only change normally does not require a new app build.

### Apple App Store

1. Open the HerdTrackr Premium subscription group.
2. Open Farm Monthly or Commercial Monthly.
3. Edit Subscription Prices for South Africa and save the price change.
4. Leave the product IDs unchanged.
5. Apple may schedule an increase or require subscriber consent depending on the size and timing of an increase. A price-only change normally does not require a new app build.

### Verify after a change

1. Wait for store propagation and confirm RevenueCat still maps both products into the current offering/entitlements.
2. Open the paywall on a real store-distributed test build and confirm the displayed localized prices.
3. Test one purchase and Restore Purchases using Google Play license testing or Apple Sandbox/TestFlight.
4. Confirm RevenueCat grants the intended tier and the animal limit changes correctly.

## RevenueCat and Google notifications

- Google Cloud project: `herdtrackr-app`
- Service account: `revenuecat-service-account@herdtrackr-app.iam.gserviceaccount.com`
- Pub/Sub topic: `projects/herdtrackr-app/topics/Play-Store-Notifications`
- Google Play notifications cover subscriptions, voided purchases, and all one-time products.
- RevenueCat validated the credentials and received a test notification on 17 October 2026 at 11:01 UTC.
- The service account currently has Monitoring Viewer, Pub/Sub Editor, and Pub/Sub Admin. Pub/Sub Admin was needed after Editor alone failed.
- The service-account file is stored locally at `/Users/pat/Downloads/herdtrackr-app-b840f90191ca.json`. Do not commit it, paste its contents here, or revoke its key until a replacement is uploaded to RevenueCat and tested.
- A RevenueCat secret API key was previously pasted into chat. It must be revoked. Never save secret RevenueCat keys in the repository.

## Android release status

- Production version: 1.0.2, version code 22.
- The production release was created for South Africa only and submitted to Google for review on 18 October 2026.
- As of 19 October 2026, Google Play still reports: **Your changes are now in review**.
- Managed publishing is off, so Google will publish automatically after approval.
- Build configuration: `app.json` version code 22; `android/app/build.gradle` version code 22 and version name 1.0.2; `eas.json` uses remote app-version source and production auto-increment.
- Upload certificate SHA-1: `2B:1F:12:81:21:00:F7:54:0F:9F:4C:3B:EE:89:C1:CA:C5:F5:08:50`
- The uploaded AAB SHA-256 was `1431a27ad31d6da44e997b8cd8d0826f39010c3679746e05c5fa24163da89f84`.
- Google showed a 16 KB page-size warning; fix this in the next native dependency/build update. A DEX-obfuscation warning becomes relevant in February 2027.

## iOS release status and exact next step

- Public version 1.2 is Ready for Distribution.
- Version 1.2 build 34 was rejected on 16 October 2026. Submission ID: `a6ec7ffa-708d-40b9-8f46-22e08e26520f`.
- The only current rejection reasons were: the 13-inch iPad screenshots showed only login, and the Farm promotional image had text that was too small.
- The iPad gallery was replaced with eight genuine screenshots from `appstore-screenshots/ipad-13/01-dashboard.png` through `08-settings.png` (2064 x 2752).
- The optional Farm promotional image was removed. Keep the required in-app-purchase review screenshot.
- App Review notes were updated with the fixes and test steps.
- While repairing the rejected submission, the subscription group and both children were removed from review. This put Farm Monthly and Commercial Monthly into Developer Rejected state.
- Version 1.2 was successfully resubmitted on 18 October 2026 and moved to **Waiting for Review**. The corrected app version is in Apple's queue.
- The subscription group, Farm, and Commercial remained marked **Removed** on the old submission. Attempts to add the group or Farm individually returned Apple's generic “Unable to Add for Review / Something went wrong” error before the app resubmission. Once the app was waiting for review, the group-level Add for Review button became disabled.
- On 19 October 2026, the App Store UI re-enabled **Add for Review**, but the request still failed. Apple's underlying response was HTTP 409 with `STATE_ERROR.ITEM_PART_OF_ANOTHER_SUBMISSION`: subscription-group version `32b2e8f2-51cb-426a-b7f9-2a89ad045491` remains associated with submission `a6ec7ffa-708d-40b9-8f46-22e08e26520f`, despite displaying as Removed.
- Apple approved version 1.2, but then enforced its rule that the first subscription group and first auto-renewable subscriptions must be submitted with a new app version.
- A production EAS build was created for iOS 1.3.0, build 36. EAS build ID: `cb90239a-f387-4bdd-be43-8e1a95cbfe80`.
- App Store version 1.3.0 was created with build 36, automatic release after approval, updated release notes, and subscription testing instructions.
- On 20 October 2026 at 09:49 SAST, four items were submitted together and moved to **Waiting for Review**: iOS 1.3.0 (36), HerdTrackr Premium, Farm Monthly, and Commercial Monthly.
- Current Apple submission ID: `a444bf24-a268-4955-9491-bb4b61f72d06`.
- Apple rejected build 36 on 22 October 2026 under Guideline 2.1(b). The review sandbox account already showed Farm as Active, and a paywall tap during RevenueCat startup could make that restored purchase appear to be a new purchase completed without a StoreKit sheet.
- The app now blocks purchase actions until the initial RevenueCat status check finishes, checks whether the exact product is already active before purchasing, shows **Already Subscribed** for an existing plan, and only reports purchase success when the selected product is active in the returned StoreKit/RevenueCat customer information.
- Focused subscription tests pass (6 tests), and ESLint passes for all changed subscription files. The repository-wide TypeScript check still has pre-existing unrelated errors elsewhere in the project.
- Fixed production EAS build: iOS 1.3.0 (37), build ID `b168f248-6bcd-4ec2-aed2-7c9360083dec`; automatic App Store upload submission `19b5a7b0-07fc-480a-938b-14ca4dc76ccc`.
- Build 37 replaced build 36 on version 1.3.0. The App Review notes now explain that Apple's screenshot showed an already-active Farm subscription, describe the startup-race fix, and give fresh-account and existing-account sandbox test paths.
- On 22 October 2026 at 10:14 SAST, the same submission was resubmitted with all four items intact: iOS 1.3.0 (37), HerdTrackr Premium, Farm Monthly, and Commercial Monthly. All four now show **Waiting for Review**.
- Next: wait for Apple review. Do not cancel or remove any of the four submitted items unless Apple gives a new, specific rejection reason.

## iOS review test instructions

1. Launch the app.
2. Sign in using the email one-time code flow.
3. Open Settings, then Subscription Plans.
4. Choose Farm or Commercial.
5. Restore Purchases is available below the plans.

The App Store description already includes links to the Privacy Policy and Apple's standard EULA. Prior August issues around submitting in-app purchases, purchase behavior, and EULA links were fixed; do not confuse those with the current screenshot-only rejection.

## Availability

The current store rollout is South Africa only. If more countries are enabled later, configure availability and pricing in both stores and re-check local tax/compliance requirements before launch.
