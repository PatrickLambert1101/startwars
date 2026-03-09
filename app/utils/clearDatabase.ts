/**
 * Utility to clear the IndexedDB database when needed
 * This is useful when migrations fail or the database gets into a bad state
 */
export async function clearIndexedDB(dbName: string = "herdtrackr"): Promise<boolean> {
  try {
    if (typeof indexedDB === "undefined") {
      console.log("[DB] IndexedDB not available")
      return false
    }

    return new Promise((resolve) => {
      const request = indexedDB.deleteDatabase(dbName)

      request.onsuccess = () => {
        console.log(`[DB] Successfully deleted database: ${dbName}`)
        resolve(true)
      }

      request.onerror = () => {
        console.error(`[DB] Error deleting database: ${dbName}`, request.error)
        resolve(false)
      }

      request.onblocked = () => {
        console.warn(`[DB] Delete blocked for: ${dbName}`)
        resolve(false)
      }
    })
  } catch (error) {
    console.error("[DB] Exception clearing IndexedDB:", error)
    return false
  }
}

/**
 * Check if we should clear the database based on a stored flag
 */
export function shouldClearDatabase(): boolean {
  try {
    const flag = localStorage.getItem("herdtrackr_clear_db")
    if (flag === "true") {
      localStorage.removeItem("herdtrackr_clear_db")
      return true
    }
  } catch (e) {
    // localStorage not available
  }
  return false
}

/**
 * Set a flag to clear the database on next load
 */
export function scheduleDatabaseClear(): void {
  try {
    localStorage.setItem("herdtrackr_clear_db", "true")
    console.log("[DB] Scheduled database clear for next reload")
  } catch (e) {
    console.error("[DB] Could not schedule database clear:", e)
  }
}
