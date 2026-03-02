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

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
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
├── migrations/       # SQL migrations (run in Supabase SQL editor)
└── seed/             # Demo data you can load into your project
```

## Data Model

- **Organization** — multi-tenant support
- **Animal** — RFID tag, visual tag, breed, sex, lineage, status
- **HealthRecord** — vaccinations, treatments, vet visits
- **WeightRecord** — weight history, condition scores
- **BreedingRecord** — breeding, pregnancy, calving tracking

## Supabase Setup

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for step-by-step instructions on:

1. Creating a Supabase project
2. Finding your API keys (publishable + secret)
3. Running migrations
4. Loading demo/seed data
