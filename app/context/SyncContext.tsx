import React, { createContext, useContext, ReactNode } from "react"
import { useSync, SyncStage, SyncStatus } from "@/hooks/useSync"

interface SyncContextValue {
  sync: () => Promise<{ success: boolean; error?: string }>
  queueSync: () => void
  status: SyncStatus
  progress: number
  stage: SyncStage | null
  lastSynced: Date | null
  error: string | null
  retryCount: number
  nextRetryAt: Date | null
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined)

export function SyncProvider({ children }: { children: ReactNode }) {
  const { sync, queueSync, status, progress, stage, lastSynced, error, retryCount, nextRetryAt } = useSync()

  return (
    <SyncContext.Provider value={{ sync, queueSync, status, progress, stage, lastSynced, error, retryCount, nextRetryAt }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSyncContext() {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error("useSyncContext must be used within a SyncProvider")
  }
  return context
}
