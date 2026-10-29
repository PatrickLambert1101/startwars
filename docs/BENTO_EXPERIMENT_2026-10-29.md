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


## Workflow and shared-screen follow-up

- Chute now has a forest-green Weigh hero, paired treatment/condition tiles and a combined recording card. Active sessions use the same header, card and control styling.
- Pastures groups map, create and import actions into a bento header that scrolls with the pasture list. Cards show readable hectare values, and overdue rotation text no longer displays a negative countdown.
- Shared button, scan-button, text-field and measurement-input styles use the same forest palette and rounded shapes. Shared radius tokens also align operational cards across 17 other detail, records, vaccination, import, reports, settings and team screens.
- Six additional action checks cover all Chute modes and pasture actions in light/dark layouts. All 175 tests pass across 34 suites; both mobile JavaScript exports pass.
- No new TypeScript or lint errors were found against the existing code. The repository still has 95 pre-existing TypeScript diagnostics and legacy lint findings.
- Native iOS 18.2 inspection covered the new Chute picker, active weighing session, lookup of an existing animal and the Pastures header. No farm record was saved. The simulator is left on the Chute picker.
