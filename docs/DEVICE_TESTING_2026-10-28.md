# Device testing and sync fixes — 28 October 2026

This pass used the installed HerdTrackr development app on iPhone 16 Pro / iOS 18.4. UI interactions ran through XCTest, with screenshots and accessibility snapshots. No test measurement, animal, treatment or condition record was saved.

## Fixes

- Expected offline sync failures retain the error state and pending changes, with warning breadcrumbs instead of repeated Sentry exceptions. Unexpected failures are reported once per five-minute window, with fresh reporting after recovery. Production Sentry debugging is off; genuine payment failures are no longer blanket-filtered.
- Sync validates pull checkpoints and requires explicit successful push acknowledgement. Empty responses cannot silently advance the checkpoint or mark pending uploads complete. Original API errors remain attached for diagnosis.
- Concurrent callers share one sync operation. Herd refresh uses the shared sync context. Correct retry delays, timer cleanup and recovery clear the old error after a successful background retry.
- Connectivity probes handle failures and preserve known offline status when reachability is unknown. Signing out and back in triggers a fresh initial sync. Pending invitations retain previously loaded results when offline; genuine permission failures remain reported.
- Shared text inputs expose their native inputs and announce their labels. The animal tag field has an explicit label; named cows show their tag in the picker and weight-entry context. Chute mode cards expose button roles.
- Dashboard vaccination-history wording handles a single animal.
- Chute tag submission reads the submitted native text, preventing a fast Return/scanner submission from using stale state. Batch Chute sessions retain unfinished entries across tab changes. Farm changes reset the session, and an animal from the previous farm cannot remain the recording target. Route-driven entries retain their existing exit cleanup.

## Verification

- 105 relevant regression tests pass across 17 suites, including sync response safety, simultaneous requests, backoff, recovery, Sentry filtering, input labels, existing save guards, imports, keypad editing and date handling.
- TypeScript comparison: 95 current errors versus 104 in the original baseline; no new errors. The repository does not have a clean full typecheck.
- Scoped ESLint passes for the new and updated shared components, sync helpers, hook and tests.
- Native checks cover all six tabs, untouched cancellation, Keep editing / Discard, 450 → 455 correction, cancelling a keypad change, animal identification, and condition-only entry. The Chute draft-loss test reproduced loss of an unfinished 450 kg entry when visiting Calendar.
- The Chute regression failed before the fix because switching tabs discarded the unfinished weight; the final native check passed in 34.7 seconds, including tag submission and retaining 450 kg across Calendar → Chute. The earlier four native scenarios passed together; later combined reruns encountered development error overlays and a test-runner startup crash, so this is not a claim that the latest combined five-test run passed.
- Final iOS and Android production JavaScript exports succeeded at `/tmp/herd-device-verified-export`; scoped ESLint and `git diff --check` passed. The standalone UI-project generator was also exercised successfully.
- Native results: `/tmp/herd-device-tests/current-device.xcresult` (four passing scenarios) and `/tmp/herd-device-tests/chute-confirmed.xcresult` (the final Chute regression). No native store build was created.
- Farm-change session clearing is implemented and typechecked; it was not exercised by changing the live farm during this pass.

## Repeat the UI checks

Keep Metro running and install the development app (`com.herdtrackr`) on an English-language simulator with at least one existing active animal. The tests use that animal for read-only selection and discard all form edits.

Create an isolated test project using Ruby with the `xcodeproj` gem. With Homebrew CocoaPods:

```sh
GEM_HOME="$(brew --prefix cocoapods)/libexec" \
  "$(brew --prefix ruby)/bin/ruby" scripts/create-herd-device-test-project.rb /tmp/herd-device-checks
```

Then run against the installed simulator, substituting its ID:

```sh
xcodebuild test \
  -project /tmp/herd-device-checks/HerdDeviceChecks.xcodeproj \
  -scheme HerdDeviceChecks \
  -destination 'platform=iOS Simulator,id=SIMULATOR_ID,arch=x86_64' \
  -derivedDataPath /tmp/herd-device-checks/DerivedData \
  -parallel-testing-enabled NO \
  -test-timeouts-enabled YES \
  -default-test-execution-time-allowance 90 \
  CODE_SIGNING_ALLOWED=NO
```

Use the architecture of the installed app. This audit used x86_64 because the current ML Kit simulator build excludes arm64. The suite remains outside the app's native project and does not modify the release targets.

## Limits

Android hardware, physical iPhone camera/RFID behavior, purchase completion and actual saved-record workflows are outside this non-destructive pass. iOS 18.4 has a known StoreKit simulator issue that can prevent loading purchase products: https://www.revenuecat.com/docs/known-store-issues/storekit/ios-18-4-simulator-fails-to-load-products.

These changes are local and require a new release build to reach store users.
