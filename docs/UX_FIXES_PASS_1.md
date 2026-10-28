# UX fixes — first pass
28 October 2026

## Implemented

- The dashboard qualifies its summary as records on this device. First sync, failed sync, unconfirmed vaccination history and missing active schedules each have an explicit explanation. Raw sync exceptions are kept out of the farmer-facing message.
- Practical actions appear ahead of herd statistics and AI insights. Weigh and Add Animal are direct actions; weighing opens an animal picker first.
- New animals, batch additions and spreadsheet imports have explicit Unknown, Current and Needs review vaccination-history states. Blank or unrecognised imports remain Unknown. Existing legacy settings are preserved and labelled for confirmation when reviewed.
- Unknown history does not manufacture a backlog of missed historical doses. Future scheduling continues. Existing recorded observations are retained.
- Animal, weight, batch-add and Chute saves share an immediate repeat-tap guard. Relevant form inputs and save actions are disabled while writing. A success receipt explicitly says the record was saved on this device, with sync shown separately.
- Weigh + Treat prepares and commits weight, treatment, a matching pending vaccination and its booster together in one local transaction. Failure does not advance to the next animal.
- Edited animal and weight forms ask before discarding unsaved changes, allow untouched forms to close, and permit normal exit after a successful save. This is discard protection, not automatic draft storage.
- Condition-only recording is reachable from the Chute mode picker. The picker scrolls on smaller screens or with larger text.
- Numeric editing appends visibly rather than silently replacing the whole measurement. Backspace corrects the last digit, Clear starts a new value, and the sheet explains the behaviour. Weight sheets repeat the animal identity; Chute sheets also show the previous weight and date when available.

## Database

Local schema version 25 adds nullable `animals.vaccination_history` without backfilling legacy data. Migration `20261028103000_add_vaccination_history.sql` was applied to the linked database and verified through its catalog and deployed sync functions. Older app versions are not sent the new field; their unrelated updates preserve an explicit history, while an intentional change of the legacy vaccination setting remains respected.

## Verification

- 55 regression tests passed across 9 suites: immediate double taps, save failure/retry, discard confirmation, successful-save exit, combined transaction failure, pending vaccination and booster linking, confidence states, imports and keypad editing.
- New components, helpers, services and their tests passed ESLint.
- iOS and Android production JavaScript exports succeeded.
- Type-check comparison: no new diagnostics; the same 104 pre-existing project diagnostics remain.
- Isolated PostgreSQL checks passed for legacy data preservation, explicit Unknown/Current persistence, old/new client pull compatibility, older-client updates, constraints and safe repeated application.
- Re-run the migration checks with `python3 scripts/verify-vaccination-history-migration.py` when PostgreSQL tools are on PATH. It uses an isolated temporary database and stops/removes it afterwards.

App changes are ready for device review and a subsequent release. Component tests and bundle exports do not replace a hands-on native navigation and field test.

## Remaining audit work

- Shorter animal creation through optional sections and clearer required fields.
- Automatic draft recovery beyond discard confirmation, and correction/undo for the last batch entry.
- Task-tested navigation hierarchy and clearer labels for unfamiliar icons.
- Separate upcoming events from urgent attention items.
- Complete translations across the main journeys.
- Condition-scoring references agreed with the farm's protocol.
- Physical-device checks for touch targets, large text, screen readers, sunlight and one-handed work.
