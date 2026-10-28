import { Alert } from "react-native"
import { act, renderHook } from "@testing-library/react-native"

import { useUnsavedChanges } from "./useUnsavedChanges"

const mockDispatch = jest.fn()
let mockPrevent: boolean
let mockOnPrevent: (event: any) => void
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ dispatch: mockDispatch }),
  usePreventRemove: (prevent: boolean, callback: (event: any) => void) => {
    mockPrevent = prevent
    mockOnPrevent = callback
  },
}))
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
const action = { type: "GO_BACK" }
beforeEach(() => {
  jest.clearAllMocks()
})
it("allows an untouched form to close without a discard prompt", () => {
  renderHook(() => useUnsavedChanges(false, false))
  expect(mockPrevent).toBe(false)
})
it("keeps edited input until discard is explicitly chosen", () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {})
  renderHook(() => useUnsavedChanges(true, false))
  act(() => mockOnPrevent({ data: { action } }))
  expect(mockDispatch).not.toHaveBeenCalled()
  const buttons = alert.mock.calls[0][2]!
  expect(buttons[0].style).toBe("cancel")
  act(() => buttons[1].onPress!())
  expect(mockDispatch).toHaveBeenCalledWith(action)
  alert.mockRestore()
})
it("holds the screen while writing and permits exit after a successful save", () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {})
  const { result } = renderHook(() => useUnsavedChanges(true, true))
  act(() => mockOnPrevent({ data: { action } }))
  expect(alert).not.toHaveBeenCalled()
  expect(mockDispatch).not.toHaveBeenCalled()
  act(() => result.current())
  act(() => mockOnPrevent({ data: { action } }))
  expect(mockDispatch).toHaveBeenCalledWith(action)
  alert.mockRestore()
})
