# Add New WatermelonDB Model

Add a new model to the HerdTrackr database.

## Steps

### 1. Update Schema (`app/db/schema.ts`)

Add migration:
```typescript
{
  toVersion: 7, // increment version
  steps: [
    {
      type: "create_table",
      table: "[table_name]",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "organization_id", type: "string", isIndexed: true },
        // ... your columns
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "is_deleted", type: "boolean" },
      ],
    },
  ],
}
```

Update schema version:
```typescript
export const schema = appSchema({
  version: 7, // increment
  tables: [
    // ... existing tables
    tableSchema({
      name: "[table_name]",
      columns: [
        // same as migration
      ],
    }),
  ],
})
```

### 2. Create Model (`app/db/models/[ModelName].ts`)

```typescript
import { Model } from "@nozbe/watermelondb"
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators"

export class [ModelName] extends Model {
  static table = "[table_name]"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  // ... your fields
  @field("is_deleted") isDeleted!: boolean
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date

  @relation("organizations", "organization_id") organization: any
}
```

### 3. Export Model (`app/db/models/index.ts`)

```typescript
export { [ModelName] } from "./[ModelName]"
export type { [TypeName] } from "./[ModelName]"
```

### 4. Register Model (`app/db/index.ts`)

```typescript
import { [ModelName] } from "./models"

export const database = new Database({
  adapter,
  modelClasses: [
    // ... existing models
    [ModelName],
  ],
})
```

### 5. Create Supabase Migration

Create `supabase/migrations/0000X_add_[table_name].sql`:

```sql
CREATE TABLE IF NOT EXISTS public.[table_name] (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remote_id text,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- ... your columns
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  _changed text DEFAULT '',
  _status text DEFAULT 'created'
);

CREATE INDEX idx_[table_name]_org ON public.[table_name](organization_id);
CREATE INDEX idx_[table_name]_changed ON public.[table_name](_changed);

ALTER TABLE public.[table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access [table_name] in their orgs"
  ON public.[table_name] FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = [table_name].organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.is_active = true
    )
  );

CREATE TRIGGER [table_name]_updated_at BEFORE UPDATE ON public.[table_name]
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## Field Types

- `string` → `@field("field_name") fieldName!: string`
- `number` → `@field("field_name") fieldName!: number`
- `boolean` → `@field("field_name") fieldName!: boolean`
- `timestamp` → `@date("field_name") fieldName!: Date`
- `json` → `@json("field_name", sanitize) fieldName!: TypeName`

## Common Patterns

- Always include `organization_id` for multi-tenant
- Always include `remote_id` for sync
- Always include `is_deleted` for soft deletes
- Always include `created_at` and `updated_at`
- Index foreign keys and commonly queried fields
