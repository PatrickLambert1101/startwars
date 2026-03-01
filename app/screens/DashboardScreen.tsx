import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const DashboardScreen: FC = () => {
  const { themed } = useAppTheme()

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <Text preset="heading" text="Dashboard" style={themed($heading)} />

      <View style={themed($statsRow)}>
        <View style={themed($statCard)}>
          <Text preset="subheading" text="0" style={themed($statNumber)} />
          <Text preset="formHelper" text="Total Head" />
        </View>
        <View style={themed($statCard)}>
          <Text preset="subheading" text="0" style={themed($statNumber)} />
          <Text preset="formHelper" text="Active" />
        </View>
      </View>

      <View style={themed($statsRow)}>
        <View style={themed($statCard)}>
          <Text preset="subheading" text="0" style={themed($statNumber)} />
          <Text preset="formHelper" text="Due to Calve" />
        </View>
        <View style={themed($statCard)}>
          <Text preset="subheading" text="0" style={themed($statNumber)} />
          <Text preset="formHelper" text="Pending Sync" />
        </View>
      </View>

      <View style={themed($section)}>
        <Text preset="subheading" text="Recent Activity" />
        <Text
          preset="default"
          text="No activity yet. Add your first animal to get started."
          style={themed($emptyText)}
        />
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
  marginTop: spacing.md,
})

const $statsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginBottom: spacing.sm,
})

const $statCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  alignItems: "center",
})

const $statNumber: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.sm,
})
