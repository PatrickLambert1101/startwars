# 🚀 Lineage Quick Wins - Implementation Guide

## Phase 1: What You Should Build Now (11 hours)

### 1️⃣ Enhanced Lineage Display (2 hours) ⭐⭐⭐

**Add to `AnimalDetailScreen.tsx` overview tab:**

```typescript
// After registration number, before notes
{animal.sireId || animal.damId ? (
  <View style={themed($lineageSection)}>
    <Text preset="formLabel" text="Lineage" style={themed($sectionLabel)} />

    {/* Sire */}
    {animal.sireId && (
      <Pressable
        onPress={async () => {
          const sire = await database.get('animals').find(animal.sireId!)
          navigation.navigate("AnimalDetail", { animalId: sire.id })
        }}
        style={themed($lineageRow)}
      >
        <MaterialCommunityIcons name="gender-male" size={18} color={colors.tint} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text text="Sire" size="xs" style={themed($dimText)} />
          <Text text={sireName || 'Loading...'} preset="bold" />
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
      </Pressable>
    )}

    {/* Dam */}
    {animal.damId && (
      <Pressable
        onPress={async () => {
          const dam = await database.get('animals').find(animal.damId!)
          navigation.navigate("AnimalDetail", { animalId: dam.id })
        }}
        style={themed($lineageRow)}
      >
        <MaterialCommunityIcons name="gender-female" size={18} color={colors.palette.accent500} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text text="Dam" size="xs" style={themed($dimText)} />
          <Text text={damName || 'Loading...'} preset="bold" />
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
      </Pressable>
    )}
  </View>
) : null}
```

**Add state to load sire/dam names:**
```typescript
const [sireName, setSireName] = useState<string | null>(null)
const [damName, setDamName] = useState<string | null>(null)

useEffect(() => {
  const loadParents = async () => {
    if (animal?.sireId) {
      const sire = await database.get('animals').find(animal.sireId)
      setSireName(sire.displayName)
    }
    if (animal?.damId) {
      const dam = await database.get('animals').find(animal.damId)
      setDamName(dam.displayName)
    }
  }
  loadParents()
}, [animal?.sireId, animal?.damId])
```

---

### 2️⃣ Offspring Tracking (4 hours) ⭐⭐⭐

**Create new hook: `app/hooks/useOffspring.ts`**

```typescript
import { useMemo } from "react"
import { Q } from "@nozbe/watermelondb"
import { useDatabase } from "@react-native-community/hooks"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"

export function useOffspring(animalId: string) {
  const [offspring, setOffspring] = useState<Animal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadOffspring = async () => {
      setIsLoading(true)
      try {
        // Find where this animal is the sire
        const asS ire = await database.get<Animal>("animals")
          .query(Q.where("sire_id", animalId), Q.where("is_deleted", false))
          .fetch()

        // Find where this animal is the dam
        const asDam = await database.get<Animal>("animals")
          .query(Q.where("dam_id", animalId), Q.where("is_deleted", false))
          .fetch()

        // Combine and deduplicate
        const all = [...asSire, ...asDam]
        const unique = Array.from(new Set(all.map(a => a.id))).map(id =>
          all.find(a => a.id === id)!
        )

        setOffspring(unique)
      } catch (error) {
        console.error("Failed to load offspring:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOffspring()
  }, [animalId])

  const stats = useMemo(() => {
    const total = offspring.length
    const alive = offspring.filter(a => a.status === "active").length
    const sold = offspring.filter(a => a.status === "sold").length
    const deceased = offspring.filter(a => a.status === "deceased").length
    const male = offspring.filter(a => a.sex === "male").length
    const female = offspring.filter(a => a.sex === "female").length

    return { total, alive, sold, deceased, male, female }
  }, [offspring])

  return { offspring, stats, isLoading }
}
```

**Add to `AnimalDetailScreen.tsx` breeding tab:**

```typescript
import { useOffspring } from "@/hooks/useOffspring"

// In component
const { offspring, stats } = useOffspring(animalId)

// In breeding tab, BEFORE breeding records
{stats.total > 0 && (
  <>
    <Text preset="subheading" text="Offspring" style={themed($sectionTitle)} />

    {/* Stats Card */}
    <View style={themed($offspringStatsCard)}>
      <View style={themed($statRow)}>
        <View style={themed($statItem)}>
          <Text text={stats.total.toString()} preset="heading" style={{ color: colors.tint }} />
          <Text text="Total" size="xs" style={themed($dimText)} />
        </View>
        <View style={themed($statItem)}>
          <Text text={stats.alive.toString()} preset="heading" style={{ color: colors.palette.primary500 }} />
          <Text text="Active" size="xs" style={themed($dimText)} />
        </View>
        <View style={themed($statItem)}>
          <Text text={stats.male.toString()} preset="heading" />
          <Text text="Male" size="xs" style={themed($dimText)} />
        </View>
        <View style={themed($statItem)}>
          <Text text={stats.female.toString()} preset="heading" />
          <Text text="Female" size="xs" style={themed($dimText)} />
        </View>
      </View>
    </View>

    {/* Offspring List */}
    <View style={themed($offspringList)}>
      {offspring.slice(0, 5).map((child) => (
        <Pressable
          key={child.id}
          onPress={() => navigation.navigate("AnimalDetail", { animalId: child.id })}
          style={themed($offspringRow)}
        >
          <View style={{ flex: 1 }}>
            <Text text={child.displayName} preset="bold" />
            <Text text={`${child.breed} | ${child.sexLabel}`} size="xs" style={themed($dimText)} />
          </View>
          <View style={[$statusBadge, { backgroundColor: colors.tint + "22" }]}>
            <Text text={child.status} size="xxs" style={{ color: colors.tint }} />
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
        </Pressable>
      ))}

      {offspring.length > 5 && (
        <Text text={`+ ${offspring.length - 5} more`} size="sm" style={themed($dimText)} />
      )}
    </View>
  </>
)}
```

**Add styles:**
```typescript
const $offspringStatsCard: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: colors.border,
})

const $statRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-around",
})

const $statItem: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
})

const $offspringList: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
  marginBottom: spacing.lg,
})

const $offspringRow: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.md,
  backgroundColor: colors.background,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.border,
  gap: spacing.sm,
})
```

---

### 3️⃣ Genetic Traits (5 hours) ⭐⭐⭐

**Update `Animal` model:**

```typescript
// In Animal.ts
@field("genetic_traits") geneticTraits!: string | null

get traits(): GeneticTraits | null {
  try {
    return this.geneticTraits ? JSON.parse(this.geneticTraits) : null
  } catch {
    return null
  }
}
```

**Create type definition: `app/types/GeneticTraits.ts`**

```typescript
export type HornType = "polled" | "horned" | "scurred" | "unknown"
export type Temperament = "docile" | "average" | "flighty" | "aggressive" | null
export type ProductionLevel = "low" | "average" | "high" | null

export type GeneticTraits = {
  // Physical traits
  horns?: HornType
  coatColor?: string
  coatPattern?: "solid" | "spotted" | "brindled" | "roan" | null

  // Behavioral
  temperament?: Temperament

  // Production (optional)
  milkProduction?: ProductionLevel
  meatQuality?: ProductionLevel

  // Custom notes
  notes?: string
}

export const HORN_OPTIONS: HornType[] = ["polled", "horned", "scurred", "unknown"]
export const TEMPERAMENT_OPTIONS: Temperament[] = ["docile", "average", "flighty", "aggressive"]

// Breed-specific coat colors
export const COAT_COLORS_CATTLE = [
  "Black", "Red", "White", "Brown", "Brindle", "Dun", "Grey", "Mixed"
]
```

**Add to animal form: `AnimalFormScreen.tsx`**

```typescript
import { GeneticTraits, HORN_OPTIONS, TEMPERAMENT_OPTIONS, COAT_COLORS_CATTLE } from "@/types/GeneticTraits"

// State
const [traits, setTraits] = useState<GeneticTraits>({})

// In form, add new section after "Notes"
<View style={themed($section)}>
  <Text preset="subheading" text="Genetic Traits (Optional)" style={themed($sectionTitle)} />

  {/* Horns */}
  <Text text="Horns" preset="formLabel" />
  <View style={themed($buttonRow)}>
    {HORN_OPTIONS.map((option) => (
      <Pressable
        key={option}
        onPress={() => setTraits({ ...traits, horns: option })}
        style={themed(traits.horns === option ? $pillActive : $pill)}
      >
        <Text text={option} size="sm" style={traits.horns === option ? { color: "#FFF" } : undefined} />
      </Pressable>
    ))}
  </View>

  {/* Coat Color */}
  <TextField
    label="Coat Color"
    value={traits.coatColor || ""}
    onChangeText={(color) => setTraits({ ...traits, coatColor: color })}
    placeholder="e.g., Black, Red"
  />

  {/* Temperament */}
  <Text text="Temperament" preset="formLabel" />
  <View style={themed($buttonRow)}>
    {TEMPERAMENT_OPTIONS.map((option) => (
      <Pressable
        key={option || "none"}
        onPress={() => setTraits({ ...traits, temperament: option })}
        style={themed(traits.temperament === option ? $pillActive : $pill)}
      >
        <Text
          text={option || "None"}
          size="sm"
          style={traits.temperament === option ? { color: "#FFF" } : undefined}
        />
      </Pressable>
    ))}
  </View>
</View>

// In handleSubmit, add to formData:
geneticTraits: Object.keys(traits).length > 0 ? JSON.stringify(traits) : null
```

**Display in animal detail overview:**

```typescript
{animal.traits && (
  <View style={themed($traitsSection)}>
    <Text preset="formLabel" text="Genetic Traits" style={themed($sectionLabel)} />

    <View style={themed($traitsGrid)}>
      {animal.traits.horns && (
        <View style={themed($traitChip)}>
          <MaterialCommunityIcons name="cow" size={14} color={colors.tint} />
          <Text text={animal.traits.horns} size="xs" style={{ marginLeft: 4 }} />
        </View>
      )}

      {animal.traits.coatColor && (
        <View style={themed($traitChip)}>
          <MaterialCommunityIcons name="palette" size={14} color={colors.tint} />
          <Text text={animal.traits.coatColor} size="xs" style={{ marginLeft: 4 }} />
        </View>
      )}

      {animal.traits.temperament && (
        <View style={themed($traitChip)}>
          <MaterialCommunityIcons name="heart" size={14} color={colors.tint} />
          <Text text={animal.traits.temperament} size="xs" style={{ marginLeft: 4 }} />
        </View>
      )}
    </View>
  </View>
)}
```

**Add migration: `app/db/schema.ts`**

```typescript
// In migrations array, add new version
{
  toVersion: 9, // increment from current version
  steps: [
    {
      type: "add_columns",
      table: "animals",
      columns: [
        { name: "genetic_traits", type: "string", isOptional: true },
      ],
    },
  ],
}
```

**Update schema version:**
```typescript
export const schema = appSchema({
  version: 9, // increment
  // ... rest of schema
})
```

---

## 📊 Results After Phase 1

### Before:
```
Lineage: Just sireId/damId in database (not visible to users)
```

### After:
```
✅ Tap to view sire/dam from animal detail
✅ See offspring count and list
✅ Track polled/horned, coat color, temperament
✅ Filter herd by genetic traits (future enhancement)
```

---

## 🎯 Testing Checklist

- [ ] Create animal with sire/dam, verify lineage shows in detail screen
- [ ] Tap sire/dam, verify navigation works
- [ ] Create multiple offspring, verify stats are correct
- [ ] Add genetic traits to animal, verify they save and display
- [ ] Edit animal, verify traits persist
- [ ] Test with animals that have no lineage data (should show nothing)
- [ ] Test offspring display with 0, 1, 5, 10+ offspring

---

## 💡 Quick Enhancement Ideas (Extra 30 min each)

### A. Badges for Productive Animals
```typescript
// In animal detail, show badge if animal is top producer
{stats.total >= 10 && (
  <View style={[$badge, { backgroundColor: colors.palette.accent500 }]}>
    <MaterialCommunityIcons name="star" size={12} color="#FFF" />
    <Text text="Top Producer" size="xxs" style={{ color: "#FFF", marginLeft: 4 }} />
  </View>
)}
```

### B. Quick Filter "Show Breeding Stock"
```typescript
// In HerdListScreen, add filter button
const breedingStock = animals.filter(a =>
  a.status === "active" &&
  ((a.sex === "male" && a.age > 12) || (a.sex === "female" && a.age > 15))
)
```

### C. Export Offspring List
```typescript
// Add to offspring section
<Button
  text="Export Offspring CSV"
  onPress={() => exportOffspringToCSV(offspring)}
  preset="default"
/>
```

---

## 🚀 Ready to Implement?

**Step 1**: Start with Enhanced Lineage Display (2 hrs)
**Step 2**: Add Offspring Tracking (4 hrs)
**Step 3**: Add Genetic Traits (5 hrs)

**Total**: ~11 hours of work for massive competitive advantage!

After this, you'll have lineage features on par with apps like:
- CattleMax
- Herdwatch (basic tier)
- Ranch Manager

**Want me to implement Phase 1 for you?** I can do it now!
