import { act, renderHook } from "@testing-library/react-native"

import { useSaveGuard } from "./useSaveGuard"

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
it("blocks two immediate save taps before React can disable the button", async () => {
  const pending = deferred()
  const save = jest.fn(() => pending.promise)
  const { result } = renderHook(() => useSaveGuard())
  let first!: Promise<boolean>
  let second!: Promise<boolean>
  act(() => {
    first = result.current.runSave(save)
    second = result.current.runSave(save)
  })
  expect(save).toHaveBeenCalledTimes(1)
  expect(result.current.isSaving).toBe(true)
  expect(await second).toBe(false)
  await act(async () => {
    pending.resolve()
    expect(await first).toBe(true)
  })
  expect(result.current.isSaving).toBe(false)
})
it("releases the lock after a failed write so the existing input can be retried", async () => {
  const { result } = renderHook(() => useSaveGuard())
  await act(async () => {
    await expect(
      result.current.runSave(async () => {
        throw new Error("disk full")
      }),
    ).rejects.toThrow("disk full")
  })
  expect(result.current.isSaving).toBe(false)
  const retry = jest.fn(async () => {})
  await act(async () => {
    expect(await result.current.runSave(retry)).toBe(true)
  })
  expect(retry).toHaveBeenCalledTimes(1)
})
