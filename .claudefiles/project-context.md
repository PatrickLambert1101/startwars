# HerdTrackr Project Context

## Project Overview
HerdTrackr is an offline-first cattle management mobile app built with React Native (Expo) and WatermelonDB. It allows ranchers to track animals, health records, weights, breeding, and treatment protocols.

## Tech Stack
- **Framework**: React Native with Expo
- **Database**: WatermelonDB with SQLite adapter (native) / LokiJS adapter (web)
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Subscriptions**: RevenueCat
- **Navigation**: React Navigation (Native Stack)
- **State Management**: React Context API
- **Styling**: Custom theme system with ThemedStyle

## Critical Styling Pattern

### ⚠️ IMPORTANT: Themed Styles Must Be Function Calls
The app uses a custom theming system. **ALWAYS use function call syntax, NOT dot notation:**

```typescript
// ✅ CORRECT
<View style={themed($container)}>
<Text style={themed($heading)}>

// ❌ WRONG - Will not apply styles!
<View style={themed.$container}>
<Text style={themed.$heading}>
```

### Screen Component Styling
For `preset="fixed"` screens, use `contentContainerStyle`:
```typescript
<Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
```

### Standard Page Layout Pattern
All list/detail screens should follow this structure:

```typescript
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,  // Horizontal padding
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: spacing.md,
  marginBottom: spacing.sm,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
  marginLeft: -spacing.xs,  // Offset to align with edge
})
```

### Example Screen Structure
```typescript
return (
  <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
    <View style={themed($header)}>
      <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
        <Icon icon="back" size={24} />
      </Pressable>
      <Text preset="heading" text="Page Title" style={themed($headerTitle)} />
      <Button text="+ New" onPress={handleCreate} style={themed($createButton)} />
    </View>

    {/* Content */}
  </Screen>
)
```

## Database Architecture

### Local Database (WatermelonDB)
- **Adapter**: SQLiteAdapter for iOS/Android (better performance, reliable persistence)
- **Schema Version**: 4
- **Database Name**: `herdtrackr_v4` (changed from `herdtrackr` to force clean migration)
- **Migration System**: WatermelonDB schema migrations from v2 → v3 → v4

### Models
1. **Organization** - Farm/ranch organization
2. **Animal** - Individual livestock
3. **HealthRecord** - Vaccinations, treatments, vet visits
4. **WeightRecord** - Weight tracking over time
5. **BreedingRecord** - Breeding history and calving
6. **TreatmentProtocol** - Reusable vaccine/treatment schedules

### Supabase Sync Requirements
For WatermelonDB sync to work, ALL Supabase tables MUST have:
- `_changed` TEXT column - Tracks which fields changed
- `_status` TEXT column - Tracks sync status ('created', 'updated', 'deleted')
- Indexes on both columns for performance

**Migration**: `supabase/migrations/00002_add_watermelondb_sync.sql` adds these columns.

### Common Database Issues

#### Issue: Database Resets on Refresh
**Cause**: LokiJS adapter has a known bug where it detects schema mismatches and wipes data
**Solution**: Switched to SQLiteAdapter (more reliable for native apps)

#### Issue: IndexedDB Corruption (Web/Simulator)
**Solution**: Clear IndexedDB manually:
```bash
# iOS Simulator
xcrun simctl privacy booted reset all com.apple.mobilesafari

# Or clear from browser DevTools:
# Application → IndexedDB → Right-click "herdtrackr" → Delete
```

#### Issue: Sync Errors - "invalid input syntax for type uuid"
**Cause**: WatermelonDB generates short IDs like "sE6MuIVYLzxIcF2Z" but Supabase expects UUIDs
**Status**: Known issue, sync currently disabled

## Navigation Structure

```
AppNavigator (Stack)
├── Landing (unauthenticated)
├── Login (unauthenticated)
└── Main (authenticated)
    ├── Dashboard (tab)
    ├── HerdList (tab)
    ├── Chute (tab)
    ├── Pastures (tab)
    ├── Reports (tab)
    └── Settings (tab)
        └── TreatmentProtocols (stack)
            ├── ProtocolForm
            └── ProtocolDetail
```

### Navigation Pattern
- All screens have `headerShown: false` (handled by Screen component)
- Stack screens need manual back buttons
- Use `navigation.goBack()` for back navigation
- Use `navigation.navigate("Screen", { params })` for forward navigation

## Component Patterns

### Available Components
Located in `app/components/`:
- `Screen` - Base screen wrapper with safe areas
- `Text` - Themed text component
- `Button` - Themed button
- `Icon` - Icon component (using `iconRegistry`)
- `TextField` - Text input
- `DateField` - Date picker
- `ListItem` - List row component
- `EmptyState` - Empty state placeholder

**Note**: There is NO `Header` component - build headers manually in each screen

### Icon Usage
```typescript
import { Icon } from "@/components"

<Icon icon="back" size={24} />
<Icon icon="settings" size={20} color={colors.palette.primary500} />
```

## Deployment

### Prerequisites
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Environment Variables
Create `.env.production`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your-ios-key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your-android-key
```

### Build & Deploy Commands
```bash
# Build both platforms
eas build --platform all --profile production

# Submit to stores
eas submit --platform all

# Automated release (updates version, builds, creates git tag)
./scripts/release.sh 1.0.0

# OTA update (JS-only changes, no native code)
eas update --channel production --message "Bug fixes"

# Web deployment
npx expo export:web
vercel --prod
```

### Supabase Setup
1. Apply migrations via SQL Editor or CLI:
```bash
# Apply all migrations
npx supabase db push

# Or manually in SQL Editor:
# - Run supabase/migrations/00001_initial_schema.sql
# - Run supabase/migrations/00002_add_watermelondb_sync.sql
# - Run supabase/migrations/00003_fix_rls_recursion.sql
```

2. Verify `_changed` and `_status` columns exist in all tables

## Common Pitfalls

### 1. Cache Issues
**Symptom**: Code changes don't appear after reload
**Solution**:
```bash
# Stop app (Ctrl+C)
npx expo start --clear
# Then press 'i' for iOS
```

### 2. Themed Styles Not Working
**Symptom**: No padding, wrong colors, missing styles
**Cause**: Using `themed.$style` instead of `themed($style)`
**Solution**: Always use function call syntax

### 3. Screen Component Not Applying Container Styles
**Symptom**: No padding on screen
**Cause**: Wrong prop for fixed preset
**Solution**: Use `contentContainerStyle` for fixed preset

### 4. Missing Back Button
**Symptom**: No way to navigate back
**Cause**: Forgot to add manual back button (no Header component)
**Solution**: Add Pressable with back icon:
```typescript
<Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
  <Icon icon="back" size={24} />
</Pressable>
```

### 5. Data Not Persisting
**Symptom**: Database resets on refresh
**Causes**:
- Using LokiJS adapter (switch to SQLite for native)
- Corrupted IndexedDB cache (clear it)
- Schema version mismatch (bumped from v3 → v4)

## File Structure

```
app/
├── components/        # Reusable UI components
├── context/          # React contexts (Auth, Database, Sync, Subscription)
├── db/
│   ├── models/       # WatermelonDB models
│   ├── schema.ts     # Database schema & migrations
│   └── index.ts      # Database initialization
├── hooks/            # Custom React hooks
├── navigators/       # Navigation configuration
├── screens/          # Screen components
├── services/         # API services (Supabase, sync)
├── theme/            # Theming system
└── utils/            # Utility functions

supabase/
├── migrations/       # Database migrations
└── seed/            # Seed data

scripts/
├── release.sh       # Automated release script
└── deploy-web.sh    # Web deployment script
```

## Development Workflow

1. **Make code changes**
2. **Test on simulator**: `npm start` → press `i`
3. **If cache issues**: `npx expo start --clear`
4. **Clear database if needed**:
   ```bash
   # iOS Simulator
   xcrun simctl privacy booted reset all com.apple.mobilesafari
   ```
5. **Commit changes**: Standard git workflow
6. **Deploy**: Use release scripts in `scripts/`

## Testing Checklist

Before deploying:
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test offline functionality
- [ ] Test data persistence (create, refresh, verify still there)
- [ ] Test sync (if enabled)
- [ ] Test all CRUD operations
- [ ] Check for console errors
- [ ] Verify proper styling on all screens

## Key Context for AI Assistants

1. **ALWAYS use `themed($style)` not `themed.$style`** - This is the #1 mistake
2. **Back buttons are manual** - No Header component exists
3. **Padding pattern**: `paddingHorizontal: spacing.lg` for containers
4. **Database**: SQLite adapter, version 4, name `herdtrackr_v4`
5. **Sync is disabled** due to UUID mismatch issue
6. **Cache clearing** is often needed during development
7. **Follow HerdListScreen** as the reference pattern for list screens
8. **All screens** use `preset="fixed"` with `contentContainerStyle`

## Current Known Issues

1. **Sync Disabled**: WatermelonDB uses short IDs, Supabase expects UUIDs
2. **AutoSync Commented Out**: See `app/app.tsx` line 94
3. **Web Performance**: LokiJS shows deprecation warnings for `useIncrementalIndexedDB: false`

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [WatermelonDB Docs](https://watermelondb.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
- Deployment Guide: `DEPLOYMENT_GUIDE.md`
- Supabase Setup: `SUPABASE_SETUP.md`
