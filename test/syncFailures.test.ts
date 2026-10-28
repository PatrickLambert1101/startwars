import {
  createSyncFailureGate,
  isSyncTransportFailure,
  SyncRpcError,
} from "../app/utils/syncFailures"

it.each([
  "Network request failed",
  "TypeError: Network request failed",
  "Failed to fetch",
  "Load failed",
])("recognizes an expected transport failure: %s", (message) =>
  expect(isSyncTransportFailure(new SyncRpcError("pull", new Error(message)))).toBe(true),
)

it.each([
  new Error("permission denied"),
  new Error("duplicate key value"),
  { code: "42501", message: "Network request failed" },
  { code: "PGRST301", message: "JWT expired" },
  new Error("Database network configuration invalid"),
])("keeps database and authentication failures reportable: %j", (error) => {
  expect(isSyncTransportFailure(new SyncRpcError("push", error))).toBe(false)
})

it("reports a real failure once per cooldown, and starts a fresh incident after recovery", () => {
  const gate = createSyncFailureGate(1000)
  const error = new Error("permission denied")
  expect(gate.shouldReport(error, 0)).toBe(true)
  expect(gate.shouldReport(error, 999)).toBe(false)
  expect(gate.shouldReport(new Error("disk full"), 999)).toBe(true)
  expect(gate.shouldReport(error, 1000)).toBe(true)
  gate.clear()
  expect(gate.shouldReport(error, 1001)).toBe(true)
  expect(gate.shouldReport(new Error("Network request failed"), 1001)).toBe(false)
})
