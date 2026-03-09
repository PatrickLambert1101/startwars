# Development Skills & Patterns for HerdTrackr

## React Native + Expo Patterns

### Screen Component Styling
```typescript
// ✅ CORRECT Pattern
import { Screen, Text, Button, Icon } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export function MyScreen({ navigation }) {
  const { themed } = useAppTheme()

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <Icon icon="back" size={24} />
        </Pressable>
        <Text preset="heading" text="Title" />
      </View>
    </Screen>
  )
}

// Style definitions MUST use function syntax
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})
```

### ThemedStyle Pattern
```typescript
// Import the type
import type { ThemedStyle } from "@/theme/types"

// Define styles as functions that receive theme
const $myStyle: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.md,
  backgroundColor: colors.background,
})

// Use with themed() function call
<View style={themed($myStyle)}>
```

### Common Spacing Values
```typescript
spacing.xxs  // 2
spacing.xs   // 4
spacing.sm   // 8
spacing.md   // 12
spacing.lg   // 16
spacing.xl   // 24
spacing.xxl  // 32
spacing.xxxl // 48
```

## WatermelonDB Patterns

### Model Definition
```typescript
import { Model } from "@nozbe/watermelondb"
import { field, date, readonly, children } from "@nozbe/watermelondb/decorators"

export class MyModel extends Model {
  static table = "my_table"

  static associations = {
    other_table: { type: "has_many" as const, foreignKey: "my_model_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("name") name!: string
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @children("other_table") relatedItems: any
}
```

### CRUD Operations
```typescript
import { database } from "@/db"
import { Q } from "@nozbe/watermelondb"

// Create
const item = await database.write(async () => {
  return database.get("my_table").create((record) => {
    record.name = "Example"
    record.isDeleted = false
  })
})

// Read
const items = await database.get("my_table")
  .query(Q.where("is_deleted", false))
  .fetch()

// Update
await item.update((record) => {
  record.name = "Updated"
})

// Delete (soft delete)
await item.update((record) => {
  record.isDeleted = true
})
```

### Observing Changes
```typescript
import { useEffect, useState } from "react"
import { database } from "@/db"

export function useMyItems() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const subscription = database.get("my_table")
      .query()
      .observe()
      .subscribe(setItems)

    return () => subscription.unsubscribe()
  }, [])

  return { items }
}
```

## Navigation Patterns

### Stack Navigation
```typescript
import { AppStackScreenProps } from "@/navigators"

interface MyScreenProps extends AppStackScreenProps<"MyScreen"> {}

export function MyScreen({ navigation, route }: MyScreenProps) {
  // Access route params
  const { itemId } = route.params

  // Navigate
  navigation.navigate("OtherScreen", { param: "value" })

  // Go back
  navigation.goBack()

  // Replace current screen
  navigation.replace("NewScreen")
}
```

### Tab Navigation
```typescript
import { MainTabScreenProps } from "@/navigators/navigationTypes"

export const MyTabScreen: FC<MainTabScreenProps<"MyTab">> = ({ navigation }) => {
  // Tab screen logic
}
```

## Custom Hooks Patterns

### useAnimals Hook
```typescript
import { useAnimals } from "@/hooks/useAnimals"

export function MyScreen() {
  const { animals, isLoading, createAnimal, updateAnimal, deleteAnimal } = useAnimals()

  const handleCreate = async () => {
    await createAnimal({
      rfidTag: "123456",
      visualTag: "A001",
      breed: "Angus",
      sex: "cow",
    })
  }
}
```

### useProtocols Hook
```typescript
import { useProtocols, useProtocol, useProtocolActions } from "@/hooks/useProtocols"

// List all protocols
const { protocols, isLoading } = useProtocols()

// Single protocol
const { protocol, isLoading } = useProtocol(protocolId)

// Actions
const { createProtocol, updateProtocol, deleteProtocol, toggleProtocolActive } = useProtocolActions()
```

## Form Patterns

### TextField Usage
```typescript
import { TextField } from "@/components"

const [value, setValue] = useState("")

<TextField
  value={value}
  onChangeText={setValue}
  placeholder="Enter text..."
  label="Field Label"
  containerStyle={themed($fieldContainer)}
/>
```

### DateField Usage
```typescript
import { DateField } from "@/components"

const [date, setDate] = useState(new Date())

<DateField
  value={date}
  onChange={setDate}
  label="Select Date"
/>
```

## Styling Patterns

### Card Components
```typescript
const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
})
```

### List Item
```typescript
const $listItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
})
```

### Badge
```typescript
const $badge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 6,
})

const $badgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.primary600,
  fontWeight: "600",
})
```

### Button Styles
```typescript
const $button: ThemedStyle<ViewStyle> = () => ({
  minHeight: 36,
  paddingVertical: 6,
  paddingHorizontal: 16,
})
```

## Context API Patterns

### useAuth
```typescript
import { useAuth } from "@/context/AuthContext"

const { user, isAuthenticated, login, logout, signUp } = useAuth()
```

### useDatabase
```typescript
import { useDatabase } from "@/context/DatabaseContext"

const { currentOrg, isOrgLoading, createOrganization, switchOrganization } = useDatabase()
```

### useSync
```typescript
import { useSync } from "@/hooks/useSync"

const { sync, queueSync, status, lastSynced, error } = useSync()

// Manual sync
await sync()

// Queue background sync (debounced)
queueSync()
```

## Error Handling

### Try-Catch Pattern
```typescript
const handleAction = async () => {
  try {
    await someAsyncOperation()
  } catch (error) {
    console.error("Operation failed:", error)
    // Optionally show user-facing error message
  }
}
```

### Database Error Handling
```typescript
try {
  const items = await database.get("my_table").query().fetch()
} catch (error) {
  console.error("[DB] Failed to fetch items:", error)
  // Fallback or error state
}
```

## Performance Patterns

### useCallback for Event Handlers
```typescript
import { useCallback } from "react"

const handlePress = useCallback((item: Item) => {
  navigation.navigate("Detail", { itemId: item.id })
}, [navigation])
```

### useMemo for Expensive Computations
```typescript
import { useMemo } from "react"

const filteredItems = useMemo(() => {
  return items.filter(item => item.name.includes(search))
}, [items, search])
```

### FlatList Optimization
```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  showsVerticalScrollIndicator={false}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

## Debugging Commands

### Clear Cache
```bash
# Clear Metro bundler cache
npx expo start --clear

# Clear iOS Simulator data
xcrun simctl erase all

# Clear Safari data in simulator
xcrun simctl privacy booted reset all com.apple.mobilesafari

# Clear node_modules cache
rm -rf node_modules/.cache
```

### View Logs
```bash
# iOS logs
npx react-native log-ios

# Android logs
npx react-native log-android

# Expo logs are shown in terminal automatically
```

### Database Inspection
```javascript
// In Chrome DevTools (for web/simulator)
// Application → IndexedDB → herdtrackr_v4

// Or programmatically
import { database } from "@/db"

const orgs = await database.get("organizations").query().fetch()
console.log("Organizations:", orgs.length)
orgs.forEach(o => console.log(o.name))
```

## Build & Deploy Commands

### Development
```bash
# Start dev server
npm start

# iOS simulator
npm start -- --ios

# Android emulator
npm start -- --android

# Web browser
npm start -- --web
```

### Production Builds
```bash
# Configure EAS
eas build:configure

# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production

# Build both
eas build --platform all --profile production
```

### Submission
```bash
# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android

# Submit both
eas submit --platform all
```

### OTA Updates
```bash
# Publish update (JS-only changes)
eas update --channel production --message "Bug fixes"

# View updates
eas update:list
```

## Git Commit Patterns

### Commit Message Format
```bash
# Feature
git commit -m "feat: add treatment protocol creation"

# Bug fix
git commit -m "fix: resolve database persistence issue"

# Style changes
git commit -m "style: improve protocol card design"

# Refactor
git commit -m "refactor: extract protocol form validation"

# Documentation
git commit -m "docs: add deployment guide"

# Chore
git commit -m "chore: bump version to 1.0.1"
```

## Supabase + WatermelonDB Sync Patterns

### ID Management
```typescript
// WatermelonDB uses short TEXT IDs (e.g., "phKpvugYk5ISReFe")
// Supabase should use TEXT for primary keys to match
// EXCEPT for auth.users references which MUST be UUID

// ✅ CORRECT Schema
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,  -- WatermelonDB short ID
  remote_id TEXT,       -- Unused but kept for compatibility
  user_id UUID REFERENCES auth.users(id)  -- Auth references MUST be UUID
);
```

### RLS Policy Patterns for Sync
```sql
-- ❌ WRONG: This blocks upsert because user isn't a member YET
CREATE POLICY "Members can view organizations"
  ON organizations FOR SELECT
  USING (public.is_org_member(id));

-- ✅ CORRECT: Allow viewing newly created orgs briefly
CREATE POLICY "Members can view organizations"
  ON organizations FOR SELECT
  USING (
    public.is_org_member(id) OR
    created_at > NOW() - INTERVAL '10 seconds'
  );
```

### Helper Functions to Avoid RLS Recursion
```sql
-- Use SECURITY DEFINER functions to check membership without recursion
CREATE OR REPLACE FUNCTION public.is_org_member(org_id TEXT, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = org_id
      AND memberships.user_id = is_org_member.user_id
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### Sync Implementation
```typescript
// Convert WatermelonDB record → Supabase row
function watermelonToSupabase(record: any, _table: string) {
  const row: any = { ...record }

  // Convert timestamps (ms) to ISO strings for Supabase
  for (const key of Object.keys(row)) {
    if (key.endsWith("_at") || key.endsWith("_date")) {
      if (row[key] && typeof row[key] === "number") {
        row[key] = new Date(row[key]).toISOString()
      }
    }
  }

  return row  // No ID transformation needed - WatermelonDB IDs are TEXT
}

// Convert Supabase row → WatermelonDB record
function supabaseToWatermelon(row: any) {
  const record: any = { ...row }

  // Convert ISO strings to timestamps (ms) for WatermelonDB
  for (const key of Object.keys(record)) {
    if (key.endsWith("_at") || key.endsWith("_date")) {
      if (record[key] && typeof record[key] === "string") {
        record[key] = new Date(record[key]).getTime()
      }
    }
  }

  return record
}
```

### Trigger Pattern for Auto-Admin
```sql
-- Auto-add creator as admin when org is created
CREATE OR REPLACE FUNCTION public.auto_add_org_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.memberships (
    user_id, organization_id, role, joined_at, is_active
  )
  SELECT auth.uid(), NEW.id, 'admin', NOW(), TRUE
  FROM auth.users WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER org_auto_membership
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_org_owner();
```

## Common Gotchas

1. **Always use `themed($style)` not `themed.$style`**
2. **contentContainerStyle only works with preset="scroll" or "auto"**
3. **Icons must be registered in `iconRegistry` before use**
4. **WatermelonDB creates short TEXT IDs, not UUIDs**
5. **Soft delete with `isDeleted` flag, don't hard delete**
6. **Clear cache when styles don't update**
7. **Use `Q.where()` for queries, not plain objects**
8. **Subscribe to observables in useEffect with cleanup**
9. **Back buttons must be added manually (no Header component)**
10. **Check `safeAreaEdges` prop for proper insets**
11. **Supabase auth.users has UUID IDs - use UUID for all user_id foreign keys**
12. **RLS policies must allow viewing newly created records during upsert operations**
13. **Use SECURITY DEFINER functions to avoid infinite RLS recursion**
14. **Always drop existing triggers before recreating to avoid "already exists" errors**
15. **TEXT IDs from WatermelonDB can be used directly in Supabase (no UUID conversion needed)**
