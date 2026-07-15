const palette = {
  neutral900: "#F5F3F0",
  neutral800: "#E8E4DF",
  neutral700: "#C5BEB5",
  neutral600: "#9C958B",
  neutral500: "#7A736A",
  neutral400: "#524C45",
  neutral300: "#3A3530",
  neutral200: "#252220",
  neutral100: "#1A1816",

  // Reversed ramp (lightest at 600), anchored on the logo green (#739134)
  primary600: "#EEF2E7",
  primary500: "#B6C695",
  primary400: "#95AB65",
  primary300: "#739134",
  primary200: "#576E28",
  primary100: "#374619",

  secondary500: "#EDE5DA",
  secondary400: "#D6C8B5",
  secondary300: "#B8A48A",
  secondary200: "#96805F",
  secondary100: "#7A6644",

  accent500: "#FFF3DB",
  accent400: "#FFE5B0",
  accent300: "#FFD780",
  accent200: "#FFC94D",
  accent100: "#F5AD1C",

  angry100: "#5C2018",
  angry500: "#FF5C38",

  overlay20: "rgba(245, 243, 240, 0.2)",
  overlay50: "rgba(245, 243, 240, 0.5)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",
  text: palette.neutral800,
  textDim: palette.neutral600,
  background: palette.neutral200,
  border: palette.neutral400,
  tint: palette.primary500,
  tintInactive: palette.neutral300,
  separator: palette.neutral300,
  error: palette.angry500,
  errorBackground: palette.angry100,
} as const
