import { useCallback, useRef, useState } from "react"

/** The ref blocks a second tap even before React updates the disabled button. */
export function useSaveGuard() {
  const busy = useRef(false)
  const [isSaving, setIsSaving] = useState(false)
  const runSave = useCallback(async (save: () => Promise<void>) => {
    if (busy.current) return false
    busy.current = true
    setIsSaving(true)
    try {
      await save()
      return true
    } finally {
      busy.current = false
      setIsSaving(false)
    }
  }, [])
  return { isSaving, runSave }
}
