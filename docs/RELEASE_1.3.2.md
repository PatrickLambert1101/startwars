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

## Production builds and store submission

Source revision: `0b5f9ea7397360598f728eefebdbf3d79c27fea7`.

- iOS: version 1.3.2, build 44. [Signed build](https://expo.dev/accounts/lambertpatrick091/projects/herd-trackr/builds/f2ec9cf0-67c2-4869-a0a8-54f1eac8cb24).
- Android: version 1.3.2, version code 30. [Signed build](https://expo.dev/accounts/lambertpatrick091/projects/herd-trackr/builds/7560582f-dedd-4f90-9bd0-ff996ab6871b).
- Google Play production upload completed successfully on 28 October 2026 using release status `completed`. [Submission receipt](https://expo.dev/accounts/lambertpatrick091/projects/herd-trackr/submissions/38a448d6-e1bb-4ed2-be36-9ecad3bf92d9). Store review and availability remain controlled by Google Play.
- Apple upload completed successfully. [Upload receipt](https://expo.dev/accounts/lambertpatrick091/projects/herd-trackr/submissions/ac7893fc-083d-4aeb-bb0c-cd82e536e521).
- App Store version `dba16f0f-a682-4de5-b843-73ab93f05a23` was submitted for public review with processed build 44, updated release notes, the inherited five iPhone screenshots and eight iPad screenshots, and existing review contact information.
- Apple review submission `f6849a95-018b-418b-968c-1bccd79cd521` was verified as `WAITING_FOR_REVIEW`, with release type `AFTER_APPROVAL`, on 28 October 2026.
