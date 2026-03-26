import { useEffect, useRef } from "react"
import { AppState, AppStateStatus } from "react-native"
import * as Network from "expo-network"
import { database } from "@/db"
import { useSyncContext } from "@/context/SyncContext"
import { useAuth } from "@/context/AuthContext"
import { Q } from "@nozbe/watermelondb"

/**
 * AutoSync component - triggers background sync automatically
 *
 * Syncs when:
 * - App loads (initial sync)
 * - Database changes occur (create/update/delete)
 * - App comes to foreground
 * - Network reconnects
 * - Periodically every 5 minutes (for pulling server changes)
 */
export function AutoSync() {
  const { queueSync } = useSyncContext()
  const { isAuthenticated } = useAuth()
  const lastCountsRef = useRef<Record<string, number>>({})
  const lastChangedRef = useRef<Record<string, number>>({})
  const hasRunInitialSync = useRef(false)
  const lastForegroundTime = useRef(0)

  // Run initial sync when user logs in
  useEffect(() => {
    if (isAuthenticated && !hasRunInitialSync.current) {
      console.log("[AutoSync] Running initial sync on app load")
      queueSync()
      hasRunInitialSync.current = true
    }
  }, [isAuthenticated, queueSync])

  // Watch for database changes (creates, updates, deletes)
  // Only watch critical tables to reduce overhead on low-end devices
  useEffect(() => {
    if (!isAuthenticated) return

    // Only watch the most critical tables that users interact with frequently
    // This reduces from 11 tables (22 subscriptions) to 3 tables (6 subscriptions)
    const tables = [
      "animals",         // User scans/creates animals
      "health_records",  // User adds health records
      "weight_records",  // User adds weight records
    ]

    const subscriptions = tables.flatMap((tableName) => {
      // Watch for count changes (creates/deletes)
      const countSub = database
        .get(tableName)
        .query()
        .observeCount()
        .subscribe((count) => {
          const lastCount = lastCountsRef.current[tableName]
          if (lastCount !== undefined && lastCount !== count) {
            console.log(`[AutoSync] Detected create/delete in ${tableName}, queuing sync...`)
            queueSync()
          }
          lastCountsRef.current[tableName] = count
        })

      // Watch for changed records (updates) using _changed column
      const changedSub = database
        .get(tableName)
        .query(Q.where("_changed", Q.notEq("")))
        .observeCount()
        .subscribe((changedCount) => {
          const lastChanged = lastChangedRef.current[tableName]
          if (lastChanged !== undefined && changedCount > 0 && lastChanged !== changedCount) {
            console.log(`[AutoSync] Detected update in ${tableName}, queuing sync...`)
            queueSync()
          }
          lastChangedRef.current[tableName] = changedCount
        })

      return [countSub, changedSub]
    })

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe())
    }
  }, [isAuthenticated, queueSync])

  // Listen for network reconnection and sync (using polling approach with expo-network)
  useEffect(() => {
    if (!isAuthenticated) return

    let lastNetworkState: boolean | null = null
    const checkInterval = setInterval(async () => {
      const networkState = await Network.getNetworkStateAsync()
      const isOnline = networkState.isConnected && networkState.isInternetReachable

      // Only sync when we transition from offline to online (not on first check)
      if (isOnline && lastNetworkState === false) {
        console.log("[AutoSync] Network reconnected, queuing sync...")
        queueSync()
      }
      lastNetworkState = isOnline
    }, 10000) // Check every 10 seconds

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
          console.log("[AutoSync] App came to foreground, queuing sync...")
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

  // Periodic background sync to pull server changes (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return

    console.log("[AutoSync] Starting periodic sync (every 5 minutes)")
    const interval = setInterval(() => {
      console.log("[AutoSync] Periodic sync triggered")
      queueSync()
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      clearInterval(interval)
    }
  }, [isAuthenticated, queueSync])

  return null // This component doesn't render anything
}
