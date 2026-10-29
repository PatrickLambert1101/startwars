import { Alert } from "react-native"
import { fireEvent, render, waitFor } from "@testing-library/react-native"

import { TreatmentProtocolsScreen } from "../app/screens/TreatmentProtocolsScreen/TreatmentProtocolsScreen"

const mockSeedDefaults = jest.fn().mockResolvedValue(12)
jest.mock("@/hooks/useProtocols", () => ({
  useProtocols: () => ({ protocols: [], isLoading: false }),
  useProtocolActions: () => ({ seedDefaultProtocols: mockSeedDefaults }),
}))
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
jest.mock("@/theme/context", () => ({ useAppTheme: () => ({ themed: () => ({}) }) }))
jest.mock("@/components/BentoPageChrome", () => ({ BentoPageIntro: () => null }))
jest.mock("@/components", () => {
  const { View, Text, Pressable } = require("react-native")
  return {
    Screen: View,
    Icon: () => null,
    Text: ({ text, children }: any) => <Text>{text || children}</Text>,
    Button: ({ text, onPress, disabled }: any) => (
      <Pressable onPress={onPress} disabled={disabled}>
        <Text>{text}</Text>
      </Pressable>
    ),
  }
})

it("loads default protocols only after the farmer chooses the action", async () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {})
  const ui = render(<TreatmentProtocolsScreen navigation={{} as any} route={{} as any} />)
  expect(mockSeedDefaults).not.toHaveBeenCalled()
  fireEvent.press(ui.getByText("treatmentProtocolsScreen.empty.loadDefaultsButton"))
  await waitFor(() => expect(mockSeedDefaults).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(alert).toHaveBeenCalled())
  alert.mockRestore()
})
