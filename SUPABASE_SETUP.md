# Supabase Project Setup

Step-by-step guide to get your HerdTrackr backend running on Supabase.

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New Project**.
3. Choose an organization (or create one — e.g. "My Farm").
4. Fill in:
   - **Project name:** `herdtrackr` (or whatever you like)
   - **Database password:** pick something strong and save it — you'll need it for direct DB access.
   - **Region:** choose the one closest to you (e.g. *Africa (Cape Town)* for South African farms).
5. Click **Create new project** and wait for it to spin up (~60 seconds).

---

## 2. Find Your API Keys

Once your project is ready, go to **Project Settings > API** (in the left sidebar).

You'll see two keys:

| Key | Env variable | Use |
|---|---|---|
| **Publishable key** (previously called "anon key") | `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Embedded in the mobile app. All queries go through Row-Level Security. Safe to ship. |
| **Secret key** (previously called "service_role key") | `SUPABASE_SECRET_KEY` | Full admin access — bypasses RLS. **Never embed this in a client app.** Use it for seed scripts, Edge Functions, and CI. |

You'll also need the **Project URL** shown at the top of the same page:

```
https://abcdefghij.supabase.co
```

---

## 3. Configure Your Environment

Copy the example env file and paste your values:

```bash
cp .env.example .env
```

Then edit `.env`:

```bash
# Client-safe keys (bundled into the Expo app)
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...  # your publishable key

# Server-only key (used by seed scripts — NOT bundled into the app)
SUPABASE_SECRET_KEY=eyJhbGciOi...  # your secret key
```

> **Important:** Keys prefixed with `EXPO_PUBLIC_` are bundled into the JS
> bundle. Never add `EXPO_PUBLIC_` to the secret key.

---

## 4. Run the Database Migrations

Open the **SQL Editor** in your Supabase dashboard and paste the contents of:

```
supabase/migrations/00001_initial_schema.sql
```

Click **Run** to create all tables, indexes, RLS policies, and triggers.

Alternatively, if you have the Supabase CLI installed:

```bash
supabase db push
```

---

## 5. Enable Auth Providers

Go to **Authentication > Providers** in the dashboard and enable the ones you want:

- **Email** (enabled by default) — good for getting started
- **Google**, **Apple**, etc. — optional, for social login

For email auth, you may want to disable "Confirm email" during development:

> Authentication > Settings > toggle off **Enable email confirmations**

---

## 6. Load Demo / Seed Data (Optional)

If you want to start with a populated database for testing, run the seed script
in the SQL Editor:

```
supabase/seed/demo_farm_data.sql
```

This creates a demo organization ("Bosveld Plaas") with ~50 animals, health
records, weight records, and breeding records — all modelled on a typical South
African mixed cattle farm.

> **Note:** The seed script creates its own user (demo@herdtrackr.app). After
> running the seed, you can sign in with that email and password `DemoFarm123!`
> (if you have email confirmations disabled).

---

## 7. Verify Everything Works

1. Start the app: `npm start`
2. Sign in with the demo account (or create a new one).
3. You should see the dashboard with animals, weights, and health data.
4. Try creating a new animal — it should sync to Supabase when online.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Invalid API key" error | Double-check that `.env` has the **publishable** key (not the secret key) in `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. |
| RLS blocks everything | Make sure you ran the full migration, including the RLS policies. |
| Auth emails not arriving | Check **Authentication > Email Templates** and your SMTP settings (or disable confirmations for dev). |
| Sync not working | Ensure the user is signed in and belongs to an organization. RLS requires a valid `auth.uid()`. |
