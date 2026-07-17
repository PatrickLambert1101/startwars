import { Image, ImageStyle, StyleProp } from "react-native"

/**
 * Branded hex-framed PNG icons (app/assets/icons/herdtrackr-hex).
 *
 * These are used only for large, decorative, brand-forward spots — livestock
 * type selection, the farm/success/dev marks — i.e. the places that previously
 * showed OS emoji. Inline UI chrome (chevrons, checks, tags, needles…) stays on
 * MaterialCommunityIcons, which recolours at runtime; these PNGs bake in their
 * own navy + green and cannot be tinted, so they must not be used where the
 * colour changes with state (active tabs, urgency, etc.).
 *
 * require() paths must be static string literals for the Metro bundler, hence
 * the explicit map rather than a computed path.
 */
const ICONS = {
  "cattle": require("../assets/icons/herdtrackr-hex/cattle.png"),
  "buffalo": require("../assets/icons/herdtrackr-hex/buffalo.png"),
  "horses": require("../assets/icons/herdtrackr-hex/horses.png"),
  "sheep": require("../assets/icons/herdtrackr-hex/sheep.png"),
  "goats": require("../assets/icons/herdtrackr-hex/goats.png"),
  "game": require("../assets/icons/herdtrackr-hex/game.png"),
  "pigs": require("../assets/icons/herdtrackr-hex/pigs.png"),
  "poultry": require("../assets/icons/herdtrackr-hex/poultry.png"),
  "cow": require("../assets/icons/herdtrackr-hex/cow.png"),
  "food-steak": require("../assets/icons/herdtrackr-hex/food-steak.png"),
  "cup": require("../assets/icons/herdtrackr-hex/cup.png"),
  "grass": require("../assets/icons/herdtrackr-hex/grass.png"),
  "elephant": require("../assets/icons/herdtrackr-hex/elephant.png"),
  "farm-home": require("../assets/icons/herdtrackr-hex/farm-home.png"),
  "success": require("../assets/icons/herdtrackr-hex/success.png"),
  "dev-mode": require("../assets/icons/herdtrackr-hex/dev-mode.png"),
} as const

export type HerdIconName = keyof typeof ICONS

interface HerdIconProps {
  name: HerdIconName
  size?: number
  style?: StyleProp<ImageStyle>
}

export function HerdIcon({ name, size = 40, style }: HerdIconProps) {
  return (
    <Image
      source={ICONS[name]}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  )
}
