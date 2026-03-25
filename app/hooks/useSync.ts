import { useCallback, useState, useEffect, useRef } from "react"
import { syncDatabase } from "@/services/sync_rpc"
import { logSyncOperation, startTransaction, captureException } from "@/services/sentry"
import * as Sentry from "@sentry/react-native"

export type SyncStatus = "idle" | "syncing" | "success" | "error"
export type SyncStage = "pulling" | "processing" | "pushing" | "complete"

let pendingSync = false
let syncTimeout: NodeJS.Timeout | null = null

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle")
  const [progress, setProgress] = useState<number>(0)
  const [stage, setStage] = useState<SyncStage | null>(null)
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
      setProgress(0)
      setStage("pulling")
    }

    const startTime = Date.now()
    const transaction = startTransaction("database-sync", "sync")

    console.log("[Sync] 🔄 Starting sync operation...")

    try {
      // Pulling stage (0-40%)
      if (showStatus) {
        setStage("pulling")
        setProgress(10)
      }

      const result = await syncDatabase()

      // Processing stage (40-70%)
      if (showStatus) {
        setStage("processing")
        setProgress(60)
      }

      // Small delay to show processing stage
      await new Promise(resolve => setTimeout(resolve, 300))

      // Pushing stage (70-90%)
      if (showStatus) {
        setStage("pushing")
        setProgress(85)
      }

      // Complete (100%)
      if (showStatus) {
        setStage("complete")
        setProgress(100)
      }
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

      // If another sync was requested while we were syncing, do it now (with longer delay to prevent tight loops)
      if (pendingSync) {
        pendingSync = false
        console.log("[Sync] Processing queued sync request in 5 seconds...")
        setTimeout(() => performSync(false), 5000) // Increased from 1s to 5s to prevent rapid syncing
      }

      // Reset to idle after a few seconds
      if (showStatus) {
        setTimeout(() => {
          setStatus("idle")
          setProgress(0)
          setStage(null)
        }, 3000)
      }

      return result
    } catch (error) {
      if (showStatus) {
        setProgress(0)
        setStage(null)
      }
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

    // Queue a sync to happen in 5 seconds (debounced) - increased to prevent rapid syncing
    syncTimeout = setTimeout(() => {
      performSync(false)
    }, 5000)
  }, [performSync])

  return { sync, queueSync, status, progress, stage, lastSynced, error }
}
