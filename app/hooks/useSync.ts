import { useCallback, useState, useEffect, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

import { useDatabase } from "@/context/DatabaseContext"
import { flushPhotoQueue } from "@/services/photoUploadQueue"
import { logSyncOperation, captureException } from "@/services/sentry"
import { supabase } from "@/services/supabase"
import { syncDatabase, type SyncResult } from "@/services/sync_rpc"
import { calculateScheduledVaccinations } from "@/services/vaccinationScheduler"
import {
  createSyncFailureGate,
  isSyncTransportFailure,
  syncErrorMessage,
} from "@/utils/syncFailures"

export type SyncStatus = "idle" | "syncing" | "success" | "error"
export type SyncStage = "pulling" | "processing" | "pushing" | "complete"

const SYNC_QUEUE_KEY = "sync_queue"

// Sync timing constants
const QUEUE_DEBOUNCE_MS = 10_000 // Debounce queued syncs (low-end devices)
const PENDING_REQUEUE_DELAY_MS = 5_000 // Delay before running a sync queued during another sync
const STATUS_RESET_DELAY_MS = 3_000 // Delay before clearing status UI after success/error
const PROCESSING_DISPLAY_DELAY_MS = 300 // Artificial delay so users can see "processing" stage
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
  const { currentOrg } = useDatabase()

  // performSync is memoised on [scheduleRetry] only, so reading currentOrg
  // directly from its closure would pin it to the first render (null, before
  // the org loads). Mirror it into a ref instead of widening the deps, which
  // would change performSync's identity and re-fire the effects keyed on it.
  const currentOrgRef = useRef(currentOrg)
  useEffect(() => {
    currentOrgRef.current = currentOrg
  }, [currentOrg])

  const [status, setStatus] = useState<SyncStatus>("idle")
  const [progress, setProgress] = useState<number>(0)
  const [stage, setStage] = useState<SyncStage | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState<number>(0)
  const [nextRetryAt, setNextRetryAt] = useState<Date | null>(null)

  const inFlightRef = useRef<Promise<SyncResult> | null>(null)
  const pendingSyncRef = useRef(false)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasCheckedQueue = useRef(false)
  const retryCountRef = useRef(0)
  const failureGate = useRef(createSyncFailureGate())
  const mountedRef = useRef(true)
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      for (const timer of [syncTimeoutRef, retryTimeoutRef, pendingTimeoutRef, statusTimeoutRef]) {
        if (timer.current) clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [])

  const scheduleRetry = useCallback((runSync: () => void) => {
    // The failure count starts at one; retry delays are indexed from zero.
    const attempt = retryCountRef.current - 1
    if (attempt >= MAX_RETRY_ATTEMPTS) {
      if (__DEV__ && attempt === MAX_RETRY_ATTEMPTS) {
        console.warn(`[Sync] Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached`)
      }
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

  const performSync = useCallback(
    (showStatus = true): Promise<SyncResult> => {
      if (!mountedRef.current)
        return Promise.resolve({ success: false, error: "Sync no longer active" })
      if (inFlightRef.current) {
        pendingSyncRef.current = true
        return inFlightRef.current
      }
      const run = async (): Promise<SyncResult> => {
        let succeeded = false
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current)
        if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current)
        pendingTimeoutRef.current = null
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
        setNextRetryAt(null)
        if (showStatus) {
          setStatus("syncing")
          setError(null)
          setProgress(10)
          setStage("pulling")
        }

        const startTime = Date.now()
        const fail = (failure: unknown) => {
          const duration = Date.now() - startTime
          const syncError =
            failure instanceof Error ? failure : new Error(syncErrorMessage(failure))
          setStatus("error")
          setError(syncError.message)
          setProgress(0)
          setStage(null)
          retryCountRef.current += 1
          setRetryCount(retryCountRef.current)
          scheduleRetry(() => performSync(false))

          logSyncOperation("full-sync", {
            error: syncError,
            level: isSyncTransportFailure(failure) ? "warning" : "error",
            duration,
          })
          if (failureGate.current.shouldReport(failure)) {
            captureException(syncError, {
              component: "useSync",
              operation: "performSync",
              duration,
              retryAttempt: retryCountRef.current,
            })
          }
          return { success: false, error: syncError.message }
        }

        try {
          const result = await syncDatabase()
          if (!mountedRef.current) return result
          if (!result.success)
            return fail(result.cause ?? new Error(result.error ?? "Unknown sync error"))

          if (showStatus) {
            setStage("processing")
            setProgress(60)
            await new Promise((resolve) => setTimeout(resolve, PROCESSING_DISPLAY_DELAY_MS))
            if (!mountedRef.current) return result
            setStage("complete")
            setProgress(100)
          }

          succeeded = true
          // Recovery from a background retry must also clear the previous error.
          setStatus("success")
          setError(null)
          setLastSynced(new Date())
          retryCountRef.current = 0
          setRetryCount(0)
          failureGate.current.clear()

          try {
            await AsyncStorage.removeItem(SYNC_QUEUE_KEY)
          } catch (err) {
            console.warn("[Sync] Failed to clear sync queue:", err)
          }

          logSyncOperation("full-sync", {
            duration: Date.now() - startTime,
            lastPulledAt: new Date(),
          })

          // A pull can bring animals from another device; update their schedules
          // after every successful sync because the RPC does not return row counts.
          const orgForRecalc = currentOrgRef.current
          if (orgForRecalc) {
            calculateScheduledVaccinations(orgForRecalc.id).catch((err) => {
              console.error("[Sync] Failed to recalculate vaccinations after pull:", err)
            })
          }
          flushPhotoQueue().catch((err) => {
            console.error("[Sync] Failed to flush photo queue after sync:", err)
          })

          if (mountedRef.current) {
            statusTimeoutRef.current = setTimeout(() => {
              statusTimeoutRef.current = null
              setStatus("idle")
              setProgress(0)
              setStage(null)
            }, STATUS_RESET_DELAY_MS)
          }
          return result
        } catch (failure) {
          if (!mountedRef.current) return { success: false, error: syncErrorMessage(failure) }
          return fail(failure)
        } finally {
          const pending = pendingSyncRef.current
          pendingSyncRef.current = false
          // On failure, the retry timer owns the next attempt. Queued requests must
          // not create a second timer that bypasses the failure backoff.
          if (mountedRef.current && succeeded && pending) {
            pendingTimeoutRef.current = setTimeout(() => {
              pendingTimeoutRef.current = null
              performSync(false)
            }, PENDING_REQUEUE_DELAY_MS)
          }
        }
      }
      const operation = run()
      inFlightRef.current = operation
      const release = () => {
        if (inFlightRef.current === operation) inFlightRef.current = null
      }
      void operation.then(release, release)
      return operation
    },
    [scheduleRetry],
  )

  // Manual sync with full UI feedback
  const sync = useCallback(async () => {
    return performSync(true)
  }, [performSync])

  // Debounced background sync — queues a sync to happen after data changes
  const queueSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)

    AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify({ queuedAt: Date.now() })).catch((err) => {
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
  useEffect(() => {
    if (!currentOrg) return

    if (__DEV__) console.log("[Sync] Setting up real-time subscriptions for org:", currentOrg.id)

    let channel = supabase.channel(`org-${currentOrg.id}`)

    for (const table of REALTIME_TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          if (__DEV__) console.log(`[Sync] Real-time change in ${table}:`, payload.eventType)
          queueSync()
        },
      )
    }

    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        if (__DEV__) console.log("[Sync] Real-time subscriptions active")
      } else if (status === "CHANNEL_ERROR" && err) {
        console.warn("[Sync] Real-time channel error (may recover):", err)
      } else if (status === "TIMED_OUT") {
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

  return {
    sync,
    queueSync,
    status,
    progress,
    stage,
    lastSynced,
    error,
    retryCount,
    nextRetryAt,
  }
}
