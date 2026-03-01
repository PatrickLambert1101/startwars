import { useCallback, useState } from "react"
import { syncDatabase } from "@/services/sync"

export type SyncStatus = "idle" | "syncing" | "success" | "error"

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle")
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sync = useCallback(async () => {
    setStatus("syncing")
    setError(null)

    const result = await syncDatabase()

    if (result.success) {
      setStatus("success")
      setLastSynced(new Date())
    } else {
      setStatus("error")
      setError(result.error ?? "Unknown error")
    }

    // Reset to idle after a few seconds
    setTimeout(() => setStatus("idle"), 3000)

    return result
  }, [])

  return { sync, status, lastSynced, error }
}
