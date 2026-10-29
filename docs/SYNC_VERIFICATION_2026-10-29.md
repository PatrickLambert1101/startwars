# Live sync verification — 29 October 2026

## Finding and deployed fix

Two independent databases reproduced a missed-record defect twice: an offline animal could upload successfully but remain absent from a client whose checkpoint had already passed the animal's original save time.

With explicit user approval, migration `20261029070000_server_sync_clock.sql` was applied to the linked shared Supabase project and recorded in its migration history. It adds server change timestamps across all 16 synchronized tables while preserving business record dates. Incremental pulls use these timestamps. Transaction locks order writes and checkpoints, including writes made outside the sync RPC. Checkpoints use a floored server clock after acquiring the lock.

Existing rows use their original timestamps until changed; no history backfill was performed. The current RPC authorization and client-schema gates remain intact. The migration passed a rolled-back application twice before deployment. Post-deployment checks confirmed one history entry, 32 clock columns, 32 triggers and 64 updated pull predicates.

## Results

- Both real WatermelonDB engines pulled matching counts across all 16 tables: 36,349 existing records.
- Delayed offline creation reached the other client with its original creation date intact.
- A failed pull preserved a pending creation. A failed push after a successful pull preserved a pending edit. Both retried successfully.
- Delayed edits synchronized in both directions, including explicit vaccination history.
- Concurrent edits to different columns merged without losing the pending local name or remote history change.
- Farm livestock types, default breeds, animal tags and genetic traits round-tripped as JSON.
- A 450.5 kg weight retained its precision; a tick observation in `pasture_activities` retained tick count 23.
- The real engine pushed deletions and removed the animal and measurement records from both replicas. Concurrent sync requests completed.
- Test records, pasture, farm and membership were soft-deleted. The two original failed-test farms were separately verified deleted with zero active memberships. The final successful run retained no pending cleanup manifest.

The successful run recorded 45 checkpoints in `/tmp/herd-sync-check/result.json`. The first post-deployment download attempt timed out before test records were created; the completed run used a bounded 60-second request timeout.

## Repeat

Use Node 22 with installed project dependencies and the existing review-account environment settings. Credentials stay in memory and are not printed. No service-role key is used.

```sh
node scripts/check-live-sync.cjs
node scripts/check-live-sync.cjs --write
```

The default compares two isolated local replicas without creating farm records. `--write` creates an isolated test farm, exercises saves and deletes, then soft-deletes it. Output defaults to the system temporary `herdtrackr-sync-check` directory; `HERD_SYNC_OUTPUT_DIR` selects another result directory. A failed cleanup retains a `pending-cleanup-<farm id>.json` manifest for investigation.

These checks use the actual application sync engine, schema and migrations, normal authenticated Supabase RPCs, and independent in-memory LokiJS adapters. They do not simulate physical phones or prove native SQLite behavior under OS termination. The iOS preview remained able to sync after deployment. Android hardware, camera/RFID and store purchases were not exercised.
