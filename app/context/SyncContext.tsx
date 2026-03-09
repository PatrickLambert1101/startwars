import React, { createContext, useContext, ReactNode } from "react"
import { useSync } from "@/hooks/useSync"

interface SyncContextValue {
  queueSync: () => void
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined)

export function SyncProvider({ children }: { children: ReactNode }) {
  const { queueSync } = useSync()

  return <SyncContext.Provider value={{ queueSync }}>{children}</SyncContext.Provider>
}

export function useSyncContext() {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error("useSyncContext must be used within a SyncProvider")
  }
  return context
}
