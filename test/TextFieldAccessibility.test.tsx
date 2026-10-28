import { fireEvent, render } from "@testing-library/react-native"

import { TextField } from "../app/components/TextField"

const mockTheme = {
  colors: {
    text: "black",
    textDim: "gray",
    transparent: "transparent",
    border: "gray",
    error: "red",
    palette: {},
  },
  spacing: { xs: 4, sm: 8, md: 12 },
  typography: { primary: { normal: "System" } },
}
jest.mock("@/theme/context", () => ({
  useAppTheme: () => ({
    theme: mockTheme,
    themed: (style: any): any =>
      Array.isArray(style)
        ? style.map((item) => (typeof item === "function" ? item(mockTheme) : item))
        : typeof style === "function"
          ? style(mockTheme)
          : style,
  }),
}))
jest.mock("../app/components/Text", () => ({
  Text: ({ text }: { text?: string }) => {
    const { Text } = require("react-native")
    return <Text>{text}</Text>
  },
}))

it("exposes an editable input by its visible label and accepts typing", () => {
  const onChange = jest.fn()
  const view = render(<TextField label="Animal name" value="" onChangeText={onChange} />)
  fireEvent.changeText(view.getByLabelText("Animal name"), "Daisy")
  expect(onChange).toHaveBeenCalledWith("Daisy")
})

it("preserves a caller's specific accessibility label and disabled state", () => {
  const view = render(
    <TextField label="Tag" accessibilityLabel="Animal RFID tag" value="123" status="disabled" />,
  )
  const input = view.getByLabelText("Animal RFID tag")
  expect(input.props.value).toBe("123")
  expect(input.props.editable).toBe(false)
})

it("announces a placeholder when a field has no separate label", () => {
  const view = render(<TextField placeholder="Enter tag" value="" />)
  expect(view.getByLabelText("Enter tag").props.placeholder).toBe("Enter tag")
})
