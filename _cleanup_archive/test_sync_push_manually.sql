-- Test the sync_push function manually to see what errors occur
-- This will show us why organizations aren't being inserted

SELECT sync_push('{
  "organizations": {
    "created": [{
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
    }],
    "updated": [],
    "deleted": []
  }
}'::jsonb);

-- Check if it was inserted
SELECT id, name, created_at
FROM organizations
WHERE id = 'SUscZwZWRLLBTRrg';
