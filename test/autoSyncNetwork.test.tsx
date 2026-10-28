import { act, render } from "@testing-library/react-native"

import { AutoSync } from "../app/components/AutoSync"

const mockQueueSync = jest.fn()
const mockNetwork = jest.fn()
let mockAuthenticated = true
jest.mock("@/context/SyncContext", () => ({
  useSyncContext: () => ({ queueSync: mockQueueSync }),
}))
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: mockAuthenticated }),
}))
jest.mock("@/context/DatabaseContext", () => ({
  useDatabase: () => ({ currentOrg: null }),
}))
jest.mock("@/db", () => ({ database: {} }))
jest.mock("@nozbe/watermelondb", () => ({ Q: {} }))
jest.mock("expo-network", () => ({
  getNetworkStateAsync: () => mockNetwork(),
}))

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  mockNetwork.mockReset().mockResolvedValue({ isConnected: false, isInternetReachable: false })
  mockAuthenticated = true
})
afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

it("handles connectivity-probe failures without unhandled promises or repeated warnings", async () => {
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
  mockNetwork.mockRejectedValue(new Error("Native network probe unavailable"))
  render(<AutoSync />)
  mockQueueSync.mockClear()
  await act(async () => {
    await jest.advanceTimersByTimeAsync(60000)
  })
  expect(mockNetwork).toHaveBeenCalledTimes(2)
  expect(mockQueueSync).not.toHaveBeenCalled()
  expect(warn).toHaveBeenCalledTimes(1)
  warn.mockRestore()
})

it("preserves an offline state through unknown reachability, then syncs on recovery", async () => {
  mockNetwork
    .mockResolvedValueOnce({ isConnected: false, isInternetReachable: false })
    .mockResolvedValueOnce({
      isConnected: true,
      isInternetReachable: undefined,
    })
    .mockResolvedValueOnce({ isConnected: true, isInternetReachable: true })
  render(<AutoSync />)
  mockQueueSync.mockClear()
  await act(async () => {
    await jest.advanceTimersByTimeAsync(90000)
  })
  expect(mockQueueSync).toHaveBeenCalledTimes(1)
})

it("does not queue a late network result after logout or unmount", async () => {
  let finish!: (value: unknown) => void
  mockNetwork
    .mockResolvedValueOnce({ isConnected: false, isInternetReachable: false })
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
  const view = render(<AutoSync />)
  mockQueueSync.mockClear()
  await act(async () => {
    await jest.advanceTimersByTimeAsync(60000)
  })
  view.unmount()
  await act(async () => {
    finish({ isConnected: true, isInternetReachable: true })
  })
  expect(mockQueueSync).not.toHaveBeenCalled()
})

it("runs an initial sync again after signing out and signing back in", () => {
  const view = render(<AutoSync />)
  expect(mockQueueSync).toHaveBeenCalledTimes(1)
  mockAuthenticated = false
  view.rerender(<AutoSync />)
  mockAuthenticated = true
  view.rerender(<AutoSync />)
  expect(mockQueueSync).toHaveBeenCalledTimes(2)
})
