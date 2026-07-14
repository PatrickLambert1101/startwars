import { FC } from "react"
import { View, Pressable, ViewStyle, TextStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { Text } from "./Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface AppHeaderProps {
  title?: string
  showSettings?: boolean
  showSync?: boolean
}

export const AppHeader: FC<AppHeaderProps> = ({
  title = "HerdTrackr",
  showSettings = true,
  showSync = false,
}) => {
  const navigation = useNavigation<any>()
  const { themed, theme: { colors } } = useAppTheme()

  return (
    <View style={themed($container)}>
      {/* Left: App name or screen title */}
      <Text preset="heading" text={title} style={themed($title)} />

      {/* Right: Icons */}
      <View style={themed($rightSection)}>
        {/* Sync indicator - future enhancement */}
        {showSync && (
          <View style={themed($iconButton)}>
            <MaterialCommunityIcons
              name="sync"
              size={22}
              color={colors.textDim}
            />
          </View>
        )}

        {/* Settings button */}
        {showSettings && (
          <Pressable
            onPress={() => navigation.navigate("Settings")}
            style={themed($iconButton)}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={24}
              color={colors.text}
            />
          </Pressable>
        )}
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  backgroundColor: colors.background,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
  shadowColor: "#000",
  shadowOpacity: 0.04,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
})

const $title: ThemedStyle<TextStyle> = () => ({
  flex: 1,
})

const $rightSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $iconButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
  borderRadius: 20,
  alignItems: "center",
  justifyContent: "center",
})
