import { useCallback, useState, useEffect, useRef } from "react"
import { syncDatabase } from "@/services/sync_rpc"
import { logSyncOperation, startTransaction, captureException } from "@/services/sentry"
import * as Sentry from "@sentry/react-native"

export type SyncStatus = "idle" | "syncing" | "success" | "error"

let pendingSync = false
let syncTimeout: NodeJS.Timeout | null = null

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle")
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isSyncingRef = useRef(false)

  const performSync = useCallback(async (showStatus = true) => {
    // Prevent concurrent syncs
    if (isSyncingRef.current) {
      pendingSync = true
      console.log("[Sync] Already syncing, queuing another sync")
      return { success: true }
    }

    isSyncingRef.current = true
    if (showStatus) {
      setStatus("syncing")
      setError(null)
    }

    const startTime = Date.now()
    const transaction = startTransaction("database-sync", "sync")

    console.log("[Sync] 🔄 Starting sync operation...")

    try {
      const result = await syncDatabase()
      const duration = Date.now() - startTime

      if (result.success) {
        if (showStatus) {
          setStatus("success")
        }
        setLastSynced(new Date())

        console.log(`[Sync] ✅ Sync completed successfully in ${duration}ms`)
        logSyncOperation("full-sync", {
          recordsPulled: result.pulled || 0,
          recordsPushed: result.pushed || 0,
          duration,
          lastPulledAt: new Date(),
        })

        transaction?.setStatus({ code: 1 }) // OK
        transaction?.finish()
      } else {
        if (showStatus) {
          setStatus("error")
          setError(result.error ?? "Unknown error")
        }

        console.error(`[Sync] ❌ Sync failed after ${duration}ms:`, result.error)
        logSyncOperation("full-sync", {
          error: new Error(result.error || "Unknown sync error"),
          duration,
        })

        captureException(new Error(result.error || "Unknown sync error"), {
          component: "useSync",
          operation: "performSync",
          duration,
        })

        transaction?.setStatus({ code: 2 }) // Error
        transaction?.finish()
      }

      isSyncingRef.current = false

      // If another sync was requested while we were syncing, do it now
      if (pendingSync) {
        pendingSync = false
        console.log("[Sync] Processing queued sync request")
        setTimeout(() => performSync(false), 1000)
      }

      // Reset to idle after a few seconds
      if (showStatus) {
        setTimeout(() => setStatus("idle"), 3000)
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[Sync] ❌ Sync crashed after ${duration}ms:`, error)

      isSyncingRef.current = false

      logSyncOperation("full-sync", {
        error: error as Error,
        duration,
      })

      captureException(error as Error, {
        component: "useSync",
        operation: "performSync",
        duration,
      })

      transaction?.setStatus({ code: 2 }) // Error
      transaction?.finish()

      return { success: false, error: (error as Error).message }
    }
  }, [])

  const sync = useCallback(async () => {
    return performSync(true)
  }, [performSync])

  // Debounced background sync - queues a sync to happen after data changes
  const queueSync = useCallback(() => {
    // Clear existing timeout
    if (syncTimeout) {
      clearTimeout(syncTimeout)
    }

    // Queue a sync to happen in 3 seconds (debounced)
    syncTimeout = setTimeout(() => {
      performSync(false)
    }, 3000)
  }, [performSync])

  return { sync, queueSync, status, lastSynced, error }
}
