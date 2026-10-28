import { useState } from "react"
import { fireEvent, render } from "@testing-library/react-native"

import { ConditionScoreInput } from "./ConditionScoreInput"
import { MeasurementInput } from "./MeasurementInput"
import { VaccinationHistoryInput } from "./VaccinationHistoryInput"

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ bottom: 0 }) }))
jest.mock("@/theme/context", () => ({
  useAppTheme: () => ({
    theme: {
      colors: {
        border: "gray",
        background: "white",
        tint: "green",
        palette: { neutral100: "white" },
      },
    },
  }),
}))
jest.mock("./Text", () => ({
  Text: ({ text }: { text: string }) => {
    const { Text } = require("react-native")
    return <Text>{text}</Text>
  },
}))
jest.mock("./Button", () => ({
  Button: ({ text, onPress }: { text: string; onPress: () => void }) => {
    const { Pressable, Text } = require("react-native")
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={text} onPress={onPress}>
        <Text>{text}</Text>
      </Pressable>
    )
  },
}))

function mount(value = "", counter = false) {
  const change = jest.fn()
  const ui = render(
    <MeasurementInput
      label="Weight"
      value={value}
      onChangeText={change}
      unit="kg"
      integer={counter}
      counter={counter}
    />,
  )
  fireEvent.press(ui.getByRole("button", { name: /^Weight:/ }))
  const press = (name: string) => fireEvent.press(ui.getByRole("button", { name }))
  return { ...ui, press, change }
}

describe("measurement keypad", () => {
  it("enters a new weight and saves a decimal only on Done", () => {
    const { press, change } = mount()
    for (const key of ["3", "2", ".", "5"]) press(key)
    expect(change).not.toHaveBeenCalled()
    press("common.done")
    expect(change).toHaveBeenCalledWith("32.5")
  })
  it("corrects 450 to 455 using visible digit editing", () => {
    const { press, change } = mount("450")
    press("measurementInput.backspace")
    press("5")
    press("common.done")
    expect(change).toHaveBeenCalledWith("455")
  })
  it("appends digits instead of silently replacing an existing value", () => {
    const { press, change } = mount("450")
    press("5")
    press("common.done")
    expect(change).toHaveBeenCalledWith("4505")
  })
  it("cancels edits without changing the field", () => {
    const { press, change } = mount("450")
    press("9")
    press("common.cancel")
    expect(change).not.toHaveBeenCalled()
  })
  it("distinguishes a checked zero from an unrecorded count", () => {
    const zero = mount("", true)
    zero.press("0")
    zero.press("common.done")
    expect(zero.change).toHaveBeenCalledWith("0")
    zero.unmount()
    const blank = mount("12", true)
    blank.press("measurementInput.clear")
    blank.press("common.done")
    expect(blank.change).toHaveBeenCalledWith("")
  })
  it("counts up and down without going negative", () => {
    const { press, change } = mount("", true)
    press("measurementInput.addFive")
    press("measurementInput.addOne")
    for (let i = 0; i < 8; i++) press("measurementInput.subtractOne")
    press("common.done")
    expect(change).toHaveBeenCalledWith("0")
  })
  it("supports a leading decimal after clearing and rejects a second decimal", () => {
    const { press, change } = mount("450")
    for (const key of ["measurementInput.clear", ".", "5", ".", "2", "9"]) press(key)
    press("common.done")
    expect(change).toHaveBeenCalledWith("0.52")
  })
  it("backspaces and bounds the whole-number count", () => {
    const { press, change } = mount("99999999", true)
    press("measurementInput.addFive")
    press("measurementInput.backspace")
    press("1")
    press("2")
    press("common.done")
    expect(change).toHaveBeenCalledWith("99999991")
  })
})

it("selects and clears condition scores without opening a keyboard", () => {
  function Form() {
    const [value, setValue] = useState("")
    return <ConditionScoreInput label="Condition" value={value} onChangeText={setValue} />
  }
  const ui = render(<Form />)
  fireEvent.press(ui.getByRole("button", { name: /^Condition: 6,/ }))
  expect(ui.getByRole("button", { name: /^Condition: 6,/ }).props.accessibilityState.selected).toBe(
    true,
  )
  fireEvent.press(ui.getByRole("button", { name: "measurementInput.clear" }))
  expect(ui.getByRole("button", { name: /^Condition: 6,/ }).props.accessibilityState.selected).toBe(
    false,
  )
})

it("keeps Unknown distinct until the farmer selects a history", () => {
  function Form() {
    const [history, setHistory] = useState<"unknown" | "current" | "needs_review">("unknown")
    return <VaccinationHistoryInput value={history} onChange={setHistory} />
  }
  const ui = render(<Form />)
  expect(
    ui.getByRole("radio", { name: "uxFixes.historyUnknown" }).props.accessibilityState.checked,
  ).toBe(true)
  fireEvent.press(ui.getByRole("radio", { name: "uxFixes.historyCurrent" }))
  expect(
    ui.getByRole("radio", { name: "uxFixes.historyCurrent" }).props.accessibilityState.checked,
  ).toBe(true)
  expect(
    ui.getByRole("radio", { name: "uxFixes.historyUnknown" }).props.accessibilityState.checked,
  ).toBe(false)
})
it("labels a legacy choice as unconfirmed and holds it while saving", () => {
  const onChange = jest.fn()
  const ui = render(<VaccinationHistoryInput value="current" onChange={onChange} legacy disabled />)
  expect(ui.getByText("uxFixes.historyLegacyHelp")).toBeTruthy()
  fireEvent.press(ui.getByRole("radio", { name: "uxFixes.historyUnknown" }))
  expect(onChange).not.toHaveBeenCalled()
})
