import { FC, useState } from "react"
import { ActivityIndicator, Pressable, View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, Button } from "@/components"
import { CheckBadge, LockBadge } from "@/components/icons"
import { useAppTheme } from "@/theme/context"
import { useSubscription } from "@/context/SubscriptionContext"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

const PRO_PERKS = [
  "Vaccine scheduling & withdrawal tracking",
  "Pasture rotation management",
  "Automated deadline reminders",
  "Advanced analytics & exports",
  "Priority support",
]

export const UpgradeScreen: FC<AppStackScreenProps<"Upgrade">> = ({ navigation }) => {
  const { themed, theme: { colors } } = useAppTheme()
  const {
    isLoading,
    packages,
    purchaseProMonthly,
    purchaseProAnnual,
    restorePurchases,
    upgradeToPro,
  } = useSubscription()

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")

  // Try to get real prices from RevenueCat packages
  const monthlyPkg = packages.find(
    (p) => p.packageType === "MONTHLY" || p.identifier === "$rc_monthly",
  )
  const annualPkg = packages.find(
    (p) => p.packageType === "ANNUAL" || p.identifier === "$rc_annual",
  )

  const monthlyPrice = monthlyPkg?.product.priceString ?? "$9.99"
  const annualPrice = annualPkg?.product.priceString ?? "$95.88"
  const annualMonthly = annualPkg
    ? `${(annualPkg.product.price / 12).toFixed(2)}`
    : "7.99"

  const handlePurchase = async () => {
    if (billingCycle === "annual") {
      if (annualPkg) {
        await purchaseProAnnual()
      } else {
        upgradeToPro() // fallback for dev
      }
    } else {
      if (monthlyPkg) {
        await purchaseProMonthly()
      } else {
        upgradeToPro() // fallback for dev
      }
    }
    navigation.goBack()
  }

  const handleRestore = async () => {
    await restorePurchases()
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top", "bottom"]}>
      {/* Close */}
      <View style={themed($header)}>
        <Button text="Close" preset="default" onPress={() => navigation.goBack()} />
      </View>

      {/* Hero */}
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

      {/* Perks list */}
      <View style={themed($perksContainer)}>
        {PRO_PERKS.map((perk, i) => (
          <View key={i} style={themed($perkRow)}>
            <CheckBadge size={22} color={colors.tint} variant="filled" />
            <Text text={perk} style={themed($perkText)} />
          </View>
        ))}
      </View>

      {/* Billing toggle */}
      <View style={themed($billingToggle)}>
        <Pressable
          onPress={() => setBillingCycle("monthly")}
          style={[themed($billingOption), billingCycle === "monthly" && themed($billingActive)]}
        >
          <Text
            text="Monthly"
            size="sm"
            style={billingCycle === "monthly" ? themed($billingTextActive) : themed($billingText)}
          />
          <Text text={monthlyPrice} size="xs" style={billingCycle === "monthly" ? themed($billingPriceActive) : themed($billingPrice)} />
        </Pressable>
        <Pressable
          onPress={() => setBillingCycle("annual")}
          style={[themed($billingOption), billingCycle === "annual" && themed($billingActive)]}
        >
          <View style={themed($annualHeader)}>
            <Text
              text="Annual"
              size="sm"
              style={billingCycle === "annual" ? themed($billingTextActive) : themed($billingText)}
            />
            <View style={themed($saveBadge)}>
              <Text text="SAVE 20%" size="xxs" style={themed($saveBadgeText)} />
            </View>
          </View>
          <Text
            text={`$${annualMonthly}/mo`}
            size="xs"
            style={billingCycle === "annual" ? themed($billingPriceActive) : themed($billingPrice)}
          />
          <Text text={`Billed ${annualPrice}/year`} size="xxs" style={themed($billedAnnually)} />
        </Pressable>
      </View>

      {/* Purchase button */}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.tint} style={{ marginVertical: 20 }} />
      ) : (
        <Button
          text={billingCycle === "annual" ? `Subscribe — $${annualMonthly}/mo` : `Subscribe — ${monthlyPrice}/mo`}
          preset="reversed"
          style={themed($purchaseBtn)}
          onPress={handlePurchase}
        />
      )}

      {/* Fine print */}
      <Text
        text={
          billingCycle === "annual"
            ? "Annual subscription. Cancel anytime. Payment charged through your App Store or Google Play account."
            : "Monthly subscription. Cancel anytime. Payment charged through your App Store or Google Play account."
        }
        size="xxs"
        style={themed($finePrint)}
      />

      {/* Restore */}
      <Pressable onPress={handleRestore} style={themed($restoreBtn)}>
        <Text text="Restore Purchases" size="sm" style={themed($restoreText)} />
      </Pressable>
    </Screen>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "flex-start",
  marginTop: spacing.md,
  marginBottom: spacing.md,
})

const $hero: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginBottom: spacing.lg,
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
  maxWidth: 300,
})

const $perksContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  gap: spacing.md,
  marginBottom: spacing.lg,
})

const $perkRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
})

const $perkText: ThemedStyle<TextStyle> = () => ({
  flex: 1,
  fontSize: 15,
})

// Billing toggle
const $billingToggle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginBottom: spacing.lg,
})

const $billingOption: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 14,
  padding: spacing.md,
  alignItems: "center",
  borderWidth: 2,
  borderColor: "transparent",
})

const $billingActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.tint,
  backgroundColor: colors.palette.primary100,
})

const $annualHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
})

const $billingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $billingTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $billingPrice: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "700",
  fontSize: 18,
  marginTop: 4,
})

const $billingPriceActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "700",
  fontSize: 18,
  marginTop: 4,
})

const $billedAnnually: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  marginTop: 2,
})

const $saveBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.accent500,
  borderRadius: 4,
  paddingHorizontal: 5,
  paddingVertical: 1,
})

const $saveBadgeText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "700",
  letterSpacing: 0.3,
})

// Purchase
const $purchaseBtn: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $finePrint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.lg,
  lineHeight: 16,
})

const $restoreBtn: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignSelf: "center",
  paddingVertical: spacing.sm,
})

const $restoreText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  textDecorationLine: "underline",
})
