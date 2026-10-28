import { act, renderHook } from "@testing-library/react-native"

import { usePendingInvites } from "../app/hooks/usePendingInvites"

const mockUser = { id: "test-user", email: "user@example.test" }
const mockRpc = jest.fn()
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: mockUser }) }))
jest.mock("@/context/SyncContext", () => ({ useSyncContext: () => ({ queueSync: jest.fn() }) }))
jest.mock("@/services/supabase", () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}))
let errorLog: jest.SpyInstance
beforeEach(() => {
  mockRpc.mockReset()
  errorLog = jest.spyOn(console, "error").mockImplementation(() => {})
})
afterEach(() => {
  errorLog.mockRestore()
})

it("keeps already loaded invitations when an offline refresh fails", async () => {
  mockRpc.mockResolvedValueOnce({
    data: [
      { id: "invite-1", organization_id: "farm-1", organization_name: "Test Farm", role: "worker" },
    ],
    error: null,
  })
  const { result } = renderHook(() => usePendingInvites())
  await act(async () => {})
  expect(result.current.invites).toHaveLength(1)
  mockRpc.mockResolvedValueOnce({
    data: null,
    error: { code: "", message: "TypeError: Network request failed" },
  })
  await act(async () => {
    await result.current.refetch()
  })
  expect(result.current.invites[0].id).toBe("invite-1")
  expect(result.current.isLoading).toBe(false)
  expect(errorLog).not.toHaveBeenCalled()
})

it("still reports genuine permission failures", async () => {
  const error = { code: "42501", message: "permission denied" }
  mockRpc.mockResolvedValue({ data: null, error })
  const { result } = renderHook(() => usePendingInvites())
  await act(async () => {})
  expect(result.current.invites).toEqual([])
  expect(errorLog).toHaveBeenCalledWith("[Invites] Failed to load pending invites:", error)
})

it("handles a thrown transport failure without an error overlay", async () => {
  mockRpc.mockRejectedValue(new TypeError("Network request failed"))
  const { result } = renderHook(() => usePendingInvites())
  await act(async () => {})
  expect(result.current.isLoading).toBe(false)
  expect(errorLog).not.toHaveBeenCalled()
})
