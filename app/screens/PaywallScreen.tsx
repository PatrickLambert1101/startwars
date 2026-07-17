import { useState } from "react"
import { View, ViewStyle, Alert, ScrollView, Pressable, TextStyle } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Screen, Button, Text } from "@/components"
import { CheckBadge } from "@/components/icons"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useSubscription, ANIMAL_LIMITS, FREE_ANIMAL_LIMIT } from "@/context/SubscriptionContext"

interface PaywallScreenProps extends AppStackScreenProps<"Paywall"> {}

// Every feature is free on every plan — plans differ only in how many animals
// you may hold. Feature lists intentionally lead with the animal cap.
const EVERY_FEATURE = "Every feature included"
const SHARED_FEATURES = [
  "Pastures, vaccines & reports",
  "Health & breeding records",
  "Photo attachments & team members",
]

// Reframed by animal count. rcIdentifiers unchanged so purchases still map to the
// existing RevenueCat products/entitlements (farm, commercial).
const PRICING_TIERS = [
  {
    id: "monthly",
    rcIdentifier: "farm_monthly",
    name: "Farm",
    price: "R249,99",
    period: "/month",
    description: "For a growing herd",
    features: [`Up to ${ANIMAL_LIMITS.farm.toLocaleString()} animals`, EVERY_FEATURE, ...SHARED_FEATURES],
  },
  {
    id: "yearly",
    rcIdentifier: "commercial_yearly",
    name: "Commercial",
    price: "R999",
    period: "/month",
    description: "Unlimited herd size",
    features: ["Unlimited animals", EVERY_FEATURE, ...SHARED_FEATURES],
  },
]

export function PaywallScreen(props: PaywallScreenProps) {
  const { navigation } = props
  const { themed, theme } = useAppTheme()
  const { packages, isPremium, plan, purchasePackage, restorePurchases } = useSubscription()
  const [isLoading, setIsLoading] = useState(false)

  const handlePurchase = async (rcIdentifier: string) => {
    if (packages.length === 0) {
      Alert.alert(
        "Subscriptions Unavailable",
        "We couldn't load subscription options right now. Please check your internet connection and try again later.",
      )
      console.log("[Paywall] No packages returned from RevenueCat — check Offerings config in dashboard or App Store Connect products")
      return
    }

    // Find package by RevenueCat identifier
    const pkg = packages.find(p =>
      p.identifier.toLowerCase().includes(rcIdentifier.toLowerCase()) ||
      p.product.identifier.toLowerCase().includes(rcIdentifier.toLowerCase())
    )

    if (!pkg) {
      Alert.alert(
        "Plan Unavailable",
        "This plan isn't available right now. Please try a different plan or contact support.",
      )
      console.log("[Paywall] Package not found:", rcIdentifier, "Available:", packages.map(p => ({ id: p.identifier, productId: p.product.identifier })))
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
    <Screen preset="fixed" contentContainerStyle={themed($fullContainer)} safeAreaEdges={["top", "bottom"]}>
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

        {packages.length === 0 && (
          <View style={themed($unavailableBanner)}>
            <Text
              text="Subscription plans are temporarily unavailable. Please try again later."
              size="xs"
              style={themed($unavailableText)}
            />
          </View>
        )}

        <View style={themed($pricingGrid)}>
          {PRICING_TIERS.map((tier) => {
            const subscribeDisabled = isLoading || packages.length === 0
            return (
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
                  disabled={subscribeDisabled}
                />
              </View>
            )
          })}
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
