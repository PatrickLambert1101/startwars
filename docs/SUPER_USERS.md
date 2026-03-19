# Super Users System

The super user system allows you to grant full commercial access to specific users without requiring a paid subscription. This is useful for:

- **Beta testers** - Give trusted users full access for testing
- **Team members** - Internal staff who need commercial features
- **Demos** - Show off all features without subscription
- **Special access** - Partners, investors, or VIPs

## How It Works

When a user is added to the `super_users` table, they automatically get:
- ✅ Full **Commercial** plan access
- ✅ All premium features unlocked
- ✅ No subscription required
- ✅ RevenueCat is bypassed entirely

## Quick Start

### 1. Apply the Migration

First, push the super users table to your Supabase database:

```bash
supabase db push
```

### 2. Add a Super User

Add a user by their email address:

```bash
npm run super-user:add your-email@example.com "Beta tester"
```

The user will get commercial access the next time they log in.

### 3. List Super Users

See all current super users:

```bash
npm run super-user:list
```

### 4. Remove a Super User

Remove commercial access from a user:

```bash
npm run super-user:remove your-email@example.com
```

## Commands Reference

### Add Super User

```bash
npm run super-user:add <email> [notes]
```

**Examples:**
```bash
npm run super-user:add pat@herdtrackr.co.za "Internal testing"
npm run super-user:add beta@example.com "Beta program participant"
```

### Remove Super User

```bash
npm run super-user:remove <email>
```

**Example:**
```bash
npm run super-user:remove pat@herdtrackr.co.za
```

### List Super Users

```bash
npm run super-user:list
```

## Technical Details

### Database Schema

The `super_users` table contains:

- `id` - UUID primary key
- `email` - User's email (unique)
- `user_id` - Reference to auth.users (nullable, auto-filled when user signs up)
- `granted_by` - Who granted access
- `granted_at` - When access was granted
- `notes` - Optional notes about why they have access
- `is_active` - Whether access is currently active
- `created_at` / `updated_at` - Timestamps

### How Subscription Checks Work

1. User logs in
2. `SubscriptionContext` checks if user is in `super_users` table
3. If found and `is_active = true`:
   - Set plan to `"commercial"`
   - Skip RevenueCat entirely
   - Grant all premium features
4. Otherwise:
   - Check RevenueCat for subscription
   - Apply normal tier logic

### Security

- ✅ Row Level Security (RLS) enabled
- ✅ Users can only read their own super user status
- ✅ Only service role can add/remove super users
- ✅ All operations are logged (granted_by, granted_at)

### Supabase Functions

**`is_super_user(user_id, email)`**
- Returns `true` if user has active super user access
- Called automatically by the app
- Security: DEFINER (runs with elevated privileges)

**`add_super_user(email, notes)`**
- Adds a user to super users
- Can only be called with service role key
- Auto-links to auth.users when they sign up

## Adding Super Users Directly in Supabase

You can also add super users directly in the Supabase dashboard:

1. Go to: **Supabase Dashboard** → **SQL Editor**
2. Run this query:

```sql
SELECT add_super_user('user@example.com', 'Your notes here');
```

Or insert directly:

```sql
INSERT INTO super_users (email, notes, is_active)
VALUES ('user@example.com', 'Beta tester', true);
```

## Troubleshooting

### User not getting commercial access?

1. Check they're in the super_users table:
   ```bash
   npm run super-user:list
   ```

2. Check the user's email matches exactly:
   - Emails are case-sensitive
   - Make sure there are no spaces

3. Check the app logs when they log in:
   ```
   [Subscriptions] Checking super user status for: user@example.com
   [Subscriptions] Super user status: true
   [Subscriptions] User is a super user - granting commercial access
   ```

4. Make sure they log out and back in after being added

### Migration fails?

If the migration fails, you might already have the table. Check in Supabase:

```sql
SELECT * FROM super_users;
```

If it doesn't exist, run the migration manually in SQL Editor.

## Environment Variables

The management script uses these environment variables from `.env`:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SECRET_KEY` - Your service role key (keep secret!)

Make sure both are set in your `.env` file.

## Best Practices

1. **Add notes** - Always include why someone has super user access
2. **Review regularly** - Check `npm run super-user:list` periodically
3. **Remove when done** - Don't leave old testers with access
4. **Use for specific purposes** - Beta testing, demos, internal use
5. **Track who granted access** - The system logs who added each user

## Example Workflow

### Beta Testing Program

```bash
# Add beta testers
npm run super-user:add tester1@example.com "Beta program batch 1"
npm run super-user:add tester2@example.com "Beta program batch 1"
npm run super-user:add tester3@example.com "Beta program batch 1"

# Review who has access
npm run super-user:list

# After beta period ends
npm run super-user:remove tester1@example.com
npm run super-user:remove tester2@example.com
npm run super-user:remove tester3@example.com
```

### Internal Team

```bash
# Give your team full access
npm run super-user:add pat@herdtrackr.co.za "Owner"
npm run super-user:add developer@herdtrackr.co.za "Lead developer"
npm run super-user:add sales@herdtrackr.co.za "Sales demos"
```

## Related Files

- **Migration:** `supabase/migrations/00036_create_super_users_table.sql`
- **Context:** `app/context/SubscriptionContext.tsx`
- **Management Script:** `scripts/manage-super-users.ts`
- **This Documentation:** `docs/SUPER_USERS.md`

---

**Questions?** Contact the development team or check the migration file for technical details.
