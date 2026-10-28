import { act, renderHook } from "@testing-library/react-native"

import { useSync } from "../app/hooks/useSync"

const mockSyncDatabase = jest.fn()
const mockCaptureException = jest.fn()
const mockLogSync = jest.fn()
const mockRemoveItem = jest.fn().mockResolvedValue(undefined)
const mockChannel = { on: jest.fn().mockReturnThis(), subscribe: jest.fn() }
jest.mock("@/services/sync_rpc", () => ({
  syncDatabase: () => mockSyncDatabase(),
}))
jest.mock("@/services/sentry", () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
  logSyncOperation: (...args: unknown[]) => mockLogSync(...args),
}))
jest.mock("@/context/DatabaseContext", () => ({
  useDatabase: () => ({ currentOrg: null }),
}))
jest.mock("@/services/supabase", () => ({
  supabase: { channel: () => mockChannel, removeChannel: jest.fn() },
}))
jest.mock("@/services/vaccinationScheduler", () => ({
  calculateScheduledVaccinations: jest.fn().mockResolvedValue(undefined),
}))
jest.mock("@/services/photoUploadQueue", () => ({
  flushPhotoQueue: jest.fn().mockResolvedValue(undefined),
}))
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: (...args: unknown[]) => mockRemoveItem(...args),
}))

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  mockSyncDatabase.mockReset()
})
afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

it("keeps offline changes pending and recovers the error display on the first background retry", async () => {
  mockSyncDatabase
    .mockResolvedValueOnce({
      success: false,
      error: "Sync pull failed: TypeError: Network request failed",
    })
    .mockResolvedValue({ success: true })
  const { result } = renderHook(() => useSync())
  await act(async () => {
    await result.current.sync()
  })
  expect(result.current.status).toBe("error")
  expect(result.current.stage).toBeNull()
  expect(result.current.progress).toBe(0)
  expect(result.current.lastSynced).toBeNull()
  expect(mockRemoveItem).not.toHaveBeenCalled()
  expect(mockCaptureException).not.toHaveBeenCalled()
  await act(async () => {
    await jest.advanceTimersByTimeAsync(5000)
  })
  expect(mockSyncDatabase).toHaveBeenCalledTimes(2)
  expect(result.current.status).toBe("success")
  expect(result.current.error).toBeNull()
  expect(result.current.retryCount).toBe(0)
  expect(result.current.nextRetryAt).toBeNull()
  expect(result.current.lastSynced).toBeInstanceOf(Date)
  expect(mockRemoveItem).toHaveBeenCalledWith("sync_queue")
})

it("reports real failures once across retries and preserves retry breadcrumbs", async () => {
  mockSyncDatabase.mockResolvedValue({
    success: false,
    error: "permission denied",
  })
  const { result } = renderHook(() => useSync())
  await act(async () => {
    await result.current.sync()
  })
  await act(async () => {
    await result.current.sync()
  })
  expect(mockCaptureException).toHaveBeenCalledTimes(1)
  expect(mockLogSync).toHaveBeenCalledTimes(2)
})

it("uses every configured backoff delay and stops automatic retries afterwards", async () => {
  mockSyncDatabase.mockResolvedValue({
    success: false,
    error: "Network request failed",
  })
  const { result } = renderHook(() => useSync())
  await act(async () => {
    await result.current.sync()
  })
  for (const [index, delay] of [5000, 15000, 45000, 120000, 300000].entries()) {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(delay - 1)
    })
    expect(mockSyncDatabase).toHaveBeenCalledTimes(index + 1)
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1)
    })
    expect(mockSyncDatabase).toHaveBeenCalledTimes(index + 2)
  }
  expect(result.current.nextRetryAt).toBeNull()
  await act(async () => {
    await jest.advanceTimersByTimeAsync(600000)
  })
  expect(mockSyncDatabase).toHaveBeenCalledTimes(6)
})

it("cancels retry timers when the sync provider unmounts", async () => {
  mockSyncDatabase.mockResolvedValue({
    success: false,
    error: "Network request failed",
  })
  const { result, unmount } = renderHook(() => useSync())
  await act(async () => {
    await result.current.sync()
  })
  unmount()
  await act(async () => {
    await jest.advanceTimersByTimeAsync(600000)
  })
  expect(mockSyncDatabase).toHaveBeenCalledTimes(1)
})

it("does not start a second pending timer alongside a failed request's retry", async () => {
  let finish!: (value: { success: boolean; error: string }) => void
  mockSyncDatabase
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    .mockResolvedValue({ success: false, error: "Network request failed" })
  const { result } = renderHook(() => useSync())
  let first!: ReturnType<typeof result.current.sync>
  act(() => {
    first = result.current.sync()
  })
  let second!: ReturnType<typeof result.current.sync>
  act(() => {
    second = result.current.sync()
  })
  await act(async () => {
    finish({ success: false, error: "Network request failed" })
    expect((await first).success).toBe(false)
    expect((await second).success).toBe(false)
  })
  expect(result.current.nextRetryAt?.getTime()).toBe(Date.now() + 5000)
  await act(async () => {
    await jest.advanceTimersByTimeAsync(5000)
  })
  expect(mockSyncDatabase).toHaveBeenCalledTimes(2)
})
