import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, Button } from "@/components"
import { PastureIcon } from "@/components/icons"
import { useAppTheme } from "@/theme/context"
import { useSubscription } from "@/context/SubscriptionContext"
import type { ThemedStyle } from "@/theme/types"

export const PasturesScreen: FC<any> = ({ navigation }) => {
  const { themed, theme: { colors } } = useAppTheme()
  const { hasFeature } = useSubscription()

  if (!hasFeature("pastures")) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($lockedContainer)} safeAreaEdges={["top", "bottom"]}>
        <PastureIcon size={64} color={colors.palette.accent500} />
        <Text text="Pasture Rotation" preset="heading" style={themed($lockedTitle)} />
        <Text
          text="Map paddocks, assign herds, and track grazing days to optimise forage and soil health."
          style={themed($lockedDesc)}
        />
        <View style={themed($proBadge)}>
          <Text text="PRO" size="xs" style={themed($proBadgeText)} />
        </View>
        <Button
          text="Upgrade to Pro"
          preset="reversed"
          style={themed($upgradeBtn)}
          onPress={() => navigation.navigate("Upgrade")}
        />
      </Screen>
    )
  }

  // Pro users see the pasture module
  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <Text text="Pastures" preset="heading" style={themed($heading)} />
      <Text text="Pasture rotation management coming soon. Your Pro subscription is active." style={themed($desc)} />
    </Screen>
  )
}

const $lockedContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.xl,
  gap: spacing.md,
})

const $lockedTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $lockedDesc: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  lineHeight: 22,
})

const $proBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.accent500,
  borderRadius: 6,
  paddingHorizontal: 12,
  paddingVertical: 3,
})

const $proBadgeText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "800",
  letterSpacing: 1.5,
})

const $upgradeBtn: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minWidth: 200,
  marginTop: spacing.sm,
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
  marginBottom: spacing.md,
})

const $desc: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  lineHeight: 22,
})
