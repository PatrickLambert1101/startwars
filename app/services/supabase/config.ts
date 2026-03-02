/**
 * Supabase configuration.
 *
 * Supabase uses two API key types:
 *
 *  - **Publishable key** (safe to embed in client apps)
 *    Used by the JS client for auth flows and row-level-security queries.
 *    This is the key previously called "anon key" in older Supabase docs.
 *
 *  - **Secret key** (server-side only — never ship in a client bundle!)
 *    Bypasses RLS and has full access. Use this in Edge Functions, server
 *    routes, or migration scripts — never in a mobile/web client.
 *
 * Set these via environment variables. See SUPABASE_SETUP.md for details.
 */

/** Your Supabase project URL (e.g. https://abcdefg.supabase.co) */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"

/**
 * Publishable (client-safe) API key.
 * Embedded in the mobile app — all queries go through RLS.
 */
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "your-publishable-key"

/**
 * Secret API key — server-side only.
 * NOT exposed via EXPO_PUBLIC_ so it is never bundled into the client.
 * Only used by scripts, Edge Functions, or CI tooling.
 */
export const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || ""
