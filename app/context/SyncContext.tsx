import React, { createContext, useContext, ReactNode } from "react"
import { useSync } from "@/hooks/useSync"

interface SyncContextValue {
  queueSync: () => void
  status: "idle" | "syncing" | "error"
  lastSynced: Date | null
  error: string | null
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined)

export function SyncProvider({ children }: { children: ReactNode }) {
  const { queueSync, status, lastSynced, error } = useSync()

  return <SyncContext.Provider value={{ queueSync, status, lastSynced, error }}>{children}</SyncContext.Provider>
}

export function useSyncContext() {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error("useSyncContext must be used within a SyncProvider")
  }
  return context
}
