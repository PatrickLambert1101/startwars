import { Keyboard } from "react-native"
import { act, fireEvent, render } from "@testing-library/react-native"

import { PlanSwitcher } from "../app/components/PlanSwitcher"
import { BentoTabBar } from "../app/navigators/MainTabNavigator"

const mockNavigate = jest.fn()
const mockEmit = jest.fn(() => ({ defaultPrevented: false }))
const listeners: Record<string, () => void> = {}
jest.mock("@react-navigation/bottom-tabs", () => ({
  createBottomTabNavigator: () => ({ Navigator: () => null, Screen: () => null }),
}))
jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({ navigate: mockNavigate }) }))
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}))
jest.mock("@/theme/context", () => ({ useAppTheme: () => ({ theme: { isDark: false } }) }))
jest.mock("@/components/Text", () => ({
  Text: ({ text }: { text: string }) => {
    const { Text } = require("react-native")
    return <Text>{text}</Text>
  },
}))
jest.mock("@/screens/DashboardScreen", () => ({ DashboardScreen: () => null }))
jest.mock("@/screens/HerdListScreen", () => ({ HerdListScreen: () => null }))
jest.mock("@/screens/ChuteScreen", () => ({ ChuteScreen: () => null }))
jest.mock("@/screens/PasturesScreen", () => ({ PasturesScreen: () => null }))
jest.mock("@/screens/CalendarScreen", () => ({ CalendarScreen: () => null }))
jest.mock("@/screens/BreedingScreen", () => ({ BreedingScreen: () => null }))
const names = ["Dashboard", "HerdList", "Chute", "Pastures", "Calendar", "Breeding"]
function bar(active = "Dashboard") {
  return render(
    <BentoTabBar
      {...({
        state: { index: names.indexOf(active), routes: names.map((name) => ({ key: name, name })) },
        navigation: { navigate: mockNavigate, emit: mockEmit },
        descriptors: {},
        insets: { top: 0, bottom: 34, left: 0, right: 0 },
      } as any)}
    />,
  )
}
beforeEach(() => {
  require("react-native").Image = "Image"
  jest.clearAllMocks()
  mockEmit.mockReturnValue({ defaultPrevented: false })
  jest.spyOn(Keyboard, "isVisible").mockReturnValue(false)
  jest.spyOn(Keyboard, "addListener").mockImplementation((name, callback) => {
    listeners[name] = callback as () => void
    return { remove: jest.fn() }
  })
})
afterEach(() => {
  jest.restoreAllMocks()
})
it("keeps five primary destinations while retaining the Plan routes", () => {
  const ui = bar()
  expect(ui.getAllByRole("tab")).toHaveLength(5)
  fireEvent.press(ui.getByRole("tab", { name: "Plan" }))
  expect(mockNavigate).toHaveBeenCalledWith("Calendar", undefined)
})
it("shows Plan as selected while viewing breeding", () => {
  const ui = bar("Breeding")
  expect(ui.getByRole("tab", { name: "Plan" }).props.accessibilityState.selected).toBe(true)
  fireEvent.press(ui.getByRole("tab", { name: "Plan" }))
  expect(mockNavigate).not.toHaveBeenCalled()
})
it("respects a prevented tab navigation event", () => {
  mockEmit.mockReturnValue({ defaultPrevented: true })
  const ui = bar()
  fireEvent.press(ui.getByRole("tab", { name: "Herd" }))
  expect(mockNavigate).not.toHaveBeenCalled()
})
it("hides navigation for the keyboard and restores it afterwards", () => {
  const ui = bar()
  act(() => listeners.keyboardDidShow())
  expect(ui.queryAllByRole("tab")).toHaveLength(0)
  act(() => listeners.keyboardDidHide())
  expect(ui.getAllByRole("tab")).toHaveLength(5)
})
it("keeps calendar and breeding reachable through the Plan switcher", () => {
  const ui = render(<PlanSwitcher selected="Calendar" />)
  fireEvent.press(ui.getByRole("tab", { name: "Breeding" }))
  expect(mockNavigate).toHaveBeenCalledWith("Breeding")
  fireEvent.press(ui.getByRole("tab", { name: "Calendar" }))
  expect(mockNavigate).toHaveBeenCalledWith("Calendar")
})
