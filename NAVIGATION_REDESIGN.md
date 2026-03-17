# 🧭 Navigation Redesign for Breeding Module

## 📊 Current Navigation (6 Tabs)

```
┌─────────────────────────────────────────────┐
│  Home  │  Herd  │  Chute  │  Pastures  │  Calendar  │  Settings  │
└─────────────────────────────────────────────┘
```

**Problem**:
- 6 tabs is already at the limit (iOS HIG recommends max 5)
- Adding "Breeding" as 7th tab would overcrowd
- Settings should be easily accessible but doesn't need dedicated tab

---

## ✅ **OPTION 1: Replace Settings with Breeding** (RECOMMENDED)

Move Settings to header (like most apps), add Breeding tab.

```
┌──────────────────────────────────────────────┐
│  📱 HerdTrackr                    [👤] [⚙️]  │  ← Header with Settings icon
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│  Home  │  Herd  │  Chute  │  Pastures  │  Calendar  │  Breeding  │
└──────────────────────────────────────────────┘
```

**Breeding Tab Contains**:
- Breeding records (all)
- Top producing sires/dams
- Upcoming calvings
- Breeding analytics (future)
- Offspring reports

**Pros**:
- ✅ Clean 6-tab layout (within iOS guidelines)
- ✅ Settings where users expect (top-right)
- ✅ Breeding gets prominent placement
- ✅ Common pattern (most apps do this)

**Cons**:
- ⚠️  Settings slightly less accessible (one extra tap)

---

## ✅ **OPTION 2: Merge Calendar + Breeding**

Rename "Calendar" → "Schedule", combine events.

```
┌─────────────────────────────────────────────┐
│  Home  │  Herd  │  Chute  │  Pastures  │  Schedule  │  Settings  │
└─────────────────────────────────────────────┘
```

**Schedule Tab Contains**:
- Top section: Upcoming events (vaccinations, calvings, tasks)
- Bottom section: Breeding calendar (upcoming/recent births)
- Toggle between "Calendar View" and "Breeding View"

**Pros**:
- ✅ Keeps 6 tabs
- ✅ Logical grouping (time-based events)
- ✅ Settings stays accessible

**Cons**:
- ⚠️  Tab becomes more complex (two views in one)
- ⚠️  May confuse users looking for pure calendar

---

## ✅ **OPTION 3: Move Settings to Dashboard**

Dashboard becomes "Home & Settings" hybrid.

```
┌─────────────────────────────────────────────┐
│  Home  │  Herd  │  Chute  │  Pastures  │  Calendar  │  Breeding  │
└─────────────────────────────────────────────┘
```

**Dashboard Changes**:
- Top 2/3: Current stats, quick actions
- Bottom 1/3: Settings cards (sync, theme, team, subscription)

**Pros**:
- ✅ Dedicated Breeding tab
- ✅ Settings still in single screen
- ✅ Common pattern (many farm apps do this)

**Cons**:
- ⚠️  Dashboard becomes more cluttered

---

## ✅ **OPTION 4: Breeding as Sub-Tab** (NOT RECOMMENDED)

Keep 6 main tabs, add "Breeding" section within Herd.

```
┌─────────────────────────────────────────────┐
│  Home  │  Herd  │  Chute  │  Pastures  │  Calendar  │  Settings  │
└─────────────────────────────────────────────┘

When in Herd tab:
┌──────────────────┐
│ All Animals      │
│ Breeding Records │  ← New section
│ Top Producers    │
└──────────────────┘
```

**Pros**:
- ✅ No navigation changes
- ✅ Keeps Settings tab

**Cons**:
- ❌ Breeding is buried (3 taps to access)
- ❌ Doesn't highlight breeding as key feature
- ❌ Herd tab becomes overloaded

---

## 🎯 **RECOMMENDED: Option 1** (Settings to Header)

### Why This is Best:

1. **Industry Standard**: Instagram, Twitter, Spotify all have settings in header
2. **Clean Tab Bar**: 6 tabs is still manageable
3. **Breeding Prominence**: Gives breeding the attention it deserves
4. **User Expectations**: Users expect settings in top-right

### Implementation:

**Step 1**: Add header to all screens
**Step 2**: Move Settings to header icon
**Step 3**: Add Breeding tab
**Step 4**: Update routing config

---

## 📱 Detailed Design: Option 1

### Header Component (Shared across all tabs)

```typescript
// New component: app/components/AppHeader.tsx
import { View, Pressable } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { Text } from "./Text"
import { useAppTheme } from "@/theme/context"
import { useSyncContext } from "@/context/SyncContext"

export const AppHeader = ({ title }: { title?: string }) => {
  const navigation = useNavigation()
  const { theme: { colors } } = useAppTheme()
  const { status } = useSyncContext()

  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    }}>
      {/* Left: App name or screen title */}
      <Text preset="heading" text={title || "HerdTrackr"} />

      {/* Right: Sync status + Settings icon */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* Sync indicator */}
        {status === "syncing" && (
          <MaterialCommunityIcons
            name="sync"
            size={20}
            color={colors.tint}
            style={{ transform: [{ rotate: "360deg" }] }} // Add animation
          />
        )}

        {/* Settings button */}
        <Pressable onPress={() => navigation.navigate("Settings")}>
          <MaterialCommunityIcons name="cog-outline" size={24} color={colors.text} />
        </Pressable>
      </View>
    </View>
  )
}
```

### New Breeding Tab Screen

```typescript
// New screen: app/screens/BreedingScreen.tsx
import { FC, useState } from "react"
import { View, FlatList, Pressable } from "react-native"
import { Screen, Text, Button } from "@/components"
import { AppHeader } from "@/components/AppHeader"
import { useBreedingRecords } from "@/hooks/useRecords"
import { MaterialCommunityIcons } from "@expo/vector-icons"

export const BreedingScreen: FC = ({ navigation }) => {
  const { themed, theme: { colors } } = useAppTheme()
  const { records: allBreedingRecords } = useBreedingRecords()

  const [view, setView] = useState<"recent" | "upcoming" | "producers">("recent")

  // Filter records based on view
  const recentBreedings = allBreedingRecords
    .filter(r => r.breedingDate)
    .sort((a, b) => b.breedingDate.getTime() - a.breedingDate.getTime())

  const upcomingCalvings = allBreedingRecords
    .filter(r => r.expectedCalvingDate && r.outcome === "pending")
    .sort((a, b) => a.expectedCalvingDate!.getTime() - b.expectedCalvingDate!.getTime())

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]}>
      <AppHeader title="Breeding" />

      {/* View Switcher */}
      <View style={themed($viewSwitcher)}>
        <Pressable
          onPress={() => setView("recent")}
          style={[themed($viewButton), view === "recent" && themed($viewButtonActive)]}
        >
          <Text text="Recent" style={view === "recent" ? { color: "#FFF" } : undefined} />
        </Pressable>
        <Pressable
          onPress={() => setView("upcoming")}
          style={[themed($viewButton), view === "upcoming" && themed($viewButtonActive)]}
        >
          <Text text="Upcoming" style={view === "upcoming" ? { color: "#FFF" } : undefined} />
        </Pressable>
        <Pressable
          onPress={() => setView("producers")}
          style={[themed($viewButton), view === "producers" && themed($viewButtonActive)]}
        >
          <Text text="Top Producers" style={view === "producers" ? { color: "#FFF" } : undefined} />
        </Pressable>
      </View>

      {/* Content based on view */}
      {view === "recent" && (
        <FlatList
          data={recentBreedings}
          renderItem={({ item }) => (
            <BreedingCard record={item} onPress={() => { /* navigate to detail */ }} />
          )}
          ListEmptyComponent={<EmptyState icon="heart" message="No breeding records yet" />}
        />
      )}

      {view === "upcoming" && (
        <FlatList
          data={upcomingCalvings}
          renderItem={({ item }) => (
            <CalvingCard record={item} onPress={() => { /* navigate to detail */ }} />
          )}
          ListEmptyComponent={<EmptyState icon="calendar" message="No upcoming calvings" />}
        />
      )}

      {view === "producers" && (
        <TopProducersView />
      )}

      {/* Floating Action Button */}
      <Pressable
        style={{
          position: "absolute",
          bottom: 80, // Above tab bar
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: colors.tint,
          alignItems: "center",
          justifyContent: "center",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
        onPress={() => navigation.navigate("BreedingRecordForm", { mode: "create" })}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#FFF" />
      </Pressable>
    </Screen>
  )
}
```

### Updated Tab Navigator

```typescript
// MainTabNavigator.tsx changes:

<Tab.Screen
  name="Breeding"
  component={BreedingScreen}
  options={{
    tabBarLabel: "Breeding",
    tabBarIcon: ({ color, focused }) => renderTabIcon("heart", focused, color),
  }}
/>

// Remove Settings tab (now in header)
```

---

## 🎨 Visual Mockup

### Before:
```
┌──────────────────────────────────────────────┐
│                                              │
│  Dashboard content                           │
│                                              │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│  🏠 │ 🐮 │ 🚪 │ 🌱 │ 📅 │ ⚙️ │
└──────────────────────────────────────────────┘
```

### After:
```
┌──────────────────────────────────────────────┐
│  HerdTrackr                     🔄  ⚙️       │  ← New header
├──────────────────────────────────────────────┤
│                                              │
│  Dashboard content                           │
│                                              │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│  🏠 │ 🐮 │ 🚪 │ 🌱 │ 📅 │ ❤️  │  ← Breeding replaces Settings
└──────────────────────────────────────────────┘
```

---

## 🚀 Implementation Checklist

**Phase 1: Header & Settings (2 hours)**
- [ ] Create `AppHeader` component
- [ ] Add header to all tab screens
- [ ] Move Settings to stack navigator (not tab)
- [ ] Test settings navigation from header

**Phase 2: Breeding Tab (3 hours)**
- [ ] Create `BreedingScreen` component
- [ ] Add to tab navigator
- [ ] Implement view switcher (recent/upcoming/producers)
- [ ] Add FAB for new breeding record

**Phase 3: Polish (1 hour)**
- [ ] Update routing config
- [ ] Test all navigation flows
- [ ] Update deep link config

---

## 💡 Alternative: Hybrid Approach

If you want to keep Settings easily accessible:

```
┌──────────────────────────────────────────────┐
│  HerdTrackr          [🔔 3]  [⚙️]  [👤]     │  ← Notifications, Settings, Profile
├──────────────────────────────────────────────┤
│  🏠 │ 🐮 │ 🚪 │ 🌱 │ ❤️  │ More ▾ │
└──────────────────────────────────────────────┘
                              │
                              └─ Calendar
                                 Reports
                                 Team
```

**"More" dropdown shows**:
- Calendar
- Reports
- Team
- Other secondary features

This gives you:
- 5 primary tabs
- Breeding prominent
- Settings in header
- Expandable for future features

---

## 🎯 My Recommendation

**Go with Option 1** (Settings to header):
1. Implement AppHeader (30 min)
2. Add to all screens (30 min)
3. Create BreedingScreen (3 hours)
4. Update MainTabNavigator (30 min)

**Total**: ~5 hours including Phase 1 lineage features

**Want me to implement this now?**
