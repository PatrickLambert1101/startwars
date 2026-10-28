import { useState } from "react"
import { View, ViewStyle, Alert, Linking, ScrollView, Pressable, TextStyle } from "react-native"

import { Screen, Button, Text } from "@/components"
import { CheckBadge } from "@/components/icons"
import { useSubscription, ANIMAL_LIMITS, FREE_ANIMAL_LIMIT } from "@/context/SubscriptionContext"
import { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { findSubscriptionPackage, formatSubscriptionPeriod } from "@/utils/subscriptionProducts"

interface PaywallScreenProps extends AppStackScreenProps<"Paywall"> {}

// Every feature is free on every plan — plans differ only in how many animals
// you may hold. Feature lists intentionally lead with the animal cap.
const EVERY_FEATURE = "Every feature included"
const SHARED_FEATURES = [
  "Pastures, vaccines & reports",
  "Health & breeding records",
  "Photo attachments & team members",
]

const PRIVACY_POLICY_URL = "https://herdtrackr.co.za/privacy-policy.html"
const TERMS_OF_USE_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"

// Product identifiers must exactly match App Store Connect and RevenueCat.
const PRICING_TIERS = [
  {
    id: "farm",
    productIdentifier: "farm_monthly",
    name: "Farm",
    description: "For a growing herd",
    features: [
      `Up to ${ANIMAL_LIMITS.farm.toLocaleString()} animals`,
      EVERY_FEATURE,
      ...SHARED_FEATURES,
    ],
  },
  {
    id: "commercial",
    productIdentifier: "commercial_monthly",
    name: "Commercial",
    description: "Unlimited herd size",
    features: ["Unlimited animals", EVERY_FEATURE, ...SHARED_FEATURES],
  },
]

export function PaywallScreen(props: PaywallScreenProps) {
  const { navigation } = props
  const { themed, theme } = useAppTheme()
  const {
    packages,
    isPackagesLoading,
    isLoading,
    isPremium,
    plan,
    purchasePackage,
    reloadPackages,
    restorePurchases,
  } = useSubscription()
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePurchase = async (productIdentifier: string) => {
    const pkg = findSubscriptionPackage(packages, productIdentifier)

    if (!pkg) {
      Alert.alert(
        "Plan Unavailable",
        "This plan isn't available right now. Please try a different plan or contact support.",
      )
      console.log(
        "[Paywall] Package not found:",
        productIdentifier,
        "Available:",
        packages.map((p) => ({ id: p.identifier, productId: p.product.identifier })),
      )
      return
    }

    setIsProcessing(true)
    try {
      const outcome = await purchasePackage(pkg)

      if (outcome === "already_active") {
        Alert.alert(
          "Already Subscribed",
          "This plan is already active on your App Store or Google Play account.",
          [{ text: "Continue", onPress: () => navigation.goBack() }],
        )
        return
      }

      // Success - close paywall and let user see unlocked features
      Alert.alert("Subscription Active", "Your animal limit has been updated.", [
        { text: "Continue", onPress: () => navigation.goBack() },
      ])
    } catch (error: any) {
      console.error("[Paywall] Purchase error:", error)
      // Don't show error if user cancelled
      if (!error.userCancelled) {
        Alert.alert("Purchase Failed", error.message || "Something went wrong. Please try again.")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRestore = async () => {
    setIsProcessing(true)
    try {
      await restorePurchases()
    } catch (error) {
      console.error("[Paywall] Restore error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReloadPackages = async () => {
    try {
      await reloadPackages()
    } catch (error: any) {
      console.error("[Paywall] Product reload error:", error)
      Alert.alert(
        "Subscriptions Unavailable",
        "We couldn't load subscription options. Check your connection and try again.",
      )
    }
  }

  const openLegalLink = async (url: string) => {
    try {
      await Linking.openURL(url)
    } catch (error) {
      console.error("[Paywall] Could not open legal link:", error)
      Alert.alert("Unable to Open Link", "Please check your internet connection and try again.")
    }
  }

  // If already subscribed, show success message
  if (isPremium) {
    return (
      <Screen
        preset="fixed"
        safeAreaEdges={["top", "bottom"]}
        contentContainerStyle={themed($container)}
      >
        <View style={themed($successContainer)}>
          <Text
            text={`You're on the ${plan === "commercial" ? "Commercial" : "Farm"} plan!`}
            preset="heading"
            style={themed($successTitle)}
          />
          <Text style={themed($successMessage)}>
            {plan === "commercial"
              ? "You can add unlimited animals."
              : `You can add up to ${ANIMAL_LIMITS.farm.toLocaleString()} animals.`}
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
    <Screen
      preset="fixed"
      contentContainerStyle={themed($fullContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($header)}>
        <Button text="Close" preset="default" onPress={() => navigation.goBack()} />
      </View>

      <ScrollView style={themed($scrollView)} showsVerticalScrollIndicator={false}>
        <View style={themed($titleSection)}>
          <Text text="More room for your herd" preset="heading" style={themed($title)} />
          <Text
            text={`Every feature is free for your first ${FREE_ANIMAL_LIMIT} animals. Plans just raise the limit — nothing is locked away.`}
            style={themed($subtitle)}
          />
        </View>

        {!isPackagesLoading && packages.length === 0 && (
          <View style={themed($unavailableBanner)}>
            <Text
              text="Subscription plans couldn't be loaded. Check your connection and try again."
              size="xs"
              style={themed($unavailableText)}
            />
            <Button
              text="Try Again"
              preset="default"
              onPress={handleReloadPackages}
              style={themed($retryButton)}
            />
          </View>
        )}

        {isPackagesLoading && (
          <Text text="Loading subscription plans…" style={themed($loadingText)} />
        )}

        {packages.length > 0 && (
          <View style={themed($pricingGrid)}>
            {PRICING_TIERS.map((tier) => {
              const pkg = findSubscriptionPackage(packages, tier.productIdentifier)
              const subscribeDisabled = isProcessing || isLoading || !pkg
              return (
                <View key={tier.id} style={themed($pricingCard)}>
                  <Text text={tier.name} preset="subheading" style={themed($planName)} />
                  <Text text={tier.description} size="xs" style={themed($planDescription)} />

                  <View style={themed($priceSection)}>
                    <Text text={pkg?.product.priceString ?? "Unavailable"} style={themed($price)} />
                    {!!pkg && (
                      <Text
                        text={formatSubscriptionPeriod(pkg.product.subscriptionPeriod)}
                        style={themed($period)}
                      />
                    )}
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
                    text={
                      isProcessing
                        ? "Processing..."
                        : isLoading
                          ? "Checking subscription..."
                          : `Subscribe to ${tier.name}`
                    }
                    preset="reversed"
                    style={themed($actionButton)}
                    onPress={() => handlePurchase(tier.productIdentifier)}
                    disabled={subscribeDisabled}
                  />
                </View>
              )
            })}
          </View>
        )}

        <View style={themed($restoreSection)}>
          <Button
            text={isProcessing ? "Restoring..." : "Restore Purchases"}
            preset="default"
            onPress={handleRestore}
            disabled={isProcessing}
          />
        </View>

        <View style={themed($finePrintSection)}>
          <Text
            text="Payment is charged to your store account. Subscriptions renew automatically at the displayed price and billing period unless canceled at least 24 hours before the end of the current period. Manage or cancel in your App Store or Google Play account settings."
            size="xxs"
            style={themed($finePrint)}
          />
          <View style={themed($legalLinks)}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open Privacy Policy"
              onPress={() => openLegalLink(PRIVACY_POLICY_URL)}
              hitSlop={8}
            >
              <Text text="Privacy Policy" size="xxs" style={themed($legalLink)} />
            </Pressable>
            <Text text="•" size="xxs" style={themed($legalSeparator)} />
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open Terms of Use"
              onPress={() => openLegalLink(TERMS_OF_USE_URL)}
              hitSlop={8}
            >
              <Text text="Terms of Use (EULA)" size="xxs" style={themed($legalLink)} />
            </Pressable>
          </View>
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

const $successContainer: ThemedStyle<ViewStyle> = () => ({
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

const $unavailableBanner: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginHorizontal: spacing.lg,
  marginBottom: spacing.sm,
  padding: spacing.sm,
  borderRadius: 12,
  backgroundColor: colors.palette.accent100,
  borderLeftWidth: 3,
  borderLeftColor: colors.palette.accent500,
})

const $unavailableText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  textAlign: "center",
})

const $retryButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginHorizontal: spacing.lg,
  marginBottom: spacing.md,
  textAlign: "center",
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

const $legalLinks: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.xs,
  marginTop: spacing.sm,
})

const $legalLink: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  textDecorationLine: "underline",
})

const $legalSeparator: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $finePrint: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  lineHeight: 16,
})
