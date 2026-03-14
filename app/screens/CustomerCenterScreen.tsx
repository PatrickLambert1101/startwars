import React from "react"
import { View, ViewStyle, Alert } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Screen, Text, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useSubscription } from "@/context/SubscriptionContext"
import RevenueCatUI from "react-native-purchases-ui"

interface CustomerCenterScreenProps extends AppStackScreenProps<"CustomerCenter"> {}

export function CustomerCenterScreen(props: CustomerCenterScreenProps) {
  const { navigation } = props
  const { themed } = useAppTheme()
  const { isPremium } = useSubscription()

  // If not subscribed, redirect to paywall
  if (!isPremium) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={themed($container)}>
        <View style={themed($messageContainer)}>
          <Text preset="heading" style={themed($messageTitle)}>
            No Active Subscription
          </Text>
          <Text style={themed($messageText)}>
            You don't have an active subscription. Upgrade to access premium features and manage your subscription.
          </Text>
          <Button
            text="View Plans"
            preset="filled"
            onPress={() => navigation.navigate("Paywall")}
            style={themed($button)}
          />
          <Button
            text="Go Back"
            preset="default"
            onPress={() => navigation.goBack()}
            style={themed($button)}
          />
        </View>
      </Screen>
    )
  }

  // Show RevenueCat Customer Center UI for Pro users
  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={themed($fullscreen)}>
      <RevenueCatUI.CustomerCenterView
        onDismiss={() => {
          console.log("[CustomerCenter] Dismissed")
          navigation.goBack()
        }}
        onRestoreCompleted={({ customerInfo }) => {
          console.log("[CustomerCenter] Restore completed:", customerInfo)
          Alert.alert(
            "Purchases Restored",
            "Your purchases have been restored successfully.",
          )
        }}
        onRestoreFailed={({ error }) => {
          console.error("[CustomerCenter] Restore error:", error)
          Alert.alert(
            "Restore Failed",
            error.message || "Could not restore purchases. Please try again.",
          )
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

const $messageContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  justifyContent: "center",
})

const $messageTitle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  textAlign: "center",
})

const $messageText: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginBottom: spacing.xxl,
  textAlign: "center",
  fontSize: 16,
  color: colors.palette.neutral600,
  lineHeight: 24,
})

const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  minWidth: 200,
})
