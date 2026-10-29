const palette = {
  neutral100: "#FFFFFF",
  neutral200: "#F3F4EE",
  neutral300: "#E1E7DA",
  neutral400: "#B9C1B0",
  neutral500: "#8B9785",
  neutral600: "#64715F",
  neutral700: "#354332",
  neutral800: "#1D2B22",
  neutral900: "#000000",

  // Forest green for primary actions; sage for supporting surfaces
  primary100: "#EDF2E4",
  primary200: "#D5E4B7",
  primary300: "#B6C695",
  primary400: "#95AB65",
  primary500: "#3D643B",
  primary600: "#274A2B",

  // Warm brown — secondary (leather/earth)
  secondary100: "#EDE5DA",
  secondary200: "#D6C8B5",
  secondary300: "#B8A48A",
  secondary400: "#96805F",
  secondary500: "#7A6644",

  // Golden amber — accent (hay/sunlight)
  accent100: "#FFF3DB",
  accent200: "#FFE5B0",
  accent300: "#FFD780",
  accent400: "#FFC94D",
  accent500: "#F5AD1C",

  angry100: "#FCDDD3",
  angry500: "#D64220",

  overlay20: "rgba(30, 26, 22, 0.2)",
  overlay50: "rgba(30, 26, 22, 0.5)",
} as const

export const colors = {
  /**
   * The palette is available to use, but prefer using the name.
   * This is only included for rare, one-off cases. Try to use
   * semantic names as much as possible.
   */
  palette,
  /**
   * A helper for making something see-thru.
   */
  transparent: "rgba(0, 0, 0, 0)",
  /**
   * The default text color in many components.
   */
  text: palette.neutral800,
  /**
   * Secondary text information.
   */
  textDim: palette.neutral600,
  /**
   * The default color of the screen background.
   */
  background: palette.neutral200,
  /**
   * The default border color.
   */
  border: palette.neutral400,
  /**
   * The main tinting color.
   */
  tint: palette.primary500,
  /**
   * The inactive tinting color.
   */
  tintInactive: palette.neutral300,
  /**
   * A subtle color used for lines.
   */
  separator: palette.neutral300,
  /**
   * Error messages.
   */
  error: palette.angry500,
  /**
   * Error Background.
   */
  errorBackground: palette.angry100,
  /**
   * Animal status colors.
   */
  statusActive: palette.primary500,
  statusSold: palette.secondary400,
  statusDeceased: palette.angry500,
  statusTransferred: palette.accent500,
} as const

export const STATUS_COLORS: Record<string, string> = {
  active: colors.statusActive,
  sold: colors.statusSold,
  deceased: colors.statusDeceased,
  transferred: colors.statusTransferred,
}
