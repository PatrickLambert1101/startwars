import { fireEvent, render } from "@testing-library/react-native"

import { ContactPhoneGate } from "./ContactPhoneGate"

let mockUser: any = { id: "first", user_metadata: {} }
const mockStorage = new Map<string, string>()
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: mockUser }) }))
jest.mock("@/theme/context", () => ({ useAppTheme: () => ({ themed: () => ({}) }) }))
jest.mock("@/utils/storage", () => ({
  loadString: (key: string) => mockStorage.get(key),
  saveString: (key: string, value: string) => mockStorage.set(key, value),
}))
jest.mock("@/components/Screen", () => ({ Screen: ({ children }: any) => children }))
jest.mock("./ContactPhoneForm", () => {
  const { Button } = require("react-native")
  return { ContactPhoneForm: ({ onSkip }: any) => <Button title="Not now" onPress={onSkip} /> }
})

beforeEach(() => {
  mockStorage.clear()
  mockUser = { id: "first", user_metadata: {} }
})

it("prompts an existing signed-in user and remembers their dismissal across launches", () => {
  const screen = render(<ContactPhoneGate />)
  fireEvent.press(screen.getByText("Not now"))
  expect(screen.queryByText("Not now")).toBeNull()
  screen.unmount()
  expect(render(<ContactPhoneGate />).queryByText("Not now")).toBeNull()
})

it("does not share dismissal between accounts", () => {
  mockStorage.set("contact-phone-dismissed:first", "true")
  mockUser = { id: "second", user_metadata: {} }
  expect(render(<ContactPhoneGate />).getByText("Not now")).toBeTruthy()
})

it("does not prompt users who already have a number or are signed out", () => {
  mockUser.user_metadata.contact_phone = "+27821234567"
  const screen = render(<ContactPhoneGate />)
  expect(screen.queryByText("Not now")).toBeNull()
  mockUser = null
  screen.rerender(<ContactPhoneGate />)
  expect(screen.queryByText("Not now")).toBeNull()
})
