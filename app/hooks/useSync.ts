import { useCallback, useState, useEffect, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { syncDatabase } from "@/services/sync_rpc"
import { logSyncOperation, startTransaction, captureException } from "@/services/sentry"
import * as Sentry from "@sentry/react-native"
import { useDatabase } from "@/context/DatabaseContext"
import { supabase } from "@/services/supabase"

export type SyncStatus = "idle" | "syncing" | "success" | "error"
export type SyncStage = "pulling" | "processing" | "pushing" | "complete"

const SYNC_QUEUE_KEY = "sync_queue"

// Sync timing constants
const QUEUE_DEBOUNCE_MS = 10_000              // Debounce queued syncs (low-end devices)
const PENDING_REQUEUE_DELAY_MS = 5_000        // Delay before running a sync queued during another sync
const STATUS_RESET_DELAY_MS = 3_000           // Delay before clearing status UI after success/error
const PROCESSING_DISPLAY_DELAY_MS = 300       // Artificial delay so users can see "processing" stage
const PERSISTED_QUEUE_MAX_AGE_MS = 5 * 60 * 1000

// Exponential backoff for failed syncs
const RETRY_BACKOFF_MS = [5_000, 15_000, 45_000, 2 * 60_000, 5 * 60_000]
const MAX_RETRY_ATTEMPTS = RETRY_BACKOFF_MS.length

// Tables that trigger a real-time sync when changed by another device
const REALTIME_TABLES = [
  "animals",
  "health_records",
  "weight_records",
  "breeding_records",
  "pastures",
  "pasture_movements",
  "vaccination_schedules",
  "scheduled_vaccinations",
  "treatment_protocols",
]

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle")
  const [progress, setProgress] = useState<number>(0)
  const [stage, setStage] = useState<SyncStage | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState<number>(0)
  const [nextRetryAt, setNextRetryAt] = useState<Date | null>(null)

  const isSyncingRef = useRef(false)
  const pendingSyncRef = useRef(false)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasCheckedQueue = useRef(false)
  const retryCountRef = useRef(0)

  const scheduleRetry = useCallback((runSync: () => void) => {
    const attempt = retryCountRef.current
    if (attempt >= MAX_RETRY_ATTEMPTS) {
      if (__DEV__) console.warn(`[Sync] Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached`)
      setNextRetryAt(null)
      return
    }

    const delay = RETRY_BACKOFF_MS[attempt]
    const nextAt = new Date(Date.now() + delay)
    setNextRetryAt(nextAt)
    if (__DEV__) console.log(`[Sync] Scheduling retry #${attempt + 1} in ${delay}ms`)

    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    retryTimeoutRef.current = setTimeout(() => {
      retryTimeoutRef.current = null
      runSync()
    }, delay)
  }, [])

  const performSync = useCallback(async (showStatus = true) => {
    if (isSyncingRef.current) {
      pendingSyncRef.current = true
      if (__DEV__) console.log("[Sync] Already syncing, queuing another sync")
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

    if (__DEV__) console.log("[Sync] Starting sync operation...")

    try {
      if (showStatus) {
        setStage("pulling")
        setProgress(10)
      }

      const result = await syncDatabase()

      if (showStatus) {
        setStage("processing")
        setProgress(60)
      }

      await new Promise(resolve => setTimeout(resolve, PROCESSING_DISPLAY_DELAY_MS))

      if (showStatus) {
        setStage("pushing")
        setProgress(85)
      }

      if (showStatus) {
        setStage("complete")
        setProgress(100)
      }

      const duration = Date.now() - startTime

      if (result.success) {
        if (showStatus) setStatus("success")
        setLastSynced(new Date())

        retryCountRef.current = 0
        setRetryCount(0)
        setNextRetryAt(null)
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
          retryTimeoutRef.current = null
        }

        try {
          await AsyncStorage.removeItem(SYNC_QUEUE_KEY)
        } catch (err) {
          console.warn("[Sync] Failed to clear sync queue:", err)
        }

        if (__DEV__) console.log(`[Sync] Sync completed in ${duration}ms`)
        logSyncOperation("full-sync", {
          recordsPulled: result.pulled || 0,
          recordsPushed: result.pushed || 0,
          duration,
          lastPulledAt: new Date(),
        })

        transaction?.setStatus({ code: 1 })
        transaction?.finish()
      } else {
        setStatus("error")
        setError(result.error ?? "Unknown error")

        retryCountRef.current += 1
        setRetryCount(retryCountRef.current)
        scheduleRetry(() => performSync(false))

        console.error(`[Sync] Sync failed after ${duration}ms (attempt ${retryCountRef.current}):`, result.error)
        logSyncOperation("full-sync", { error: new Error(result.error || "Unknown sync error"), duration })
        captureException(new Error(result.error || "Unknown sync error"), {
          component: "useSync",
          operation: "performSync",
          duration,
          retryAttempt: retryCountRef.current,
        })

        transaction?.setStatus({ code: 2 })
        transaction?.finish()
      }

      isSyncingRef.current = false

      if (pendingSyncRef.current) {
        pendingSyncRef.current = false
        if (__DEV__) console.log(`[Sync] Processing queued sync in ${PENDING_REQUEUE_DELAY_MS}ms...`)
        setTimeout(() => performSync(false), PENDING_REQUEUE_DELAY_MS)
      }

      if (showStatus && result.success) {
        setTimeout(() => {
          setStatus("idle")
          setProgress(0)
          setStage(null)
        }, STATUS_RESET_DELAY_MS)
      }

      return result
    } catch (error) {
      if (showStatus) {
        setProgress(0)
        setStage(null)
      }
      const duration = Date.now() - startTime
      console.error(`[Sync] Sync crashed after ${duration}ms:`, error)

      isSyncingRef.current = false

      const errorMessage = (error as Error).message
      setStatus("error")
      setError(errorMessage)
      retryCountRef.current += 1
      setRetryCount(retryCountRef.current)
      scheduleRetry(() => performSync(false))

      logSyncOperation("full-sync", { error: error as Error, duration })
      captureException(error as Error, {
        component: "useSync",
        operation: "performSync",
        duration,
        retryAttempt: retryCountRef.current,
      })

      transaction?.setStatus({ code: 2 })
      transaction?.finish()

      return { success: false, error: errorMessage }
    }
  }, [scheduleRetry])

  // Manual sync with full UI feedback
  const sync = useCallback(async () => {
    return performSync(true)
  }, [performSync])

  // Debounced background sync — queues a sync to happen after data changes
  const queueSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)

    AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify({ queuedAt: Date.now() })).catch(err => {
      console.warn("[Sync] Failed to persist sync queue:", err)
    })

    syncTimeoutRef.current = setTimeout(() => {
      performSync(false)
    }, QUEUE_DEBOUNCE_MS)
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

          if (age < PERSISTED_QUEUE_MAX_AGE_MS) {
            if (__DEV__) console.log("[Sync] Found persisted sync queue, processing now...")
            performSync(false)
          } else {
            if (__DEV__) console.log("[Sync] Persisted sync queue expired, clearing...")
            await AsyncStorage.removeItem(SYNC_QUEUE_KEY)
          }
        }
      } catch (err) {
        console.warn("[Sync] Failed to check persisted queue:", err)
      }
    }

    checkPersistedQueue()
  }, [performSync])

  // Real-time subscriptions — triggers queueSync when server data changes
  const { currentOrg } = useDatabase()

  useEffect(() => {
    if (!currentOrg) return

    if (__DEV__) console.log("[Sync] Setting up real-time subscriptions for org:", currentOrg.id)

    let channel = supabase.channel(`org-${currentOrg.id}`)

    for (const table of REALTIME_TABLES) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          if (__DEV__) console.log(`[Sync] Real-time change in ${table}:`, payload.eventType)
          queueSync()
        }
      )
    }

    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        if (__DEV__) console.log("[Sync] Real-time subscriptions active")
      } else if (status === 'CHANNEL_ERROR' && err) {
        console.warn("[Sync] Real-time channel error (may recover):", err)
      } else if (status === 'TIMED_OUT') {
        console.warn("[Sync] Real-time subscription timed out, will retry...")
      } else if (__DEV__) {
        console.log("[Sync] Channel status:", status)
      }
    })

    return () => {
      if (__DEV__) console.log("[Sync] Cleaning up real-time subscriptions")
      supabase.removeChannel(channel)
    }
  }, [currentOrg, queueSync])

  return { sync, queueSync, status, progress, stage, lastSynced, error, retryCount, nextRetryAt }
}
