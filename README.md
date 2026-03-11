# HerdTrackr

Offline-first cattle management app built with React Native (Ignite), WatermelonDB, and Supabase.

## Tech Stack

- **React Native** (Expo + Ignite boilerplate)
- **WatermelonDB** — offline-first local database (SQLite/LokiJS)
- **Supabase** — backend (PostgreSQL, Auth, Edge Functions)
- **React Navigation** — tab + stack navigation
- **TypeScript** — strict mode

## Getting Started

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start the dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
# Client-side (bundled in app)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Development settings
EXPO_PUBLIC_DEV_SKIP_AUTH=false  # Set to true to bypass OTP during dev

# Server-side (for scripts only - NEVER in app code)
SUPABASE_SECRET_KEY=your-service-role-key
```

> **Where do I find these?** See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for a full walkthrough.

## Project Structure

```
app/
├── components/       # Reusable UI components (Ignite)
├── config/           # App configuration
├── context/          # React Context providers (Auth)
├── db/               # WatermelonDB database layer
│   ├── models/       # Data models (Animal, HealthRecord, etc.)
│   ├── sync/         # Sync service (WatermelonDB <> Supabase)
│   └── schema.ts     # Database schema definition
├── i18n/             # Internationalization
├── navigators/       # React Navigation setup
├── screens/          # App screens
├── services/         # External services (Supabase client)
├── theme/            # Design tokens, colors, typography
└── utils/            # Utility functions
supabase/
├── migrations/       # SQL migrations (managed via Supabase CLI)
└── seed/             # Demo data (optional)
scripts/
└── upgrade-user.js   # Subscription tier management
```

## Data Model

### Core
- **Organization** — multi-tenant farms/ranches with subscription tiers
- **Membership** — user access control (admin/worker roles)

### Livestock
- **Animal** — RFID/visual tags, breed, sex, lineage, herd groups
- **Pasture** — rotational grazing management
- **PastureMovement** — animal movement history

### Health & Records
- **HealthRecord** — vaccinations, treatments, vet visits
- **WeightRecord** — weight tracking with condition scores
- **BreedingRecord** — breeding, pregnancy, calving records
- **TreatmentProtocol** — reusable treatment templates

### Subscription Tiers
- **Starter** (R0/month) — 100 animals, 1 pasture, 1 user
- **Farm** (R245/month) — 1,000 animals, 15 pastures, 5 users
- **Commercial** (R999/month) — Unlimited, RFID support, API access

## Database Management

### Supabase CLI Setup

```bash
# Install Supabase CLI globally (one-time)
npm install -g supabase

# Link to remote project
supabase link --project-ref geczhyukynirvpdjnbel

# Push migrations to database
supabase db push

# Create new migration
supabase migration new my_feature_name
```

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed documentation.

### User Subscription Management

```bash
# Upgrade user to Farm tier
node scripts/upgrade-user.js user@example.com

# Upgrade to Commercial for 1 year
node scripts/upgrade-user.js user@example.com --tier=commercial --days=365

# 14-day trial
node scripts/upgrade-user.js user@example.com --status=trial --days=14
```

See [SUBSCRIPTION_SETUP.md](./SUBSCRIPTION_SETUP.md) for more details
