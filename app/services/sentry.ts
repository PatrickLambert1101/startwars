import * as Sentry from "sentry-expo"
import { Platform } from "react-native"

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN

export function initSentry() {
  // Skip if no DSN configured or if it's a placeholder
  if (!SENTRY_DSN || SENTRY_DSN.includes("your-") || SENTRY_DSN === "your-sentry-dsn-here") {
    console.warn("[Sentry] DSN not configured, skipping initialization")
    return
  }

  console.log("[Sentry] Initializing with DSN:", SENTRY_DSN)

  Sentry.init({
    dsn: SENTRY_DSN,

    // IMPORTANT: Enable Sentry in Expo development mode for testing
    // Remove this in production or set to false
    enableInExpoDevelopment: true,

    // Enable debug to see what's being sent (useful for troubleshooting)
    // Set to false in production once everything works
    debug: true,

    // Environment - auto-detected by sentry-expo
    environment: __DEV__ ? "development" : "production",

    // Enable auto session tracking
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 seconds

    // Attach stack traces to all messages
    attachStacktrace: true,

    // Performance monitoring - sample 100% in dev, 10% in production
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,

    // Integrations
    integrations: [
      new Sentry.Native.ReactNativeTracing({
        // Set to true to track app start-up performance
        enableAppStartTracking: true,
        // Set to true to track slow/frozen frames
        enableStallTracking: true,
      }),
    ],

    // Filter out noisy errors
    beforeSend(event, hint) {
      // Filter out console instrumentation errors
      if (event.logger === 'console') {
        return null
      }

      // Log what we're about to send in dev
      if (__DEV__) {
        console.log("[Sentry] Sending event:", event.message || event.exception)
      }

      // Filter out specific errors you don't care about
      const error = hint.originalException
      if (error && typeof error === "object" && "message" in error) {
        const message = String(error.message)

        // Ignore network timeout errors in development
        if (__DEV__ && message.includes("Network request failed")) {
          return null
        }

        // Ignore specific React Native warnings
        if (message.includes("Warning: ")) {
          return null
        }

        // Ignore RevenueCat configuration warnings
        if (message.includes("RevenueCat") || message.includes("offerings")) {
          return null
        }
      }

      return event
    },

    // Enrich events with additional context
    beforeBreadcrumb(breadcrumb, hint) {
      // Add timestamp to all breadcrumbs for better debugging
      breadcrumb.data = {
        ...breadcrumb.data,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
      }
      return breadcrumb
    },
  })

  // Set user context with platform info
  Sentry.Native.setContext("device", {
    platform: Platform.OS,
    version: Platform.Version,
  })

  console.log("[Sentry] Initialized successfully")
}

// ────────────────────────────────────────────────────────────────────
// Database-specific logging utilities
// ────────────────────────────────────────────────────────────────────

/**
 * Add a breadcrumb for WatermelonDB operations
 */
export function logDatabaseOperation(
  operation: "query" | "create" | "update" | "delete" | "batch" | "reset",
  details: {
    table?: string
    recordId?: string
    recordCount?: number
    error?: Error
    duration?: number
    query?: string
  }
) {
  // Only add breadcrumb in dev or if there's an error
  // This reduces overhead in production for successful operations
  if (__DEV__ || details.error) {
    Sentry.Native.addBreadcrumb({
      category: "database",
      message: `Database ${operation}${details.table ? ` on ${details.table}` : ""}`,
      level: details.error ? "error" : "info",
      data: {
        operation,
        table: details.table,
        recordId: details.recordId,
        recordCount: details.recordCount,
        duration: details.duration,
        query: details.query,
        error: details.error?.message,
        timestamp: new Date().toISOString(),
      },
    })
  }

  // Console logs only in dev mode (production builds strip these out)
  if (__DEV__) {
    const emoji = details.error ? "❌" : "✅"
    const prefix = `[DB:${operation}]`
    if (details.error) {
      console.error(emoji, prefix, details.table || "unknown", details.error)
    } else {
      console.log(emoji, prefix, details.table || "unknown", details)
    }
  }
}

/**
 * Add a breadcrumb for sync operations
 */
export function logSyncOperation(
  operation: "pull" | "push" | "full-sync" | "conflict-resolution",
  details: {
    recordsPulled?: number
    recordsPushed?: number
    conflicts?: number
    error?: Error
    duration?: number
    lastPulledAt?: Date | null
  }
) {
  Sentry.Native.addBreadcrumb({
    category: "sync",
    message: `Sync ${operation}`,
    level: details.error ? "error" : "info",
    data: {
      operation,
      recordsPulled: details.recordsPulled,
      recordsPushed: details.recordsPushed,
      conflicts: details.conflicts,
      duration: details.duration,
      lastPulledAt: details.lastPulledAt?.toISOString(),
      error: details.error?.message,
      timestamp: new Date().toISOString(),
    },
  })

  const emoji = details.error ? "❌" : "🔄"
  const prefix = `[Sync:${operation}]`
  if (details.error) {
    console.error(emoji, prefix, details.error)
  } else {
    console.log(emoji, prefix, details)
  }
}

/**
 * Add a breadcrumb for auth operations
 */
export function logAuthOperation(
  operation: "login" | "logout" | "signup" | "session-refresh" | "otp-sent" | "otp-verify",
  details: {
    email?: string
    userId?: string
    error?: Error
    method?: "password" | "magic-link" | "otp"
  }
) {
  Sentry.Native.addBreadcrumb({
    category: "auth",
    message: `Auth ${operation}`,
    level: details.error ? "error" : "info",
    data: {
      operation,
      email: details.email,
      userId: details.userId,
      method: details.method,
      error: details.error?.message,
      timestamp: new Date().toISOString(),
    },
  })

  const emoji = details.error ? "❌" : "🔐"
  const prefix = `[Auth:${operation}]`
  if (details.error) {
    console.error(emoji, prefix, details.email, details.error)
  } else {
    console.log(emoji, prefix, details.email || details.userId)
  }
}

/**
 * Set user context in Sentry (call after login)
 */
export function setUserContext(user: { id: string; email?: string } | null) {
  if (user) {
    Sentry.Native.setUser({
      id: user.id,
      email: user.email,
    })
    console.log("[Sentry] User context set:", user.email)
  } else {
    Sentry.Native.setUser(null)
    console.log("[Sentry] User context cleared")
  }
}

/**
 * Set organization context (call when switching orgs)
 */
export function setOrgContext(org: { id: string; name: string } | null) {
  if (org) {
    Sentry.Native.setContext("organization", {
      id: org.id,
      name: org.name,
    })
    console.log("[Sentry] Organization context set:", org.name)
  } else {
    Sentry.Native.setContext("organization", null)
    console.log("[Sentry] Organization context cleared")
  }
}

/**
 * Capture an exception with rich context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.Native.captureException(error, {
    contexts: context ? { extra: context } : undefined,
  })
  console.error("[Sentry] Exception captured:", error, context)
}

/**
 * Start a performance transaction (stub for now - v8 API changed)
 */
export function startTransaction(name: string, operation: string) {
  if (__DEV__) {
    console.log(`[Sentry] Transaction: ${name} (${operation})`)
  }
  return null
}

/**
 * Measure database query performance
 */
export async function measureDatabaseQuery<T>(
  queryName: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()

  try {
    const result = await queryFn()
    const duration = Date.now() - startTime

    // Only log in dev or if it takes longer than 100ms
    if (__DEV__ || duration > 100) {
      logDatabaseOperation("query", {
        table,
        query: queryName,
        duration,
      })
    }

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    logDatabaseOperation("query", {
      table,
      query: queryName,
      duration,
      error: error as Error,
    })

    throw error
  }
}
