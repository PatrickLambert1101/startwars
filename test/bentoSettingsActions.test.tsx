import { fireEvent, render } from "@testing-library/react-native"

import { BentoManagementGrid, BentoSettingsOverview } from "../app/components/BentoPageChrome"

let mockDark = false
jest.mock("@/theme/context", () => ({ useAppTheme: () => ({ theme: { isDark: mockDark } }) }))
jest.mock("@expo/vector-icons", () => ({ MaterialCommunityIcons: () => null }))
jest.mock("@/components/Text", () => ({
  Text: ({ text }: { text: string }) => {
    const { Text } = require("react-native")
    return <Text>{text}</Text>
  },
}))
it.each([false, true])(
  "keeps settings account and management actions usable in dark theme %s",
  (dark) => {
    mockDark = dark
    const onPlan = jest.fn()
    const actions = ["Team", "Treatment protocols", "Vaccination schedules", "Import records"].map(
      (label) => ({ label, icon: "barn" as const, onPress: jest.fn() }),
    )
    const ui = render(
      <>
        <BentoSettingsOverview
          farm="Test farm"
          email="farmer@example.com"
          plan="Farm"
          language="English"
          onPlan={onPlan}
        />
        <BentoManagementGrid actions={actions} />
      </>,
    )
    expect(ui.getByText("Test farm")).toBeTruthy()
    expect(ui.getByText("farmer@example.com")).toBeTruthy()
    fireEvent.press(ui.getByRole("button", { name: "Manage Farm plan" }))
    expect(onPlan).toHaveBeenCalledTimes(1)
    for (const action of actions) {
      fireEvent.press(ui.getByRole("button", { name: action.label }))
      expect(action.onPress).toHaveBeenCalledTimes(1)
    }
  },
)
