// TODO: write documentation about fonts and typography along with guides on how to add custom fonts in own
// markdown file and add links from here

import { Platform } from "react-native"
import {
  Manrope_300Light as manropeLight,
  Manrope_400Regular as manropeRegular,
  Manrope_500Medium as manropeMedium,
  Manrope_600SemiBold as manropeSemiBold,
  Manrope_700Bold as manropeBold,
} from "@expo-google-fonts/manrope"

export const customFontsToLoad = {
  manropeLight,
  manropeRegular,
  manropeMedium,
  manropeSemiBold,
  manropeBold,
}

const fonts = {
  manrope: {
    // Cross-platform Google font.
    light: "manropeLight",
    normal: "manropeRegular",
    medium: "manropeMedium",
    // Titles use semiBold; body copy uses normal (Manrope Regular).
    semiBold: "manropeSemiBold",
    bold: "manropeBold",
  },
  helveticaNeue: {
    // iOS only font.
    thin: "HelveticaNeue-Thin",
    light: "HelveticaNeue-Light",
    normal: "Helvetica Neue",
    medium: "HelveticaNeue-Medium",
  },
  courier: {
    // iOS only font.
    normal: "Courier",
  },
  sansSerif: {
    // Android only font.
    thin: "sans-serif-thin",
    light: "sans-serif-light",
    normal: "sans-serif",
    medium: "sans-serif-medium",
  },
  monospace: {
    // Android only font.
    normal: "monospace",
  },
}

export const typography = {
  /**
   * The fonts are available to use, but prefer using the semantic name.
   */
  fonts,
  /**
   * The primary font. Used in most places.
   */
  primary: fonts.manrope,
  /**
   * An alternate font used for perhaps titles and stuff.
   */
  secondary: Platform.select({ ios: fonts.helveticaNeue, android: fonts.sansSerif }),
  /**
   * Lets get fancy with a monospace font!
   */
  code: Platform.select({ ios: fonts.courier, android: fonts.monospace }),
}
