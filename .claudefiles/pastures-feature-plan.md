# Pastures Feature - Complete Plan

## Overview
Implement a comprehensive pasture rotation management system that allows ranchers to:
- Create and manage multiple pastures/paddocks
- Track animal movements between pastures
- Monitor grazing days and rest periods
- View pasture history and health metrics
- Optimize rotational grazing for soil and forage health

## Database Schema

### Pasture Model
```typescript
export class Pasture extends Model {
  static table = "pastures"

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("name") name!: string                      // e.g., "North Paddock", "Lower 40"
  @field("code") code!: string                      // Short code like "NP", "L40"
  @field("size_hectares") sizeHectares!: number | null  // Pasture size
  @field("location_notes") locationNotes!: string | null
  @field("forage_type") forageType!: string | null  // "mixed grass", "kikuyu", "lucerne", etc.
  @field("water_source") waterSource!: string | null // "dam", "trough", "river", etc.
  @field("fence_type") fenceType!: string | null    // "electric", "barbed", "game fence"

  // Rotation settings
  @field("max_capacity") maxCapacity!: number | null     // Max number of animals
  @field("target_grazing_days") targetGrazingDays!: number | null  // Target days before rotation
  @field("target_rest_days") targetRestDays!: number | null        // Days to rest before re-use

  // Current state
  @field("current_animal_count") currentAnimalCount!: number  // Current occupancy
  @date("last_grazed_date") lastGrazedDate!: Date | null      // When animals last entered
  @date("available_from_date") availableFromDate!: Date | null // When pasture ready again

  // Management
  @field("is_active") isActive!: boolean
  @field("notes") notes!: string | null
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any
  @children("pasture_movements") movements!: Query<Model>

  // Computed properties
  get isOccupied(): boolean {
    return this.currentAnimalCount > 0
  }

  get isOverCapacity(): boolean {
    return this.maxCapacity !== null && this.currentAnimalCount > this.maxCapacity
  }

  get daysGrazed(): number {
    if (!this.lastGrazedDate || !this.isOccupied) return 0
    const now = new Date()
    const diff = now.getTime() - this.lastGrazedDate.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  get shouldRotate(): boolean {
    if (!this.targetGrazingDays) return false
    return this.daysGrazed >= this.targetGrazingDays
  }

  get statusColor(): "green" | "yellow" | "red" {
    if (!this.isOccupied) return "green"
    if (this.shouldRotate || this.isOverCapacity) return "red"
    if (this.daysGrazed > this.targetGrazingDays * 0.7) return "yellow"
    return "green"
  }
}
```

### PastureMovement Model
Tracks every time animals move in/out of a pasture.

```typescript
export type MovementType = "move_in" | "move_out"

export class PastureMovement extends Model {
  static table = "pasture_movements"

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("pasture_id") pastureId!: string
  @field("animal_id") animalId!: string
  @date("movement_date") movementDate!: Date
  @field("movement_type") movementType!: MovementType  // "move_in" | "move_out"
  @field("moved_by") movedBy!: string | null           // User who performed the movement
  @field("notes") notes!: string | null
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any
  @relation("pastures", "pasture_id") pasture: any
  @relation("animals", "animal_id") animal: any
}
```

### Update Animal Model
Add current pasture tracking:

```typescript
// Add to Animal model
@field("current_pasture_id") currentPastureId!: string | null
@relation("pastures", "current_pasture_id") currentPasture: any
```

## Database Migration

```typescript
{
  toVersion: 5,
  steps: [
    {
      type: "create_table",
      table: "pastures",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "organization_id", type: "string", isIndexed: true },
        { name: "name", type: "string" },
        { name: "code", type: "string" },
        { name: "size_hectares", type: "number", isOptional: true },
        { name: "location_notes", type: "string", isOptional: true },
        { name: "forage_type", type: "string", isOptional: true },
        { name: "water_source", type: "string", isOptional: true },
        { name: "fence_type", type: "string", isOptional: true },
        { name: "max_capacity", type: "number", isOptional: true },
        { name: "target_grazing_days", type: "number", isOptional: true },
        { name: "target_rest_days", type: "number", isOptional: true },
        { name: "current_animal_count", type: "number" },
        { name: "last_grazed_date", type: "number", isOptional: true },
        { name: "available_from_date", type: "number", isOptional: true },
        { name: "is_active", type: "boolean" },
        { name: "notes", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "is_deleted", type: "boolean" },
      ],
    },
    {
      type: "create_table",
      table: "pasture_movements",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "organization_id", type: "string", isIndexed: true },
        { name: "pasture_id", type: "string", isIndexed: true },
        { name: "animal_id", type: "string", isIndexed: true },
        { name: "movement_date", type: "number" },
        { name: "movement_type", type: "string" },
        { name: "moved_by", type: "string", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "is_deleted", type: "boolean" },
      ],
    },
    {
      type: "add_columns",
      table: "animals",
      columns: [
        { name: "current_pasture_id", type: "string", isOptional: true, isIndexed: true },
      ],
    },
  ],
}
```

## Custom Hooks

### usePastures Hook
```typescript
export function usePastures() {
  const [pastures, setPastures] = useState<Pasture[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentOrg } = useDatabase()

  useEffect(() => {
    const subscription = database
      .get<Pasture>("pastures")
      .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
      .observe()
      .subscribe(setPastures)

    setIsLoading(false)
    return () => subscription.unsubscribe()
  }, [currentOrg])

  return { pastures, isLoading }
}

export function usePasture(pastureId: string) {
  const [pasture, setPasture] = useState<Pasture | null>(null)

  useEffect(() => {
    const subscription = database
      .get<Pasture>("pastures")
      .findAndObserve(pastureId)
      .subscribe(setPasture)

    return () => subscription.unsubscribe()
  }, [pastureId])

  return { pasture }
}

export function usePastureStats(pastureId: string) {
  const [stats, setStats] = useState({
    totalAnimals: 0,
    totalMovementsIn: 0,
    totalMovementsOut: 0,
    averageGrazingDays: 0,
    lastMovementDate: null as Date | null,
  })

  useEffect(() => {
    // Calculate stats from pasture_movements
    // ...implementation
  }, [pastureId])

  return stats
}

export function usePastureActions() {
  const { currentOrg } = useDatabase()

  const createPasture = async (data: PastureFormData) => {
    await database.write(async () => {
      await database.get<Pasture>("pastures").create((pasture) => {
        pasture.organizationId = currentOrg.id
        pasture.name = data.name
        pasture.code = data.code
        pasture.sizeHectares = data.sizeHectares || null
        pasture.maxCapacity = data.maxCapacity || null
        pasture.targetGrazingDays = data.targetGrazingDays || null
        pasture.targetRestDays = data.targetRestDays || null
        pasture.currentAnimalCount = 0
        pasture.isActive = true
        pasture.isDeleted = false
      })
    })
  }

  const moveAnimalsIn = async (pastureId: string, animalIds: string[]) => {
    await database.write(async () => {
      const pasture = await database.get<Pasture>("pastures").find(pastureId)
      const now = new Date()

      // Create movement records
      for (const animalId of animalIds) {
        await database.get<PastureMovement>("pasture_movements").create((movement) => {
          movement.organizationId = currentOrg.id
          movement.pastureId = pastureId
          movement.animalId = animalId
          movement.movementDate = now
          movement.movementType = "move_in"
          movement.isDeleted = false
        })

        // Update animal's current pasture
        const animal = await database.get<Animal>("animals").find(animalId)
        await animal.update((a) => {
          a.currentPastureId = pastureId
        })
      }

      // Update pasture stats
      await pasture.update((p) => {
        p.currentAnimalCount += animalIds.length
        p.lastGrazedDate = now
      })
    })
  }

  const moveAnimalsOut = async (pastureId: string, animalIds: string[]) => {
    await database.write(async () => {
      const pasture = await database.get<Pasture>("pastures").find(pastureId)
      const now = new Date()

      // Create movement records
      for (const animalId of animalIds) {
        await database.get<PastureMovement>("pasture_movements").create((movement) => {
          movement.organizationId = currentOrg.id
          movement.pastureId = pastureId
          movement.animalId = animalId
          movement.movementDate = now
          movement.movementType = "move_out"
          movement.isDeleted = false
        })

        // Clear animal's current pasture
        const animal = await database.get<Animal>("animals").find(animalId)
        await animal.update((a) => {
          a.currentPastureId = null
        })
      }

      // Update pasture stats
      await pasture.update((p) => {
        p.currentAnimalCount -= animalIds.length
        // If empty, calculate next available date
        if (p.currentAnimalCount === 0 && p.targetRestDays) {
          const availableDate = new Date(now)
          availableDate.setDate(availableDate.getDate() + p.targetRestDays)
          p.availableFromDate = availableDate
        }
      })
    })
  }

  return { createPasture, moveAnimalsIn, moveAnimalsOut }
}
```

## Screen Components

### 1. PasturesScreen (List View)
**Location**: `app/screens/PasturesScreen/PasturesScreen.tsx`

**Features**:
- Grid/list of all pastures with cards showing:
  - Pasture name and code
  - Current occupancy (e.g., "12 / 50 animals")
  - Days grazed indicator
  - Status badge (Available, In Use, Needs Rotation, Over Capacity)
  - Visual progress bar for grazing days
- Filter by status (all, occupied, empty, needs rotation)
- Sort by name, occupancy, days grazed
- Quick stats at top: Total pastures, total animals in pastures, average rotation
- "+ New Pasture" button
- Tap pasture card to view details

**UI Design**:
```
┌────────────────────────────────────┐
│ [<] Pasture Rotation        [+ New]│
├────────────────────────────────────┤
│ 📊 5 Pastures • 42 Animals         │
├────────────────────────────────────┤
│ ┌──────────────────────────────┐   │
│ │ North Paddock (NP)      🟢   │   │
│ │ 12 / 50 animals              │   │
│ │ ▓▓▓░░░░ 3 days grazed        │   │
│ │ Mixed grass • Dam water      │   │
│ └──────────────────────────────┘   │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ Lower 40 (L40)          🟡   │   │
│ │ 28 / 30 animals              │   │
│ │ ▓▓▓▓▓▓░ 6/7 days (rotate!)   │   │
│ │ Kikuyu • Trough water        │   │
│ └──────────────────────────────┘   │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ Upper Field (UF)        🟢   │   │
│ │ Empty • Ready               │   │
│ │ Available in 0 days          │   │
│ │ Lucerne • River access       │   │
│ └──────────────────────────────┘   │
└────────────────────────────────────┘
```

### 2. PastureDetailScreen
**Location**: `app/screens/PastureDetailScreen/PastureDetailScreen.tsx`

**Features**:
- Header: Pasture name, edit button, status badge
- Quick stats cards:
  - Current occupancy
  - Days grazed
  - Total lifetime movements
  - Average grazing period
- Current animals section:
  - List of animals currently in this pasture
  - Quick "Move Out" button for each animal
  - "Move All Out" batch action
- Movement history:
  - Timeline of all movements in/out
  - Show animal tag, date, type (in/out)
  - Filter by date range
- Pasture details:
  - Size, forage type, water source, fence type
  - Target grazing/rest days
  - Max capacity
  - Notes
- Action buttons:
  - "Scan Animals In"
  - "Scan Animals Out"
  - "Edit Pasture"
  - "Deactivate Pasture"

**UI Design**:
```
┌────────────────────────────────────┐
│ [<] North Paddock (NP)    [Edit] │
│                              🟢   │
├────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│ │ 12 │ │ 3  │ │154 │ │4.2 │       │
│ │Anim│ │Days│ │Move│ │Avg │       │
│ └────┘ └────┘ └────┘ └────┘       │
├────────────────────────────────────┤
│ Current Animals (12)               │
│ ┌──────────────────────────────┐   │
│ │ A001 • Nguni • Bull      [⬆]│   │
│ │ A002 • Bonsmara • Cow    [⬆]│   │
│ │ ...                          │   │
│ └──────────────────────────────┘   │
│ [Move All Out (12)]                │
├────────────────────────────────────┤
│ Movement History                   │
│ ┌──────────────────────────────┐   │
│ │ ⬇ A001 moved in  • 3 days ago│   │
│ │ ⬆ B023 moved out • 5 days ago│   │
│ │ ⬇ A002 moved in  • 3 days ago│   │
│ └──────────────────────────────┘   │
├────────────────────────────────────┤
│ Details                            │
│ Size: 40 hectares                  │
│ Forage: Mixed grass                │
│ Water: Dam                         │
│ Capacity: 50 animals               │
│ Target grazing: 7 days             │
│ Target rest: 28 days               │
├────────────────────────────────────┤
│ [Scan Animals In]                  │
│ [Scan Animals Out]                 │
└────────────────────────────────────┘
```

### 3. PastureFormScreen
**Location**: `app/screens/PastureFormScreen/PastureFormScreen.tsx`

**Features**:
- Form fields:
  - Pasture name (required)
  - Short code (required, auto-suggest from name)
  - Size in hectares (optional)
  - Location notes (optional)
  - Forage type dropdown (mixed grass, kikuyu, lucerne, custom)
  - Water source dropdown (dam, trough, river, borehole, none, custom)
  - Fence type dropdown (electric, barbed wire, game fence, custom)
  - Max capacity (optional number input)
  - Target grazing days (optional, default 7)
  - Target rest days (optional, default 28)
  - Notes (optional multiline)
- Save/Cancel buttons

### 4. MovementFormScreen
**Location**: `app/screens/MovementFormScreen/MovementFormScreen.tsx`

**Features**:
- Select movement type: "Move In" or "Move Out"
- Select pasture (dropdown or picker)
- Scan/select animals:
  - RFID scanner integration
  - Manual animal picker (multiselect)
  - Show selected animal count
  - Clear all / remove individual
- Movement date (defaults to now)
- Optional notes
- Submit button: "Move 12 Animals In" or "Move 8 Animals Out"

**RFID Integration**:
- Tap "Scan Animals" button
- Opens camera/scanner
- Beep confirmation for each successful scan
- Add scanned animal to list
- Show visual feedback (green check)
- Allow continuous scanning until "Done"

**UI Design**:
```
┌────────────────────────────────────┐
│ [<] Move Animals                   │
├────────────────────────────────────┤
│ Movement Type                      │
│ ◉ Move In    ○ Move Out            │
├────────────────────────────────────┤
│ Pasture                            │
│ ┌──────────────────────────────┐   │
│ │ North Paddock (NP)        ▼ │   │
│ └──────────────────────────────┘   │
├────────────────────────────────────┤
│ Animals (3 selected)               │
│ [📷 Scan RFID] [+ Select Manually] │
│ ┌──────────────────────────────┐   │
│ │ ✓ A001 • Nguni Bull      [×]│   │
│ │ ✓ A002 • Bonsmara Cow    [×]│   │
│ │ ✓ B015 • Angus Steer     [×]│   │
│ └──────────────────────────────┘   │
│ [Clear All]                        │
├────────────────────────────────────┤
│ Movement Date                      │
│ ┌──────────────────────────────┐   │
│ │ Today, Mar 8, 2026        📅 │   │
│ └──────────────────────────────┘   │
├────────────────────────────────────┤
│ Notes (Optional)                   │
│ ┌──────────────────────────────┐   │
│ │                              │   │
│ └──────────────────────────────┘   │
├────────────────────────────────────┤
│ [Cancel]  [Move 3 Animals In]      │
└────────────────────────────────────┘
```

## Navigation Updates

Add to `AppNavigator`:
```typescript
Pastures: undefined
PastureDetail: { pastureId: string }
PastureForm: { pastureId?: string }
MovementForm: { pastureId?: string; movementType?: "move_in" | "move_out" }
```

## Additional Features (Future Enhancements)

### Pasture Health Scoring
- Track soil health indicators
- Forage yield estimates
- Rainfall/moisture tracking
- Generate pasture health reports

### Smart Rotation Suggestions
- AI-powered rotation recommendations
- Alert when pasture needs rotation
- Suggest optimal next pasture based on rest days
- Calculate carrying capacity based on forage growth

### Grazing Charts
- Visualize rotation patterns over time
- Heatmap of pasture usage
- Trend graphs for animal distribution

### Batch Operations
- Move entire herds between pastures
- Create rotation schedules
- Auto-rotation based on rules

### Integration Points
- Link breeding records to pasture (e.g., "cows in breeding pasture")
- Weight gain analysis by pasture
- Health records correlated with pasture location

## Implementation Checklist

- [ ] Create Pasture model (`app/db/models/Pasture.ts`)
- [ ] Create PastureMovement model (`app/db/models/PastureMovement.ts`)
- [ ] Update Animal model with `current_pasture_id`
- [ ] Add schema migration (v4 → v5)
- [ ] Update `app/db/models/index.ts` exports
- [ ] Create `usePastures` hook (`app/hooks/usePastures.ts`)
- [ ] Build PasturesScreen with list view
- [ ] Build PastureDetailScreen
- [ ] Build PastureFormScreen
- [ ] Build MovementFormScreen with RFID scanning
- [ ] Add navigation routes
- [ ] Update project-context.md with pastures documentation
- [ ] Add pastures patterns to skills.md
- [ ] Test CRUD operations
- [ ] Test movement tracking
- [ ] Test RFID scanning flow

## Data Flow Example

**Scenario**: Move 10 cattle from "Holding Pen" to "North Paddock"

1. User taps "North Paddock" → PastureDetailScreen
2. User taps "Scan Animals In" → MovementFormScreen
3. User scans 10 RFID tags (or selects manually)
4. User confirms → `moveAnimalsIn()` triggered
5. System creates 10 `PastureMovement` records (type: "move_in")
6. System updates 10 Animal records: `current_pasture_id = northPaddockId`
7. System updates "North Paddock":
   - `currentAnimalCount += 10`
   - `lastGrazedDate = now()`
8. User returns to PastureDetailScreen
9. Screen shows updated count and animal list

## Supabase Migration

Add to `supabase/migrations/00004_add_pastures.sql`:

```sql
-- Create pastures table
CREATE TABLE IF NOT EXISTS public.pastures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remote_id TEXT,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  size_hectares DECIMAL(10,2),
  location_notes TEXT,
  forage_type TEXT,
  water_source TEXT,
  fence_type TEXT,
  max_capacity INTEGER,
  target_grazing_days INTEGER,
  target_rest_days INTEGER,
  current_animal_count INTEGER NOT NULL DEFAULT 0,
  last_grazed_date TIMESTAMPTZ,
  available_from_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  _changed TEXT,
  _status TEXT DEFAULT 'created'
);

-- Create pasture_movements table
CREATE TABLE IF NOT EXISTS public.pasture_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remote_id TEXT,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pasture_id UUID NOT NULL REFERENCES public.pastures(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  movement_date TIMESTAMPTZ NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('move_in', 'move_out')),
  moved_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  _changed TEXT,
  _status TEXT DEFAULT 'created'
);

-- Add current_pasture_id to animals table
ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS current_pasture_id UUID REFERENCES public.pastures(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pastures_org ON public.pastures(organization_id);
CREATE INDEX IF NOT EXISTS idx_pastures_is_deleted ON public.pastures(is_deleted);
CREATE INDEX IF NOT EXISTS idx_pasture_movements_org ON public.pasture_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_pasture_movements_pasture ON public.pasture_movements(pasture_id);
CREATE INDEX IF NOT EXISTS idx_pasture_movements_animal ON public.pasture_movements(animal_id);
CREATE INDEX IF NOT EXISTS idx_pasture_movements_is_deleted ON public.pasture_movements(is_deleted);
CREATE INDEX IF NOT EXISTS idx_animals_current_pasture ON public.animals(current_pasture_id);

-- RLS Policies
ALTER TABLE public.pastures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pasture_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pastures in their orgs"
  ON public.pastures FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage pastures in their orgs"
  ON public.pastures FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view movements in their orgs"
  ON public.pasture_movements FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage movements in their orgs"
  ON public.pasture_movements FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));
```

---

This comprehensive plan provides everything needed to build a production-ready pasture rotation system integrated seamlessly with the existing HerdTrackr app architecture.
