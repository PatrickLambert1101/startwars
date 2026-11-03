import { fireEvent, render, waitFor } from "@testing-library/react-native"

import { ContactPhoneForm } from "./ContactPhoneForm"

const mockUpdate = jest.fn()
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { user_metadata: {} }, updateContactPhone: mockUpdate }),
}))
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
jest.mock("@/theme/context", () => ({ useAppTheme: () => ({ themed: () => ({}) }) }))
jest.mock("@/components", () => {
  const { Button, Text, TextInput } = require("react-native")
  return {
    Button: ({ text, onPress, disabled }: any) => (
      <Button title={text} onPress={onPress} disabled={disabled} />
    ),
    Text: ({ text }: any) => <Text>{text}</Text>,
    TextField: ({ label, helper, ...props }: any) => (
      <>
        <TextInput accessibilityLabel={label} {...props} />
        <Text>{helper}</Text>
      </>
    ),
  }
})
beforeEach(() => mockUpdate.mockReset())

it("rejects invalid input without saving", () => {
  const screen = render(<ContactPhoneForm />)
  fireEvent.changeText(screen.getByLabelText("contactPhone.label"), "123")
  fireEvent.press(screen.getByText("contactPhone.save"))
  expect(screen.getByText("contactPhone.invalid")).toBeTruthy()
  expect(mockUpdate).not.toHaveBeenCalled()
})

it("keeps the entered number after failure and lets the user retry", async () => {
  mockUpdate.mockResolvedValueOnce({ error: "saveFailed" }).mockResolvedValueOnce({ error: null })
  const screen = render(<ContactPhoneForm />)
  fireEvent.changeText(screen.getByLabelText("contactPhone.label"), "082 123 4567")
  fireEvent.press(screen.getByText("contactPhone.save"))
  await waitFor(() => expect(screen.getByText("contactPhone.saveFailed")).toBeTruthy())
  expect(screen.getByLabelText("contactPhone.label").props.value).toBe("082 123 4567")
  fireEvent.press(screen.getByText("contactPhone.save"))
  await waitFor(() => expect(screen.getByText("contactPhone.saved")).toBeTruthy())
  expect(mockUpdate).toHaveBeenLastCalledWith("+27821234567")
})
