import { fireEvent, render } from "@testing-library/react-native"

import { BentoAnimalProfile } from "../app/components/BentoAnimalProfile"

let mockDark = false
jest.mock("@/theme/context", () => ({ useAppTheme: () => ({ theme: { isDark: mockDark } }) }))
jest.mock("@expo/vector-icons", () => ({ MaterialCommunityIcons: () => null }))
jest.mock("@/components/Text", () => ({
  Text: ({ text }: { text: string }) => {
    const { Text } = require("react-native")
    return <Text>{text}</Text>
  },
}))
it.each([false, true])("preserves the cow identity and record actions in dark theme %s", (dark) => {
  mockDark = dark
  const onWeigh = jest.fn(),
    onHealth = jest.fn(),
    onWeightHistory = jest.fn()
  const ui = render(
    <BentoAnimalProfile
      name="Daisy"
      eyebrow="TAG 1801"
      subtitle="Nguni · Cow"
      status="Active"
      statusColor="green"
      weight="450.5 kg"
      age="3 years"
      offspring="2"
      onWeigh={onWeigh}
      onHealth={onHealth}
      onWeightHistory={onWeightHistory}
    />,
  )
  expect(ui.getByText("Daisy")).toBeTruthy()
  expect(ui.getByText("TAG 1801")).toBeTruthy()
  fireEvent.press(ui.getByRole("button", { name: "Record weight" }))
  fireEvent.press(ui.getByRole("button", { name: "Add health record" }))
  fireEvent.press(ui.getByRole("button", { name: "Latest weight: 450.5 kg. View weight history" }))
  expect(onWeigh).toHaveBeenCalledTimes(1)
  expect(onHealth).toHaveBeenCalledTimes(1)
  expect(onWeightHistory).toHaveBeenCalledTimes(1)
})
