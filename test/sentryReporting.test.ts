const mockInit = jest.fn()
const mockCapture = jest.fn()
jest.mock("@sentry/react-native", () => ({
  init: (...args: unknown[]) => mockInit(...args),
  setContext: jest.fn(),
  reactNativeTracingIntegration: () => ({ name: "Tracing" }),
  captureException: (...args: unknown[]) => mockCapture(...args),
}))
jest.mock("react-native", () => ({ Platform: { OS: "ios", Version: "18.4" } }))

const originalDev = __DEV__
const originalDsn = process.env.EXPO_PUBLIC_SENTRY_DSN
const originalDebug = process.env.EXPO_PUBLIC_SENTRY_DEBUG
function configuration() {
  const { initSentry } = require("../app/services/sentry")
  initSentry()
  return mockInit.mock.calls[mockInit.mock.calls.length - 1][0]
}
beforeEach(() => {
  jest.clearAllMocks()
  process.env.EXPO_PUBLIC_SENTRY_DSN = "https://public@example.test/1"
  delete process.env.EXPO_PUBLIC_SENTRY_DEBUG
  Object.defineProperty(global, "__DEV__", {
    value: true,
    writable: true,
    configurable: true,
  })
})
afterAll(() => {
  Object.defineProperty(global, "__DEV__", {
    value: originalDev,
    writable: true,
    configurable: true,
  })
  if (originalDsn === undefined) delete process.env.EXPO_PUBLIC_SENTRY_DSN
  else process.env.EXPO_PUBLIC_SENTRY_DSN = originalDsn
  if (originalDebug === undefined) delete process.env.EXPO_PUBLIC_SENTRY_DEBUG
  else process.env.EXPO_PUBLIC_SENTRY_DEBUG = originalDebug
})

it("keeps SDK debugging off by default and always off in production", () => {
  expect(configuration().debug).toBe(false)
  process.env.EXPO_PUBLIC_SENTRY_DEBUG = "true"
  expect(configuration().debug).toBe(true)
  Object.defineProperty(global, "__DEV__", { value: false })
  expect(configuration().debug).toBe(false)
})

it.each(["RevenueCat purchase verification failed", "Unable to authorize offerings request"])(
  "retains genuine payment failures: %s",
  (message) => {
    const event = { event_id: "payment-error" }
    expect(
      configuration().beforeSend(event, {
        originalException: new Error(message),
      }),
    ).toBe(event)
  },
)

it("reports an exception without generating a second console error overlay", () => {
  const errorLog = jest.spyOn(console, "error").mockImplementation(() => {})
  const { captureException } = require("../app/services/sentry")
  const failure = new Error("disk full")
  captureException(failure, { operation: "save" })
  expect(mockCapture).toHaveBeenCalledWith(failure, expect.any(Object))
  expect(errorLog).not.toHaveBeenCalled()
  errorLog.mockRestore()
})
