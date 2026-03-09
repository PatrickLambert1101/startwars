# Apply Supabase Migration

Apply the latest Supabase migration to the remote database:

1. Open the SQL Editor: https://supabase.com/dashboard/project/geczhyukynirvpdjnbel/sql/new
2. Find the latest migration in `supabase/migrations/`
3. Copy the SQL content
4. Paste into the SQL Editor
5. Click "Run"

Alternative via CLI:
```bash
supabase db push
```

Note: If you get "already exists" errors, that's okay - the migration uses IF NOT EXISTS for safety.
