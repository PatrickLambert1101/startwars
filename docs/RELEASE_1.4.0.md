# HerdTrackr 1.4.0

## Release notes

- A refreshed layout throughout HerdTrackr, with clearer cards, actions and navigation.
- Updated cow profiles, chute sessions, pastures, settings, forms and reports.
- Faster weight, body condition and tick-count recording.
- Improved offline syncing and reliability when moving between farms and recording screens.
- Clearer vaccination history and pending care information.
- Default protocol templates are now created only when requested.

## Validation

181 tests passed across 38 project suites. iOS and Android production JavaScript exports passed. Native iOS spot-checks covered the dashboard, settings, team, protocols, chute, pastures and cow profiles. Full route source coverage is documented in BENTO_SCREEN_COVERAGE_2026-10-29.md. Existing repository type/lint errors remain, with no new diagnostics introduced by the styling pass.

The previously deployed server sync migration remains in place. No new backend migration is required for this release.

## Distribution

Source revision: `8accca30ffa65ceeeff438530cd23510c340642f`. The complete experiment and core fixes were merged into `main` and pushed with the user's explicit approval on 29 October 2026.

- iOS: version 1.4.0, build 45. [Signed production build](https://expo.dev/accounts/lambertpatrick091/projects/herd-trackr/builds/003a92bb-c4f0-4840-9ae4-a88180f2d80d) finished successfully. [App Store upload](https://expo.dev/accounts/lambertpatrick091/projects/herd-trackr/submissions/602a0ec5-9bb3-46aa-8df6-97ca67b939d5) finished successfully.
- Apple version `04cc91c9-dde6-4070-8c41-0d07ea0e80e4` uses processed build 45 (`d12a736b-c86d-4a20-a6e1-6375059e38af`), updated release notes, the inherited 13 screenshots and existing review contact details.
- Apple review submission `238e98be-eec4-4110-8b6f-d0223c87ede2` was verified as `WAITING_FOR_REVIEW`, with release type `AFTER_APPROVAL`.
- Android: version 1.4.0, version code 31. [Signed production build](https://expo.dev/accounts/lambertpatrick091/projects/herd-trackr/builds/f8b0175d-f59e-4e35-83ba-6aa64220fa70) finished successfully. [Google Play production submission](https://expo.dev/accounts/lambertpatrick091/projects/herd-trackr/submissions/04161f38-6bba-4343-8fcc-cb5cf52fb056) finished successfully on 29 October 2026 using the production track and release status `completed`.

Git tag `v1.4.0` identifies the exact source revision used for both signed builds.

Public availability remains subject to each store's review and processing.
