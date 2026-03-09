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

## Common Gotchas

1. **Always use `themed($style)` not `themed.$style`**
2. **contentContainerStyle only works with preset="scroll" or "auto"**
3. **Icons must be registered in `iconRegistry` before use**
4. **WatermelonDB creates short IDs, not UUIDs**
5. **Soft delete with `isDeleted` flag, don't hard delete**
6. **Clear cache when styles don't update**
7. **Use `Q.where()` for queries, not plain objects**
8. **Subscribe to observables in useEffect with cleanup**
9. **Back buttons must be added manually (no Header component)**
10. **Check `safeAreaEdges` prop for proper insets**
