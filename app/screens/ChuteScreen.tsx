import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, TextField, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const ChuteScreen: FC = () => {
  const { themed } = useAppTheme()

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <Text preset="heading" text="Chute Mode" style={themed($heading)} />
      <Text text="Rapid scan-and-record for chute-side processing" style={themed($subtitle)} />

      <View style={themed($scanArea)}>
        <View style={themed($scanBox)}>
          <Text preset="subheading" text="SCAN RFID" style={themed($scanText)} />
          <TextField
            placeholder="Tap to enter RFID manually"
            containerStyle={themed($scanInput)}
          />
          <Text preset="formHelper" text="Or connect your RFID scanner device" style={themed($helperText)} />
        </View>
      </View>

      <View style={themed($quickActions)}>
        <Text preset="formLabel" text="Quick Actions" style={themed($quickActionsLabel)} />
        <View style={themed($actionRow)}>
          <Button text="Weight" preset="filled" style={themed($actionButton)} />
          <Button text="Treatment" preset="filled" style={themed($actionButton)} />
          <Button text="Condition" preset="filled" style={themed($actionButton)} />
        </View>
      </View>

      <View style={themed($sessionInfo)}>
        <Text preset="formHelper" text="Session: 0 animals processed" />
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.xs,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.lg,
})

const $scanArea: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  marginBottom: spacing.lg,
})

const $scanBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.xl,
  alignItems: "center",
  borderWidth: 2,
  borderColor: colors.tint,
  borderStyle: "dashed",
})

const $scanText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.md,
  letterSpacing: 2,
})

const $scanInput: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})

const $helperText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

const $quickActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $quickActionsLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $actionRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $actionButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $sessionInfo: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderTopWidth: 1,
  borderTopColor: colors.separator,
  paddingVertical: spacing.md,
  alignItems: "center",
})
