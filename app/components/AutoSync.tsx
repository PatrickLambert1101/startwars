import { useEffect, useRef } from "react"
import { database } from "@/db"
import { useSyncContext } from "@/context/SyncContext"
import { useAuth } from "@/context/AuthContext"

/**
 * AutoSync component - triggers background sync when database changes occur
 *
 * Only syncs when records are created or updated (via _changed column tracking),
 * not during intermediate form edits. This prevents excessive sync calls.
 */
export function AutoSync() {
  const { queueSync } = useSyncContext()
  const { isAuthenticated } = useAuth()
  const lastCountsRef = useRef<Record<string, number>>({})
  const hasRunInitialSync = useRef(false)

  // Run initial sync when user logs in
  useEffect(() => {
    if (isAuthenticated && !hasRunInitialSync.current) {
      console.log("[AutoSync] Running initial sync on app load")
      queueSync()
      hasRunInitialSync.current = true
    }
  }, [isAuthenticated, queueSync])

  useEffect(() => {
    if (!isAuthenticated) return

    // Only watch main entity tables, not every change
    const tables = ["animals", "organizations"]

    const subscriptions = tables.map((tableName) => {
      return database
        .get(tableName)
        .query()
        .observeCount()
        .subscribe((count) => {
          // Only trigger sync if count changed (record created/deleted)
          const lastCount = lastCountsRef.current[tableName]
          if (lastCount !== undefined && lastCount !== count) {
            queueSync()
          }
          lastCountsRef.current[tableName] = count
        })
    })

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe())
    }
  }, [isAuthenticated, queueSync])

  return null // This component doesn't render anything
}
