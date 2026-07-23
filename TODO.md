# HerdTrackr — Launch Tracker

> Working tracker for the store launches and go-to-market. Claude reads and
> updates this file — keep items short, move done things to the bottom log.

## 🔴 Blocking launch

- [ ] **EAS build must set review env vars** — `EXPO_PUBLIC_REVIEW_EMAIL`, `EXPO_PUBLIC_REVIEW_OTP_CODE`, `EXPO_PUBLIC_REVIEW_PASSWORD` in eas.json/EAS secrets, or the review bypass is disabled in the build. Values are in local `.env`.
- [ ] **Apple: build & submit** — new EAS build (picks up splash + review bypass), attach IAPs to the version, paste review notes (review@herdtrackr.co.za / code 7314159, "data syncs on first launch")
- [ ] **Apple: in-app account deletion (5.1.1)** — minimum: Settings row linking to herdtrackr.co.za/data-deletion.html; native delete better
- [ ] **Play: closed-testing release live** — check Releases tab says "Available to testers"; publish from Publishing overview if pending
- [ ] **Play: 12+ testers opted in** — send Nate the join link + collect Gmail addresses; aim for 15–16; clock = 14 continuous days
- [ ] **Set store prices** — App Store Connect + Play Console subscriptions: Farm R249,99/m · Unlimited R999/m

## 🟡 Store assets & metadata (ready to upload)

- [ ] Upload iPhone shots: `appstore-screenshots/` (6.9") + `6.5-inch/`
- [ ] Upload iPad 13" shots: `appstore-screenshots/ipad-13/`
- [ ] Play: phone `play-phone/`, tablets `play-tablet-7/` + `play-tablet-10/`, feature graphic `play-feature-graphic.png`
- [ ] Play: 512×512 icon export (ask Claude — one command)
- [ ] Paste metadata (promo text, description, keywords, URLs — in session notes / ask Claude to regenerate)
- [ ] App Privacy questionnaire (email, identifiers, Sentry analytics) — must match privacy policy

## 🟠 App fixes (non-blocking but soon)

- [ ] **Reports screen blank with large herds** — task chip exists; unbounded query, needs SQL aggregation + loading state
- [ ] Settings copy: "Every feature included free" → soften now that RFID is Unlimited-only
- [ ] RFID upsell UI: use `hasRfidAccess` to show "🔒 RFID — Unlimited plan" row instead of hiding
- [ ] Herd list shows duplicate tag A0003 in demo data (cosmetic, demo org only)
- [ ] Sentry: migrate off deprecated sentry-expo@7 to @sentry/react-native

## 🟢 Go-to-market (see HerdTrackr-GamePlan.pdf)

- [ ] Send Nate the game plan PDF + tester ask message
- [ ] Order 2–3 candidate generic BLE LF readers for field testing (Phase 2 of hardware plan)
- [ ] Confirm HID keyboard-wedge tag entry works in Chute Mode (untested claim in the plan)
- [ ] List first 10 lighthouse farmer candidates
- [ ] District auction / farmers' day calendar for next 3 months
- [ ] After 14-day test window: apply for Play production access (questionnaire on Dashboard)

## ✅ Done log

- 2026-07-20 — Committed + pushed launch-prep batch to public origin/main (`d16e82c`); moved review creds to env vars (EXPO_PUBLIC_REVIEW_*) so no secret in public repo; re-verified review account works
- 2026-07-20 — Hid debug controls in prod (Force Full Sync, Test Sentry, Reset Database) behind `__DEV__` in SettingsScreen; kept "Add Default Vaccination Schedules" (real user feature) and "Auto-sync active" info
- 2026-07-20 — Splash: new logo everywhere (app.json, Android drawables, iOS storyboard); old blue logo gone
- 2026-07-20 — LoadingScreen single animated logo; biometric only locks when login expires (+1h offline grace)
- 2026-07-20 — All store screenshots captured (iPhone 6.9"/6.5", iPad 13", Play phone/7"/10") + feature graphic
- 2026-07-20 — Review account live: review@herdtrackr.co.za, fixed code 7314159, Demo Ranch (7,101 head), super-user pro access (`scripts/setup-review-account.ts`)
- 2026-07-20 — RFID reader support gated to Unlimited plan (`useRfidReader.hasRfidAccess`)
- 2026-07-20 — Game plan PDF v2 with R250/R999 pricing + hardware/tags profit model (`HerdTrackr-GamePlan.pdf`)
