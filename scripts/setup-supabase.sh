#!/bin/bash

# HerdTrackr Supabase Setup Script
# This script applies database migrations to your Supabase project

echo "🗄️  Setting up Supabase database for HerdTrackr..."
echo ""

# Check if supabase project is linked
if [ ! -f "supabase/.temp/project-ref" ] && [ ! -f ".supabase/config.toml" ]; then
  echo "⚠️  No Supabase project linked!"
  echo ""
  echo "Please run one of the following:"
  echo ""
  echo "Option 1: Link to existing project"
  echo "  npx supabase link --project-ref your-project-ref"
  echo ""
  echo "Option 2: Or manually apply migrations via SQL Editor:"
  echo "  1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql"
  echo "  2. Copy and paste the contents of supabase/migrations/00001_initial_schema.sql"
  echo "  3. Click 'Run'"
  echo "  4. Copy and paste the contents of supabase/migrations/00002_add_watermelondb_sync.sql"
  echo "  5. Click 'Run'"
  echo ""
  exit 1
fi

echo "Applying migrations..."
echo ""

# Apply migrations
npx supabase db push

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database setup complete!"
  echo ""
  echo "Your Supabase database now has:"
  echo "  ✓ Organizations table with WatermelonDB sync support"
  echo "  ✓ Animals table"
  echo "  ✓ Health records table"
  echo "  ✓ Weight records table"
  echo "  ✓ Breeding records table"
  echo "  ✓ Treatment protocols table"
  echo "  ✓ Row Level Security policies"
  echo "  ✓ Auto-membership trigger"
  echo ""
  echo "Next steps:"
  echo "  1. Clear your local database: npm run clear-db"
  echo "  2. Restart your app: npm start"
  echo ""
else
  echo ""
  echo "❌ Migration failed!"
  echo ""
  echo "Please apply migrations manually via SQL Editor:"
  echo "  1. Go to https://supabase.com/dashboard"
  echo "  2. Select your project"
  echo "  3. Go to SQL Editor"
  echo "  4. Run supabase/migrations/00001_initial_schema.sql"
  echo "  5. Run supabase/migrations/00002_add_watermelondb_sync.sql"
  echo ""
fi
