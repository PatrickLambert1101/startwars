# User Management & Multi-Device Sync Plan

## Current State
- App stores data locally on each device (SQLite via WatermelonDB)
- No authentication or user accounts
- No cross-device sync
- Database is designed with `remote_id` fields for future sync

## Goals
1. Enable multiple users per farm/organization
2. Email-based invites (simple, no complex setup)
3. Role-based permissions (keep it simple: Admin, Worker)
4. Cross-device sync via Supabase
5. Maintain offline-first capability

---

## User Roles (Keep it Simple)

### Admin Role
**What they can do:**
- Everything Workers can do, plus:
- Invite/remove users
- Change user roles
- Delete animals, pastures, records
- Modify organization settings
- View all reports

### Worker Role
**What they can do:**
- Scan/view animals
- Add health records, weights, breeding records
- Move animals between pastures
- View pastures and animal lists
- Basic reports

**What they CANNOT do:**
- Delete anything (soft deletes only visible to admins)
- Invite users
- Change settings
- Remove animals from the system

---

## Database Schema Changes

### New Tables

#### `users` table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `organization_members` table (join table)
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

#### `invites` table
```sql
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
  invited_by UUID REFERENCES users(id),
  invite_code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, email)
);
```

### Local Database (WatermelonDB) Updates

Add to schema:
```typescript
tableSchema({
  name: "users",
  columns: [
    { name: "remote_id", type: "string", isOptional: true },
    { name: "email", type: "string" },
    { name: "display_name", type: "string" },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
}),
tableSchema({
  name: "organization_members",
  columns: [
    { name: "remote_id", type: "string", isOptional: true },
    { name: "organization_id", type: "string", isIndexed: true },
    { name: "user_id", type: "string", isIndexed: true },
    { name: "role", type: "string" }, // 'admin' | 'worker'
    { name: "invited_by", type: "string", isOptional: true },
    { name: "joined_at", type: "number", isOptional: true },
    { name: "is_active", type: "boolean" },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
}),
```

---

## Authentication Flow

### Option 1: Supabase Auth (Recommended)
**Pros:**
- Built-in email/password auth
- Magic link support (no password needed!)
- Session management handled
- Row-level security policies

**Flow:**
1. User enters email
2. Receives magic link via email
3. Clicks link → logged in
4. If first time: create/join organization
5. If invited: auto-join organization with role

### Option 2: Custom Email Auth
**Pros:**
- More control
**Cons:**
- More work, more security concerns

**Recommendation:** Go with Supabase Auth + Magic Links (farmers don't want to remember passwords!)

---

## User Flows

### First-Time Setup (Farm Owner)
1. Open app → "Get Started"
2. Enter email → receive magic link
3. Click link → "Create Your Farm"
4. Enter farm name, livestock types
5. **Automatically becomes Admin** of new organization
6. Start adding animals

### Invite Worker Flow
1. Admin goes to Settings → Team
2. Taps "Invite Team Member"
3. Enters email, selects role (Admin or Worker)
4. System sends email with magic link + invite code
5. Worker clicks link → auto-joins organization
6. Worker can now use app with their role permissions

### Switching Organizations (Future)
- If user is in multiple orgs, show org picker on login
- Most farmers won't need this initially

---

## Sync Strategy

### WatermelonDB Sync Setup

1. **Install sync dependencies:**
```bash
npm install @nozbe/watermelondb
```

2. **Create sync configuration:**
```typescript
// app/db/sync.ts
import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from './index'

export async function syncDatabase() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const response = await fetch(`https://your-supabase.com/sync/pull?last_pulled_at=${lastPulledAt}`)
      const { changes, timestamp } = await response.json()
      return { changes, timestamp }
    },
    pushChanges: async ({ changes }) => {
      await fetch('https://your-supabase.com/sync/push', {
        method: 'POST',
        body: JSON.stringify(changes),
      })
    },
  })
}
```

3. **Trigger sync:**
- On app startup
- Every 5 minutes when online
- After user makes changes
- When pull-to-refresh

### Conflict Resolution
- **Last-write-wins** for most fields
- Supabase `updated_at` timestamps determine winner
- WatermelonDB handles most of this automatically

---

## UI Changes Needed

### New Screens

1. **AuthScreen** - Magic link email input
2. **TeamScreen** - View team members, invite, manage roles
3. **ProfileScreen** - User's name, email, logout

### Updated Screens

1. **SettingsScreen** - Add "Team" option (Admin only)
2. **App Navigation** - Show current org name, user indicator
3. All create/edit screens - Track `created_by` and `updated_by`

### Permission Guards

```typescript
// app/hooks/usePermissions.ts
export function usePermissions() {
  const { currentUser, currentMembership } = useAuth()

  return {
    canDeleteAnimal: currentMembership?.role === 'admin',
    canInviteUsers: currentMembership?.role === 'admin',
    canEditSettings: currentMembership?.role === 'admin',
    canAddRecords: true, // Both roles
    canViewReports: true, // Both roles
  }
}
```

Usage:
```typescript
const { canDeleteAnimal } = usePermissions()

{canDeleteAnimal && (
  <Button text="Delete" onPress={handleDelete} />
)}
```

---

## Implementation Phases

### Phase 1: Core Auth (Week 1)
- [ ] Set up Supabase project
- [ ] Configure Supabase Auth with magic links
- [ ] Add `users` and `organization_members` tables
- [ ] Create AuthScreen with email input
- [ ] Create organization on first login
- [ ] Store current user in app context

### Phase 2: Invites & Roles (Week 2)
- [ ] Add `invites` table to Supabase
- [ ] Build TeamScreen (view members)
- [ ] Build InviteScreen (send invites)
- [ ] Email template for invites
- [ ] Accept invite flow
- [ ] Role-based permission guards

### Phase 3: Sync (Week 3)
- [ ] Configure WatermelonDB sync
- [ ] Build Supabase sync endpoints (pull/push)
- [ ] Add Row-Level Security policies
- [ ] Test cross-device sync
- [ ] Handle offline → online transitions
- [ ] Add sync status indicator

### Phase 4: Polish (Week 4)
- [ ] Org switcher (if user in multiple orgs)
- [ ] Better error handling
- [ ] Audit logs (who changed what)
- [ ] Bulk invite via CSV
- [ ] Remove/deactivate users

---

## Security: Supabase Row-Level Security

```sql
-- Only show data for organizations the user belongs to
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's animals"
  ON animals FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert animals to their organization"
  ON animals FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Only admins can delete animals"
  ON animals FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );
```

Apply similar policies to all tables.

---

## Email Templates

### Invite Email (Simple & Friendly)

**Subject:** You're invited to join [Farm Name] on HerdTrackr

**Body:**
```
Hi there!

[Admin Name] has invited you to join [Farm Name] on HerdTrackr as a [Role].

Click the link below to get started:
[Magic Link]

This link expires in 7 days.

Once you're in, you'll be able to:
- Track animals
- Record health events
- Manage pastures
[Admin only: - Invite team members]

Questions? Just reply to this email.

Happy farming!
The HerdTrackr Team
```

---

## Key Decisions

1. **Keep roles simple:** Just Admin and Worker (can expand later)
2. **Use magic links:** No passwords to remember
3. **Email-based invites:** Everyone has email, it's familiar
4. **Offline-first:** Sync when online, but app always works
5. **Last-write-wins:** Simple conflict resolution
6. **Supabase:** Auth + database + sync in one place

---

## Questions to Answer

1. Should first user of an org auto-become Admin? **Yes**
2. Can there be multiple Admins? **Yes**
3. Can Worker be upgraded to Admin? **Yes, by existing Admin**
4. What happens if last Admin leaves? **Prevent it, or auto-promote oldest Worker**
5. Free tier limits? **Supabase free tier: 500MB database, 50K monthly active users - plenty for MVP**

---

## Next Steps

1. Get your approval on this plan
2. Set up Supabase project (I can help)
3. Start Phase 1 implementation
4. Test with 2-3 devices to validate sync

---

## Estimated Timeline

- **Phase 1 (Core Auth):** 3-5 days
- **Phase 2 (Invites & Roles):** 3-4 days
- **Phase 3 (Sync):** 5-7 days (most complex)
- **Phase 4 (Polish):** 2-3 days

**Total:** ~2-3 weeks for full multi-user sync
