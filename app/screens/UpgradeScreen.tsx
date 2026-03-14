import { FC } from "react"
import { Pressable, View, ViewStyle, TextStyle, ScrollView, Linking } from "react-native"

import { Screen, Text, Button } from "@/components"
import { CheckBadge } from "@/components/icons"
import { useAppTheme } from "@/theme/context"
import { useSubscription } from "@/context/SubscriptionContext"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

// Pricing tiers matching landing page
const PRICING_TIERS = [
  {
    id: "starter",
    name: "Starter",
    price: "R0",
    period: "/month",
    description: "Perfect for small operations",
    features: [
      "Up to 100 animals",
      "1 pasture",
      "Camera tag scanning",
      "Basic health records",
      "Weight tracking",
      "Offline mode",
      "1 user",
    ],
    isCurrent: false,
    isFree: true,
    buttonText: "Free Forever",
  },
  {
    id: "farm",
    name: "Farm",
    price: "R249,99",
    period: "/month",
    description: "Most popular for growing farms",
    features: [
      "Up to 1,000 animals",
      "Up to 15 pastures",
      "Camera tag scanning",
      "Full health tracking",
      "Breeding records",
      "Reports & CSV export",
      "Up to 5 users",
      "Photo attachments",
      "Priority support",
    ],
    isFeatured: true,
    buttonText: "Upgrade to Farm",
  },
  {
    id: "commercial",
    name: "Commercial",
    price: "R999",
    period: "/month",
    description: "For large commercial operations",
    features: [
      "Unlimited animals",
      "Unlimited pastures",
      "Camera tag scanning",
      "RFID handheld scanner*",
      "Advanced analytics",
      "Treatment protocols",
      "Unlimited users",
      "Custom reports",
      "API access",
      "Dedicated support",
    ],
    buttonText: "Contact Sales",
    isEnterprise: true,
  },
]

export const UpgradeScreen: FC<AppStackScreenProps<"Upgrade">> = ({ navigation }) => {
  const { themed, theme: { colors } } = useAppTheme()
  const { plan } = useSubscription()

  const handleUpgrade = (tierId: string) => {
    if (tierId === "farm" || tierId === "commercial") {
      // Navigate to paywall screen for RevenueCat purchase flow
      navigation.navigate("Paywall")
    }
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top", "bottom"]}>
      {/* Header */}
      <View style={themed($header)}>
        <Button text="Close" preset="default" onPress={() => navigation.goBack()} />
      </View>

      {/* Title */}
      <View style={themed($titleSection)}>
        <Text text="Choose Your Plan" preset="heading" style={themed($title)} />
        <Text
          text="Start free, upgrade when you need to. No contracts, cancel anytime."
          style={themed($subtitle)}
        />
      </View>

      {/* Pricing Cards */}
      <ScrollView style={themed($scrollView)} showsVerticalScrollIndicator={false}>
        <View style={themed($pricingGrid)}>
          {PRICING_TIERS.map((tier) => {
            const isCurrentPlan = tier.id === plan

            return (
              <View
                key={tier.id}
                style={[
                  themed($pricingCard),
                  tier.isFeatured && themed($featuredCard),
                  isCurrentPlan && themed($currentCard),
                ]}
              >
                {tier.isFeatured && (
                  <View style={themed($featuredBadge)}>
                    <Text text="MOST POPULAR" style={themed($featuredBadgeText)} />
                  </View>
                )}

                {isCurrentPlan && (
                  <View style={themed($currentBadge)}>
                    <Text text="CURRENT PLAN" style={themed($currentBadgeText)} />
                  </View>
                )}

                <Text text={tier.name} preset="subheading" style={themed($planName)} />
                <Text text={tier.description} size="xs" style={themed($planDescription)} />

                <View style={themed($priceSection)}>
                  <Text text={tier.price} style={themed($price)} />
                  <Text text={tier.period} style={themed($period)} />
                </View>

                {/* Features */}
                <View style={themed($featuresContainer)}>
                  {tier.features.map((feature, index) => (
                    <View key={index} style={themed($featureRow)}>
                      <CheckBadge size={18} color={tier.isFeatured ? colors.tint : colors.palette.neutral600} />
                      <Text text={feature} style={themed($featureText)} />
                    </View>
                  ))}
                </View>

                {/* Action Button */}
                <Button
                  text={isCurrentPlan ? "Current Plan" : tier.buttonText}
                  preset={tier.isFeatured && !isCurrentPlan ? "reversed" : "default"}
                  style={themed($actionButton)}
                  onPress={() => handleUpgrade(tier.id)}
                  disabled={isCurrentPlan || tier.isFree}
                />
              </View>
            )
          })}
        </View>

        {/* RFID Hardware Note */}
        <View style={themed($noteSection)}>
          <Text
            text="* RFID Hardware: Commercial plan customers can purchase RFID handheld scanners. Recommended devices start at R8,500 (Bluetooth handheld) up to R18,500 (professional with display)."
            size="xs"
            style={themed($noteText)}
          />
          <Text
            text="Contact info@herdtrackr.co.za for device recommendations and bulk pricing."
            size="xs"
            style={themed($noteText)}
          />
        </View>

        {/* Fine Print */}
        <View style={themed($finePrintSection)}>
          <Text
            text="All plans include AI camera tag scanning, offline mode, cloud sync, and free updates. Prices in South African Rands (ZAR). Cancel anytime."
            size="xxs"
            style={themed($finePrint)}
          />
        </View>
      </ScrollView>
    </Screen>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.md,
  marginBottom: spacing.md,
})

const $titleSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
  textAlign: "center",
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  fontSize: 15,
  lineHeight: 22,
})

const $scrollView: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $pricingGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
  paddingBottom: spacing.xl,
})

const $pricingCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  borderWidth: 2,
  borderColor: colors.palette.neutral200,
})

const $featuredCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.tint,
  borderWidth: 3,
})

const $currentCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.accent500,
  borderWidth: 2,
})

const $featuredBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 6,
  alignSelf: "flex-start",
  marginBottom: spacing.sm,
})

const $featuredBadgeText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontSize: 11,
  fontWeight: "800",
  letterSpacing: 0.5,
})

const $currentBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.accent500,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 6,
  alignSelf: "flex-start",
  marginBottom: spacing.sm,
})

const $currentBadgeText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontSize: 11,
  fontWeight: "800",
  letterSpacing: 0.5,
})

const $planName: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  marginBottom: spacing.xxs,
})

const $planDescription: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.md,
})

const $priceSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "baseline",
  marginBottom: spacing.md,
  flexWrap: "wrap",
  maxWidth: "100%",
})

const $price: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 28,
  fontWeight: "800",
  color: colors.text,
  flexShrink: 1,
  maxWidth: "100%",
  lineHeight: 36,
})

const $period: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.textDim,
  marginLeft: 4,
  flexShrink: 0,
})

const $featuresContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
  marginBottom: spacing.lg,
})

const $featureRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "flex-start",
  gap: 10,
})

const $featureText: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  fontSize: 14,
  color: colors.text,
  lineHeight: 20,
})

const $actionButton: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})

const $noteSection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.lg,
  gap: spacing.sm,
})

const $noteText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  lineHeight: 18,
})

const $finePrintSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
})

const $finePrint: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  lineHeight: 16,
})
