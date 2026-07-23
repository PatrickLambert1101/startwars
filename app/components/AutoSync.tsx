import { useEffect, useRef } from "react"
import { AppState, AppStateStatus } from "react-native"
import * as Network from "expo-network"
import { database } from "@/db"
import { useSyncContext } from "@/context/SyncContext"
import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"
import { Q } from "@nozbe/watermelondb"

/**
 * AutoSync component - triggers background sync automatically
 *
 * Syncs when:
 * - App loads (initial sync)
 * - Database changes occur (create/update/delete)
 * - App comes to foreground
 * - Network reconnects
 * - Server data changes (via Supabase Realtime, see useSync.ts)
 * - Periodically every 3 minutes (safety net for missed Realtime events)
 */
export function AutoSync() {
  const { queueSync } = useSyncContext()
  const { isAuthenticated } = useAuth()
  const { currentOrg } = useDatabase()
  const lastCountsRef = useRef<Record<string, number>>({})
  const lastChangedRef = useRef<Record<string, number>>({})
  const hasRunInitialSync = useRef(false)
  const lastForegroundTime = useRef(0)

  // Run initial sync when user logs in
  useEffect(() => {
    if (isAuthenticated && !hasRunInitialSync.current) {
      if (__DEV__) console.log("[AutoSync] Running initial sync on app load")
      queueSync()
      hasRunInitialSync.current = true
    }
  }, [isAuthenticated, queueSync])

  // Watch for local database changes (creates, updates, deletes) scoped to current org
  useEffect(() => {
    if (!isAuthenticated || !currentOrg) return

    const tables = ["animals", "health_records", "weight_records"]
    const orgClause = Q.where("organization_id", currentOrg.id)

    const subscriptions = tables.flatMap((tableName) => {
      const countSub = database
        .get(tableName)
        .query(orgClause)
        .observeCount()
        .subscribe((count) => {
          const lastCount = lastCountsRef.current[tableName]
          if (lastCount !== undefined && lastCount !== count) {
            if (__DEV__) console.log(`[AutoSync] Detected create/delete in ${tableName}, queuing sync...`)
            queueSync()
          }
          lastCountsRef.current[tableName] = count
        })

      const changedSub = database
        .get(tableName)
        .query(orgClause, Q.where("_changed", Q.notEq("")))
        .observeCount()
        .subscribe((changedCount) => {
          const lastChanged = lastChangedRef.current[tableName]
          if (lastChanged !== undefined && changedCount > 0 && lastChanged !== changedCount) {
            if (__DEV__) console.log(`[AutoSync] Detected update in ${tableName}, queuing sync...`)
            queueSync()
          }
          lastChangedRef.current[tableName] = changedCount
        })

      return [countSub, changedSub]
    })

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe())
    }
  }, [isAuthenticated, currentOrg, queueSync])

  // Listen for network reconnection and sync (using polling approach with expo-network)
  useEffect(() => {
    if (!isAuthenticated) return

    let lastNetworkState: boolean | null = null
    const checkInterval = setInterval(async () => {
      const networkState = await Network.getNetworkStateAsync()
      const isOnline = networkState.isConnected && networkState.isInternetReachable

      // Only sync when we transition from offline to online (not on first check)
      if (isOnline && lastNetworkState === false) {
        if (__DEV__) console.log("[AutoSync] Network reconnected, queuing sync...")
        queueSync()
      }
      lastNetworkState = isOnline
    }, 30_000) // expo-network has no event listener; poll every 30s

    return () => {
      clearInterval(checkInterval)
    }
  }, [isAuthenticated, queueSync])

  // Listen for app coming to foreground and sync
  useEffect(() => {
    if (!isAuthenticated) return

    let timeoutId: NodeJS.Timeout | null = null

    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        const now = Date.now()
        const timeSinceLastForeground = now - lastForegroundTime.current

        // Only sync if it's been more than 30 seconds since last foreground sync
        if (timeSinceLastForeground > 30000) {
          if (__DEV__) console.log("[AutoSync] App came to foreground, queuing sync...")
          lastForegroundTime.current = now

          // Debounce to avoid multiple rapid fires
          if (timeoutId) clearTimeout(timeoutId)
          timeoutId = setTimeout(() => {
            queueSync()
          }, 500)
        }
      }
    })

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription.remove()
    }
  }, [isAuthenticated, queueSync])

  // Periodic background sync as a safety net (every 3 minutes).
  // Cross-device propagation is now primarily driven by Supabase Realtime
  // (see useSync.ts), which triggers a sync within seconds of a remote change.
  // This interval only backstops missed Realtime events (e.g. a silently
  // dropped WebSocket), so it can be infrequent to save battery/network.
  useEffect(() => {
    if (!isAuthenticated) return

    if (__DEV__) console.log("[AutoSync] Starting periodic sync (every 3 minutes)")
    const interval = setInterval(() => {
      if (__DEV__) console.log("[AutoSync] Periodic sync triggered")
      queueSync()
    }, 3 * 60 * 1000) // 3 minutes

    return () => {
      clearInterval(interval)
    }
  }, [isAuthenticated, queueSync])

  return null // This component doesn't render anything
}
