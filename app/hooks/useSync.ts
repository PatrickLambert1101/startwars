import { useCallback, useState, useEffect, useRef } from "react"
import { syncDatabase } from "@/services/sync_rpc"

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
      return { success: true }
    }

    isSyncingRef.current = true
    if (showStatus) {
      setStatus("syncing")
      setError(null)
    }

    const result = await syncDatabase()

    if (result.success) {
      if (showStatus) {
        setStatus("success")
      }
      setLastSynced(new Date())
    } else {
      if (showStatus) {
        setStatus("error")
        setError(result.error ?? "Unknown error")
      }
    }

    isSyncingRef.current = false

    // If another sync was requested while we were syncing, do it now
    if (pendingSync) {
      pendingSync = false
      setTimeout(() => performSync(false), 1000)
    }

    // Reset to idle after a few seconds
    if (showStatus) {
      setTimeout(() => setStatus("idle"), 3000)
    }

    return result
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
