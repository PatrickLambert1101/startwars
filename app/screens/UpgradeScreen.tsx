import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import { useSubscription } from "@/context/SubscriptionContext"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

const PRO_PERKS = [
  "Vaccine scheduling & withdrawal tracking",
  "Pasture rotation management",
  "Automated reminders",
  "Priority support",
]

export const UpgradeScreen: FC<AppStackScreenProps<"Upgrade">> = ({ navigation }) => {
  const { themed, theme: { colors } } = useAppTheme()
  const { upgradeToPro, restorePurchases } = useSubscription()

  const handleUpgrade = () => {
    upgradeToPro()
    navigation.goBack()
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top", "bottom"]}>
      <View style={themed($header)}>
        <Button text="Close" preset="default" onPress={() => navigation.goBack()} />
      </View>

      <View style={themed($hero)}>
        <View style={themed($proBadge)}>
          <Text text="PRO" style={themed($proBadgeText)} />
        </View>
        <Text text="Unlock Full Power" preset="heading" style={themed($title)} />
        <Text
          text="Get vaccine protocols, pasture rotation, and more with HerdTrackr Pro."
          style={themed($subtitle)}
        />
      </View>

      <View style={themed($perksContainer)}>
        {PRO_PERKS.map((perk, i) => (
          <View key={i} style={themed($perkRow)}>
            <View style={themed($checkCircle)}>
              <Text text="✓" style={themed($checkText)} />
            </View>
            <Text text={perk} style={themed($perkText)} />
          </View>
        ))}
      </View>

      <View style={themed($priceSection)}>
        <Text text="$9.99" preset="heading" style={themed($price)} />
        <Text text="/month" size="sm" style={themed($pricePeriod)} />
      </View>

      <Button
        text="Upgrade to Pro"
        preset="reversed"
        style={themed($upgradeButton)}
        onPress={handleUpgrade}
      />

      <Button
        text="Restore Purchases"
        preset="default"
        style={themed($restoreButton)}
        textStyle={themed($restoreText)}
        onPress={restorePurchases}
      />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "flex-start",
  marginTop: spacing.md,
  marginBottom: spacing.lg,
})

const $hero: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginBottom: spacing.xl,
})

const $proBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.accent500,
  borderRadius: 8,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xxs,
  marginBottom: spacing.md,
})

const $proBadgeText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "800",
  fontSize: 18,
  letterSpacing: 2,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
  textAlign: "center",
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  lineHeight: 22,
})

const $perksContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  gap: spacing.md,
  marginBottom: spacing.xl,
})

const $perkRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
})

const $checkCircle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: colors.tint,
  alignItems: "center",
  justifyContent: "center",
})

const $checkText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "700",
  fontSize: 14,
})

const $perkText: ThemedStyle<TextStyle> = () => ({
  flex: 1,
  fontSize: 15,
})

const $priceSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "baseline",
  justifyContent: "center",
  marginBottom: spacing.lg,
})

const $price: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 40,
})

const $pricePeriod: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  marginLeft: 4,
})

const $upgradeButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $restoreButton: ThemedStyle<ViewStyle> = () => ({
  alignSelf: "center",
})

const $restoreText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 13,
})
