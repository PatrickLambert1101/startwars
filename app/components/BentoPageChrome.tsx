import type { ComponentProps } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { bentoColors, bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"

import { Text } from "./Text"

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"]
export function BentoPageIntro({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: IconName
}) {
  const { theme } = useAppTheme()
  const c = bentoColors(theme.isDark)
  return (
    <View style={[styles.intro, { backgroundColor: c.forest }]}>
      <View style={[styles.introIcon, { backgroundColor: c.forestGlass }]}>
        <MaterialCommunityIcons accessible={false} name={icon} size={28} color={c.lime} />
      </View>
      <View style={styles.grow}>
        <Text text={title} preset="bold" style={[styles.introTitle, { color: c.onForest }]} />
        <Text text={description} size="xs" style={[styles.description, { color: c.lime }]} />
      </View>
    </View>
  )
}

export function BentoSettingsOverview({
  farm,
  email,
  plan,
  language,
  onPlan,
}: {
  farm: string
  email: string
  plan: string
  language: string
  onPlan: () => void
}) {
  const { theme } = useAppTheme()
  const c = bentoColors(theme.isDark)
  return (
    <View style={styles.overview}>
      <View style={[styles.accountHero, { backgroundColor: c.forest }]}>
        <MaterialCommunityIcons accessible={false} name="barn" size={30} color={c.lime} />
        <Text text={farm} preset="bold" style={[styles.farmName, { color: c.onForest }]} />
        <Text text={email} size="xs" style={{ color: c.lime }} />
      </View>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Manage ${plan} plan`}
          onPress={onPlan}
          style={({ pressed }) => [
            styles.overviewTile,
            { backgroundColor: c.sage, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <View style={styles.tileTop}>
            <MaterialCommunityIcons
              accessible={false}
              name="shield-check-outline"
              size={23}
              color={c.ink}
            />
            <MaterialCommunityIcons
              accessible={false}
              name="arrow-top-right"
              size={18}
              color={c.ink}
            />
          </View>
          <Text text={plan} preset="bold" size="lg" style={{ color: c.ink }} />
          <Text text="Your plan" size="xxs" style={{ color: c.muted }} />
        </Pressable>
        <View style={[styles.overviewTile, { backgroundColor: c.surface }]}>
          <MaterialCommunityIcons accessible={false} name="translate" size={23} color={c.ink} />
          <Text text={language} preset="bold" size="lg" style={{ color: c.ink }} />
          <Text text="App language" size="xxs" style={{ color: c.muted }} />
        </View>
      </View>
    </View>
  )
}

export function BentoManagementGrid({
  actions,
}: {
  actions: { label: string; icon: IconName; onPress: () => void }[]
}) {
  const { theme } = useAppTheme()
  const c = bentoColors(theme.isDark)
  return (
    <View style={styles.grid}>
      {actions.map((action, index) => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.managementTile,
            { backgroundColor: index === 0 ? c.sage : c.surface, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <View style={styles.tileTop}>
            <MaterialCommunityIcons accessible={false} name={action.icon} size={25} color={c.ink} />
            <MaterialCommunityIcons
              accessible={false}
              name="arrow-top-right"
              size={17}
              color={c.muted}
            />
          </View>
          <Text text={action.label} preset="bold" size="sm" style={{ color: c.ink }} />
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  accountHero: { borderRadius: bentoRadii.hero, gap: 12, padding: 22 },
  description: { marginTop: 6 },
  farmName: { fontSize: 27, lineHeight: 35 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  grow: { flex: 1 },
  intro: {
    alignItems: "center",
    borderRadius: bentoRadii.hero,
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    marginTop: 8,
    padding: 20,
  },
  introIcon: {
    alignItems: "center",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  introTitle: { fontSize: 21, lineHeight: 28 },
  managementTile: {
    borderRadius: bentoRadii.card,
    flexGrow: 1,
    gap: 16,
    justifyContent: "space-between",
    minHeight: 110,
    padding: 18,
    width: "46%",
  },
  overview: { gap: 12, marginBottom: 24, marginTop: 8 },
  overviewTile: { borderRadius: bentoRadii.card, flex: 1, gap: 8, minHeight: 132, padding: 18 },
  row: { alignItems: "stretch", flexDirection: "row", gap: 12 },
  tileTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
})
