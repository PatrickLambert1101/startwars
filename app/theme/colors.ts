const palette = {
  neutral100: "#FFFFFF",
  neutral200: "#F5F3F0",
  neutral300: "#DDD8D0",
  neutral400: "#B5AFA6",
  neutral500: "#8C857C",
  neutral600: "#5C564F",
  neutral700: "#3D3832",
  neutral800: "#1E1A16",
  neutral900: "#000000",

  // Earthy green — primary brand color (pasture/ranch)
  primary100: "#E2EDDF",
  primary200: "#C5DBBF",
  primary300: "#9DC393",
  primary400: "#6FA862",
  primary500: "#4A8C3F",
  primary600: "#36712D",

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
} as const
