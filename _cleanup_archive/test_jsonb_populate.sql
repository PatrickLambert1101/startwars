-- Test what jsonb_populate_record does with our data
-- This is exactly what sync_push is doing

SELECT * FROM jsonb_populate_record(NULL::organizations, '{
  "id": "SUscZwZWRLLBTRrg",
  "_status": "created",
  "_changed": "",
  "remote_id": null,
  "name": "Bos",
  "livestock_types": "[\"cattle\"]",
  "location": "Veld",
  "default_breeds": "{\"cattle\":\"Nguni\"}",
  "subscription_tier": "starter",
  "subscription_status": "active",
  "subscription_starts_at": null,
  "subscription_ends_at": null,
  "created_at": 1773589712140,
  "updated_at": 1773589712140,
  "is_deleted": false
}'::jsonb);
