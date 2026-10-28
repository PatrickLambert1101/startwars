/** Expected transport failures are normal while working offline. */
export function isSyncTransportFailure(error: unknown): boolean {
  if (error && typeof error === "object") {
    const value = error as {
      cause?: unknown
      code?: unknown
      name?: unknown
      message?: unknown
    }
    if (value.cause !== undefined && value.cause !== error) {
      return isSyncTransportFailure(value.cause)
    }
    // Database/API codes take precedence over wording in a server message.
    if (
      typeof value.code === "string" &&
      value.code &&
      !["FETCH_ERROR", "NETWORK_ERROR"].includes(value.code)
    ) {
      return false
    }
    if (value.name === "AuthRetryableFetchError") return true
  }

  const message = syncErrorMessage(error).replace(/^Sync (?:pull|push) failed: /, "")
  return /^(?:TypeError: )?(?:Network request failed|Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)$/i.test(
    message,
  )
}

export function syncErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }
  return typeof error === "string" ? error : "Unknown sync error"
}

/** Preserve the original failure, including its API code and stack, for reporting. */
export class SyncRpcError extends Error {
  readonly cause: unknown

  constructor(operation: "pull" | "push", cause: unknown) {
    super(`Sync ${operation} failed: ${syncErrorMessage(cause)}`)
    this.name = "SyncRpcError"
    this.cause = cause
  }
}

/** Report the first real failure; retain retry breadcrumbs without flooding Sentry. */
export function createSyncFailureGate(cooldownMs = 5 * 60_000) {
  const reported = new Map<string, number>()
  return {
    shouldReport(error: unknown, now = Date.now()): boolean {
      if (isSyncTransportFailure(error)) return false
      const key = `${error instanceof Error ? error.name : "Error"}:${syncErrorMessage(error)}`
      const previous = reported.get(key)
      if (previous !== undefined && now - previous < cooldownMs) return false
      reported.delete(key)
      reported.set(key, now)
      // Bound memory even when the server returns many distinct failures.
      if (reported.size > 32) reported.delete(reported.keys().next().value!)
      return true
    },
    clear() {
      reported.clear()
    },
  }
}
