# HerdTrackr 1.3.2

## Release notes

- Record weights with a dedicated decimal keypad and a visible kg unit.
- Select body condition scores with large 1–9 buttons in weight forms and chute sessions.
- Count ticks and inspected animals using +1, +5 and −1 controls or direct number entry.
- Keep an unrecorded count distinct from a checked count of zero.
- See exact tick counts alongside tick-load severity in pasture activity history.
- Align the Android version label with iOS at 1.3.2.

## Validation

- 10 targeted keypad, translation and pasture-activity tests passed.
- New input components and their tests passed ESLint and formatting checks.
- iOS and Android JavaScript exports succeeded.
- iOS Debug build succeeded and opened the dashboard in the iPhone 16 Pro simulator (iOS 18.4).
- The type-check comparison found no new diagnostics; pre-existing project errors remain.

## Database

Migration `20261028091000_add_tick_count.sql` was applied to the linked production database on 28 October 2026. The live column, count constraint, sync push support and backwards-compatible sync pull were verified. Temporary-database checks covered blank and zero counts, incremental pulls, older-client updates, clearing counts, constraints and repeated application.

The local database schema is version 24. Store build numbers are allocated by EAS using the production profile's automatic increment.
