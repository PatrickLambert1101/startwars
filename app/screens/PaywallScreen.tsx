import React, { useState } from "react"
import { View, ViewStyle, Alert, ScrollView, Pressable, TextStyle } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Screen, Button, Text } from "@/components"
import { CheckBadge } from "@/components/icons"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useSubscription } from "@/context/SubscriptionContext"

interface PaywallScreenProps extends AppStackScreenProps<"Paywall"> {}

// Define our pricing tiers - monthly only
const PRICING_TIERS = [
  {
    id: "monthly",
    rcIdentifier: "farm_monthly", // RevenueCat product identifier
    name: "Farm Plan",
    price: "R249,99",
    period: "/month",
    description: "Perfect for growing farms",
    features: [
      "Up to 1,000 animals",
      "Up to 15 pastures",
      "Full health tracking",
      "Breeding records",
      "Reports & CSV export",
      "Up to 5 users",
      "Photo attachments",
      "Priority support",
    ],
  },
  {
    id: "yearly",
    rcIdentifier: "commercial_yearly", // RevenueCat product identifier
    name: "Commercial Plan",
    price: "R999",
    period: "/month",
    description: "For large commercial operations (billed annually)",
    features: [
      "Unlimited animals",
      "Unlimited pastures",
      "Advanced analytics",
      "Treatment protocols",
      "Unlimited users",
      "Custom reports",
      "API access",
      "Dedicated support",
    ],
  },
]

export function PaywallScreen(props: PaywallScreenProps) {
  const { navigation } = props
  const { themed, theme } = useAppTheme()
  const { packages, isPremium, plan, purchasePackage, restorePurchases } = useSubscription()
  const [isLoading, setIsLoading] = useState(false)

  const handlePurchase = async (rcIdentifier: string) => {
    // Find package by RevenueCat identifier
    const pkg = packages.find(p =>
      p.identifier.toLowerCase().includes(rcIdentifier.toLowerCase()) ||
      p.product.identifier.toLowerCase().includes(rcIdentifier.toLowerCase())
    )

    if (!pkg) {
      Alert.alert("Error", `Package "${rcIdentifier}" not found. Please try again.`)
      console.log("[Paywall] Available packages:", packages.map(p => ({ id: p.identifier, productId: p.product.identifier })))
      return
    }

    setIsLoading(true)
    try {
      await purchasePackage(pkg)
      // Success - close paywall and let user see unlocked features
      Alert.alert(
        "Welcome to Premium! 🎉",
        "You now have access to premium features. Check out the Pastures tab!",
        [{ text: "Get Started", onPress: () => navigation.goBack() }]
      )
    } catch (error: any) {
      console.error("[Paywall] Purchase error:", error)
      // Don't show error if user cancelled
      if (!error.userCancelled) {
        Alert.alert("Purchase Failed", error.message || "Something went wrong. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    setIsLoading(true)
    try {
      await restorePurchases()
    } catch (error) {
      console.error("[Paywall] Restore error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // If already subscribed, show success message
  if (isPremium) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={themed($container)}>
        <View style={themed($successContainer)}>
          <Text preset="heading" style={themed($successTitle)}>
            You're on the {plan === "commercial" ? "Commercial" : "Farm"} plan!
          </Text>
          <Text style={themed($successMessage)}>
            You have access to premium features.
          </Text>
          <Button
            text="Continue"
            preset="filled"
            onPress={() => navigation.goBack()}
            style={themed($button)}
          />
        </View>
      </Screen>
    )
  }

  // Show custom paywall
  return (
    <Screen preset="fixed" contentContainerStyle={themed($fullContainer)} safeAreaEdges={["top", "bottom"]}>
      <View style={themed($header)}>
        <Button text="Close" preset="default" onPress={() => navigation.goBack()} />
      </View>

      <ScrollView style={themed($scrollView)} showsVerticalScrollIndicator={false}>
        <View style={themed($titleSection)}>
          <Text text="Upgrade to Premium" preset="heading" style={themed($title)} />
          <Text
            text="Unlock advanced features for your farm"
            style={themed($subtitle)}
          />
        </View>

        <View style={themed($pricingGrid)}>
          {PRICING_TIERS.map((tier) => (
            <View key={tier.id} style={themed($pricingCard)}>
              <Text text={tier.name} preset="subheading" style={themed($planName)} />
              <Text text={tier.description} size="xs" style={themed($planDescription)} />

              <View style={themed($priceSection)}>
                <Text text={tier.price} style={themed($price)} />
                <Text text={tier.period} style={themed($period)} />
              </View>

              <View style={themed($featuresContainer)}>
                {tier.features.map((feature, index) => (
                  <View key={index} style={themed($featureRow)}>
                    <CheckBadge size={18} color={theme.colors.tint} />
                    <Text text={feature} style={themed($featureText)} />
                  </View>
                ))}
              </View>

              <Button
                text={isLoading ? "Processing..." : `Subscribe to ${tier.name}`}
                preset="reversed"
                style={themed($actionButton)}
                onPress={() => handlePurchase(tier.rcIdentifier)}
                disabled={isLoading}
              />
            </View>
          ))}
        </View>

        <View style={themed($restoreSection)}>
          <Button
            text={isLoading ? "Restoring..." : "Restore Purchases"}
            preset="default"
            onPress={handleRestore}
            disabled={isLoading}
          />
        </View>

        <View style={themed($finePrintSection)}>
          <Text
            text="Prices in South African Rands (ZAR). Subscriptions auto-renew monthly. Cancel anytime from your account settings."
            size="xxs"
            style={themed($finePrint)}
          />
        </View>
      </ScrollView>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  justifyContent: "center",
})

const $fullContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $successContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  justifyContent: "center",
})

const $successTitle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  textAlign: "center",
})

const $successMessage: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginBottom: spacing.xxl,
  textAlign: "center",
  fontSize: 16,
  color: colors.palette.neutral600,
})

const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
  marginBottom: spacing.md,
})

const $scrollView: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $titleSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
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

const $pricingGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.md,
})

const $pricingCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  borderWidth: 2,
  borderColor: colors.tint,
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
})

const $price: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 28,
  fontWeight: "800",
  color: colors.text,
  lineHeight: 36,
})

const $period: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.textDim,
  marginLeft: 4,
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

const $restoreSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.lg,
  alignItems: "center",
})

const $finePrintSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.xl,
})

const $finePrint: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  lineHeight: 16,
})
