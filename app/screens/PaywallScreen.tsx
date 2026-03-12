import React, { useState } from "react"
import { View, ViewStyle, Alert, Platform } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Screen, Button, Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useSubscription } from "@/context/SubscriptionContext"
import { RevenueCatUI, PAYWALL_RESULT } from "react-native-purchases-ui"

interface PaywallScreenProps extends AppStackScreenProps<"Paywall"> {}

export function PaywallScreen(props: PaywallScreenProps) {
  const { navigation } = props
  const { themed } = useAppTheme()
  const { packages, isPro, restorePurchases } = useSubscription()
  const [isRestoring, setIsRestoring] = useState(false)

  // Handle paywall result
  const handlePaywallResult = async (result: any) => {
    console.log("[Paywall] Result:", result)

    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        // Success! User is now subscribed
        Alert.alert(
          "Welcome to Pro!",
          "You now have access to all premium features.",
          [{ text: "Get Started", onPress: () => navigation.goBack() }]
        )
        break

      case PAYWALL_RESULT.CANCELLED:
        // User cancelled - do nothing
        console.log("[Paywall] User cancelled")
        break

      case PAYWALL_RESULT.ERROR:
        Alert.alert(
          "Something went wrong",
          "We couldn't process your purchase. Please try again.",
        )
        break

      case PAYWALL_RESULT.NOT_PRESENTED:
        // Paywall couldn't be presented
        console.error("[Paywall] Could not present paywall")
        navigation.goBack()
        break
    }
  }

  const handleRestore = async () => {
    setIsRestoring(true)
    try {
      await restorePurchases()
    } catch (error) {
      console.error("[Paywall] Restore error:", error)
    } finally {
      setIsRestoring(false)
    }
  }

  // If already Pro, show success message
  if (isPro) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={themed($container)}>
        <View style={themed($successContainer)}>
          <Text preset="heading" style={themed($successTitle)}>
            You're already Pro!
          </Text>
          <Text style={themed($successMessage)}>
            You have access to all premium features.
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

  // Show RevenueCat Paywall UI
  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={themed($fullscreen)}>
      <RevenueCatUI.Paywall
        options={{
          // Optional: customize the paywall
          // displayCloseButton: true,
          // shouldBlockTouchesOnPaywallPresented: true,
        }}
        onPurchaseCompleted={({ customerInfo }) => {
          console.log("[Paywall] Purchase completed:", customerInfo)
          handlePaywallResult(PAYWALL_RESULT.PURCHASED)
        }}
        onRestoreCompleted={({ customerInfo }) => {
          console.log("[Paywall] Restore completed:", customerInfo)
          handlePaywallResult(PAYWALL_RESULT.RESTORED)
        }}
        onDismiss={() => {
          console.log("[Paywall] Dismissed")
          navigation.goBack()
        }}
        onPurchaseError={({ error }) => {
          console.error("[Paywall] Purchase error:", error)
          if (!error.userCancelled) {
            handlePaywallResult(PAYWALL_RESULT.ERROR)
          }
        }}
        onRestoreError={({ error }) => {
          console.error("[Paywall] Restore error:", error)
          Alert.alert("Restore Failed", error.message || "Could not restore purchases.")
        }}
      />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  justifyContent: "center",
})

const $fullscreen: ThemedStyle<ViewStyle> = () => ({
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
