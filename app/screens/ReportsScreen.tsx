import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, ListItem } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const REPORT_ITEMS = [
  { title: "Herd Summary", description: "Total head, by status, sex, and breed" },
  { title: "Weight Analytics", description: "ADG charts, group comparisons" },
  { title: "Health Summary", description: "Treatments, upcoming withdrawals" },
  { title: "Breeding Report", description: "Pregnancy rate, calving outcomes" },
  { title: "Death Loss", description: "Mortality tracking and percentage" },
]

export const ReportsScreen: FC = () => {
  const { themed } = useAppTheme()

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <Text preset="heading" text="Reports" style={themed($heading)} />
      <Text text="Analytics and reporting for your operation" style={themed($subtitle)} />

      <View style={themed($list)}>
        {REPORT_ITEMS.map((item) => (
          <ListItem
            key={item.title}
            text={item.title}
            bottomSeparator
            rightIcon="caretRight"
          >
            <View>
              <Text preset="bold" text={item.title} />
              <Text preset="formHelper" text={item.description} style={themed($itemDesc)} />
            </View>
          </ListItem>
        ))}
      </View>

      <View style={themed($comingSoon)}>
        <Text text="Reports will be populated once animals are added." style={themed($dimText)} />
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

const $subtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.lg,
})

const $list: ThemedStyle<ViewStyle> = () => ({})

const $itemDesc: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $comingSoon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
  alignItems: "center",
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})
