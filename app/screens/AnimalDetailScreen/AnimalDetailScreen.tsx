import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

export const AnimalDetailScreen: FC<AppStackScreenProps<"AnimalDetail">> = ({ route }) => {
  const { themed } = useAppTheme()
  const { animalId } = route.params

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <Text preset="heading" text="Animal Detail" style={themed($heading)} />
      <Text text={`Animal ID: ${animalId}`} style={themed($subtext)} />

      <View style={themed($tabRow)}>
        <View style={themed($tab)}>
          <Text preset="formLabel" text="Overview" />
        </View>
        <View style={themed($tab)}>
          <Text preset="formLabel" text="Health" />
        </View>
        <View style={themed($tab)}>
          <Text preset="formLabel" text="Weight" />
        </View>
        <View style={themed($tab)}>
          <Text preset="formLabel" text="Breeding" />
        </View>
      </View>

      <View style={themed($placeholder)}>
        <Text text="Animal details will be loaded from WatermelonDB" style={themed($dimText)} />
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.xs,
})

const $subtext: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.lg,
})

const $tabRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.lg,
})

const $tab: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.sm,
  alignItems: "center",
})

const $placeholder: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  alignItems: "center",
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})
