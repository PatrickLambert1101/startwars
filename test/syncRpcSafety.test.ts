import { syncDatabase } from "../app/services/sync_rpc"

const mockRpc = jest.fn()
const mockCheckpoint = jest.fn()
const mockMarkUploaded = jest.fn()
let mockLocalChanges: Record<string, unknown> = {}

jest.mock("@/services/supabase", () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}))
jest.mock("@/db", () => ({
  database: {},
  schema: { version: 25, tables: { animals: {} } },
}))
jest.mock("@nozbe/watermelondb", () => ({ Q: {} }))
jest.mock("@nozbe/watermelondb/sync", () => ({
  synchronize: async ({ pullChanges, pushChanges }: any) => {
    const result = await pullChanges({ lastPulledAt: 100 })
    mockCheckpoint(result.timestamp)
    await pushChanges({ changes: mockLocalChanges })
    mockMarkUploaded()
  },
}))

const validPull = { timestamp: 1000, changes: {} }

it.each([true, false])(
  "shares one operation across simultaneous requests, including failure=%s",
  async (fails) => {
    let finish!: (value: unknown) => void
    mockRpc.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    const first = syncDatabase()
    const second = syncDatabase()
    expect(second).toBe(first)
    expect(mockRpc).toHaveBeenCalledTimes(1)
    finish({ data: fails ? null : validPull, error: null })
    expect((await first).success).toBe(!fails)
    expect(await second).toBe(await first)
    mockRpc.mockResolvedValueOnce({ data: validPull, error: null })
    expect((await syncDatabase()).success).toBe(true)
    expect(mockRpc).toHaveBeenCalledTimes(2)
  },
)

beforeEach(() => {
  jest.clearAllMocks()
  mockRpc.mockReset()
  mockLocalChanges = {}
})

it.each([
  null,
  {},
  { changes: {} },
  { timestamp: 1000 },
  { timestamp: 99, changes: {} },
  { timestamp: "1000", changes: {} },
  { timestamp: 1000, changes: [] },
])("rejects an invalid pull without advancing the checkpoint: %j", async (data) => {
  mockRpc.mockResolvedValueOnce({ data, error: null })
  expect((await syncDatabase()).success).toBe(false)
  expect(mockCheckpoint).not.toHaveBeenCalled()
  expect(mockMarkUploaded).not.toHaveBeenCalled()
})

it("accepts a legitimate empty pull with the server's checkpoint", async () => {
  mockRpc.mockResolvedValueOnce({ data: validPull, error: null })
  expect(await syncDatabase()).toEqual({ success: true })
  expect(mockCheckpoint).toHaveBeenCalledWith(1000)
  expect(mockRpc).toHaveBeenCalledTimes(1)
})

it("preserves the original API failure for classification and diagnosis", async () => {
  const error = { code: "42501", message: "permission denied" }
  mockRpc.mockResolvedValueOnce({ data: null, error })
  const result = await syncDatabase()
  expect(result.success).toBe(false)
  expect(result.cause).toMatchObject({
    cause: error,
    message: "Sync pull failed: permission denied",
  })
})

it.each([
  null,
  undefined,
  {},
  { success: false, error_count: 1 },
  { success: true, error_count: 1 },
  { success: "true" },
])("leaves records pending when a push is not acknowledged: %j", async (data) => {
  mockLocalChanges = {
    animals: { created: [{ id: "test-cow" }], updated: [], deleted: [] },
  }
  mockRpc
    .mockResolvedValueOnce({ data: validPull, error: null })
    .mockResolvedValueOnce({ data, error: null })
  expect((await syncDatabase()).success).toBe(false)
  expect(mockMarkUploaded).not.toHaveBeenCalled()
})

it("marks pending records uploaded only after an explicit successful acknowledgement", async () => {
  mockLocalChanges = {
    animals: {
      created: [{ id: "test-cow", _status: "created", _changed: "id" }],
      updated: [],
      deleted: [],
    },
  }
  mockRpc
    .mockResolvedValueOnce({ data: validPull, error: null })
    .mockResolvedValueOnce({ data: { success: true }, error: null })
  expect(await syncDatabase()).toEqual({ success: true })
  expect(mockMarkUploaded).toHaveBeenCalledTimes(1)
  expect(mockRpc).toHaveBeenLastCalledWith("sync_push", {
    changes: {
      animals: { created: [{ id: "test-cow" }], updated: [], deleted: [] },
    },
  })
})
