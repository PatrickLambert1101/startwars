# Bento navigation experiment — 29 October 2026

Branch: `experiment/bento-navigation`, based on `fix/recording-ux-and-sync` (`84f304a`).

The dashboard now has a prominent farm/herd card, smaller pasture metrics and grouped recording actions. Urgent pasture, calving and vaccination tasks retain priority. Loading indicators distinguish unknown counts from zero. Both themes use the updated palette.

Five primary tabs provide Home, Herd, Chute, Pastures and Plan. Plan groups Calendar and Breeding without removing either route. Existing Chute session state remains mounted across tab changes. Navigation honors prevented presses, long presses, safe areas and keyboard visibility.

Verification:

- 169 tests passed across all 33 app/test suites, including five new navigation checks.
- Both iOS and Android JavaScript exports passed.
- TypeScript comparison: 95 existing diagnostics, zero new diagnostics. The repository's full typecheck is still not clean.
- Scoped lint has no errors; Breeding retains four existing dependency warnings.
- The experiment was loaded from Metro in the installed local debug app on iPhone 16 Pro / iOS 18.2. Dashboard, Herd, Chute, Pastures and both Plan pages were inspected without saving farm changes.
- The reusable native helper supports both navigation layouts and both home titles. Its combined XCTest suite was not rerun for this experiment.

This branch has not been published to the app stores. Android hardware and physical camera/RFID behavior remain unverified.
