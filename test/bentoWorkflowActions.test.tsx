import { fireEvent, render } from "@testing-library/react-native"

import { BentoChuteModes, BentoPastureActions } from "../app/components/BentoWorkflowCards"

let mockDark = false
jest.mock("@/theme/context", () => ({
  useAppTheme: () => ({ theme: { isDark: mockDark } }),
}))
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
jest.mock("@expo/vector-icons", () => ({ MaterialCommunityIcons: () => null }))
jest.mock("@/components/Text", () => ({
  Text: ({ text }: { text: string }) => {
    const { Text } = require("react-native")
    return <Text>{text}</Text>
  },
}))
beforeEach(() => {
  mockDark = false
})
it.each([
  ["weight", "weight"],
  ["protocol", "protocol"],
  ["condition", "condition"],
  ["weightAndTreatment", "weight_and_treatment"],
])("opens the correct recording mode from %s", (key, mode) => {
  const onSelect = jest.fn()
  const ui = render(<BentoChuteModes onSelect={onSelect} />)
  fireEvent.press(
    ui.getByRole("button", {
      name: `chuteScreen.modes.${key}.title. chuteScreen.modes.${key}.description`,
    }),
  )
  expect(onSelect).toHaveBeenCalledWith(mode)
})
it.each([false, true])("keeps every pasture action available with dark theme %s", (dark) => {
  mockDark = dark
  const onMap = jest.fn(),
    onCreate = jest.fn(),
    onImport = jest.fn()
  const ui = render(
    <BentoPastureActions
      createLabel="+ New"
      onMap={onMap}
      onCreate={onCreate}
      onImport={onImport}
    />,
  )
  fireEvent.press(ui.getByRole("button", { name: "View all on map" }))
  fireEvent.press(ui.getByRole("button", { name: "+ New" }))
  fireEvent.press(ui.getByRole("button", { name: "Import pasture map (KML/KMZ)" }))
  expect(onMap).toHaveBeenCalledTimes(1)
  expect(onCreate).toHaveBeenCalledTimes(1)
  expect(onImport).toHaveBeenCalledTimes(1)
})
