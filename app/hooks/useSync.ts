import { useCallback, useState, useEffect, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { syncDatabase } from "@/services/sync_rpc"
import { logSyncOperation, startTransaction, captureException } from "@/services/sentry"
import * as Sentry from "@sentry/react-native"
import { useDatabase } from "@/context/DatabaseContext"
import { supabase } from "@/services/supabase"

export type SyncStatus = "idle" | "syncing" | "success" | "error"
export type SyncStage = "pulling" | "processing" | "pushing" | "complete"

let pendingSync = false
let syncTimeout: NodeJS.Timeout | null = null

const SYNC_QUEUE_KEY = "sync_queue"

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle")
  const [progress, setProgress] = useState<number>(0)
  const [stage, setStage] = useState<SyncStage | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isSyncingRef = useRef(false)
  const hasCheckedQueue = useRef(false)

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

        // Clear sync queue from AsyncStorage after successful sync
        try {
          await AsyncStorage.removeItem(SYNC_QUEUE_KEY)
          console.log("[Sync] Cleared sync queue from storage")
        } catch (err) {
          console.warn("[Sync] Failed to clear sync queue:", err)
        }

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

    // Persist queue to AsyncStorage in case app closes
    AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify({
      queuedAt: Date.now()
    })).catch(err => {
      console.warn("[Sync] Failed to persist sync queue:", err)
    })

    // Queue a sync to happen in 10 seconds (debounced) - increased for better performance on low-end devices
    syncTimeout = setTimeout(() => {
      performSync(false)
    }, 10000)
  }, [performSync])

  // Check for persisted sync queue on mount
  useEffect(() => {
    const checkPersistedQueue = async () => {
      if (hasCheckedQueue.current) return
      hasCheckedQueue.current = true

      try {
        const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY)
        if (queueData) {
          const { queuedAt } = JSON.parse(queueData)
          const age = Date.now() - queuedAt

          // If queue is less than 5 minutes old, process it
          if (age < 5 * 60 * 1000) {
            console.log("[Sync] Found persisted sync queue, processing now...")
            performSync(false)
          } else {
            console.log("[Sync] Persisted sync queue expired, clearing...")
            await AsyncStorage.removeItem(SYNC_QUEUE_KEY)
          }
        }
      } catch (err) {
        console.warn("[Sync] Failed to check persisted queue:", err)
      }
    }

    checkPersistedQueue()
  }, [performSync])

  // Set up real-time subscriptions for instant updates
  const { currentOrg } = useDatabase()

  useEffect(() => {
    if (!currentOrg) return

    console.log("[Sync] Setting up real-time subscriptions for org:", currentOrg.id)

    // Subscribe to changes in tables for this organization
    const channel = supabase
      .channel(`org-${currentOrg.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'animals',
          filter: `organization_id=eq.${currentOrg.remoteId || currentOrg.id}`
        },
        (payload) => {
          console.log("[Sync] Real-time change detected in animals:", payload.eventType)
          queueSync() // Trigger sync when changes detected
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_records',
          filter: `organization_id=eq.${currentOrg.remoteId || currentOrg.id}`
        },
        (payload) => {
          console.log("[Sync] Real-time change detected in health_records:", payload.eventType)
          queueSync()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weight_records',
          filter: `organization_id=eq.${currentOrg.remoteId || currentOrg.id}`
        },
        (payload) => {
          console.log("[Sync] Real-time change detected in weight_records:", payload.eventType)
          queueSync()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("[Sync] ✅ Real-time subscriptions active")
        } else if (status === 'CHANNEL_ERROR') {
          console.error("[Sync] ❌ Real-time subscription error")
        }
      })

    // Cleanup subscription on unmount or org change
    return () => {
      console.log("[Sync] Cleaning up real-time subscriptions")
      supabase.removeChannel(channel)
    }
  }, [currentOrg, queueSync])

  return { sync, queueSync, status, progress, stage, lastSynced, error }
}
