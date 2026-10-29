import { Pressable, StyleSheet, View } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { bentoColors, bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"

import { Text } from "./Text"

type ProfileProps = {
  name: string
  eyebrow: string
  subtitle: string
  status: string
  statusColor: string
  weight: string
  age: string
  offspring: string
  onWeightHistory: () => void
  onWeigh: () => void
  onHealth: () => void
}

export function BentoAnimalProfile(props: ProfileProps) {
  const { theme } = useAppTheme()
  const c = bentoColors(theme.isDark)
  return (
    <View style={styles.group}>
      <View style={[styles.hero, { backgroundColor: c.forest }]}>
        <View style={styles.heroTop}>
          <View style={[styles.avatar, { backgroundColor: c.forestGlass }]}>
            <MaterialCommunityIcons accessible={false} name="cow" size={30} color={c.lime} />
          </View>
          <View style={[styles.status, { backgroundColor: c.surface }]}>
            <View style={[styles.dot, { backgroundColor: props.statusColor }]} />
            <Text text={props.status} size="xxs" preset="bold" style={{ color: c.ink }} />
          </View>
        </View>
        <Text text={props.eyebrow} size="xxs" style={[styles.eyebrow, { color: c.lime }]} />
        <Text
          text={props.name}
          preset="bold"
          numberOfLines={2}
          style={[styles.name, { color: c.onForest }]}
        />
        <Text text={props.subtitle} size="sm" style={{ color: c.lime }} />
      </View>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Latest weight: ${props.weight}. View weight history`}
          onPress={props.onWeightHistory}
          style={[styles.metric, styles.weight, { backgroundColor: c.sage }]}
        >
          <View style={styles.metricTop}>
            <MaterialCommunityIcons accessible={false} name="scale" size={20} color={c.ink} />
            <MaterialCommunityIcons
              accessible={false}
              name="arrow-top-right"
              size={17}
              color={c.muted}
            />
          </View>
          <Text
            text={props.weight}
            preset="bold"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            style={[styles.value, { color: c.ink }]}
          />
          <Text text="Latest weight" size="xxs" style={{ color: c.muted }} />
        </Pressable>
        {[
          ["Age", props.age],
          ["Offspring", props.offspring],
        ].map(([label, value]) => (
          <View key={label} style={[styles.metric, { backgroundColor: c.surface }]}>
            <Text
              text={value}
              preset="bold"
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={[styles.smallValue, { color: c.ink }]}
            />
            <Text text={label} size="xxs" style={{ color: c.muted }} />
          </View>
        ))}
      </View>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Record weight"
          onPress={props.onWeigh}
          style={[styles.action, { backgroundColor: c.sage }]}
        >
          <MaterialCommunityIcons accessible={false} name="scale" size={22} color={c.ink} />
          <Text text="Weigh" preset="bold" size="sm" style={{ color: c.ink }} />
          <MaterialCommunityIcons accessible={false} name="plus" size={18} color={c.ink} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add health record"
          onPress={props.onHealth}
          style={[styles.action, { backgroundColor: c.surface }]}
        >
          <MaterialCommunityIcons accessible={false} name="medical-bag" size={22} color={c.ink} />
          <Text
            text="Health record"
            preset="bold"
            size="sm"
            style={[styles.grow, { color: c.ink }]}
          />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    borderRadius: bentoRadii.button,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 60,
    padding: 14,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  dot: { borderRadius: 4, height: 7, width: 7 },
  eyebrow: { letterSpacing: 1.4, marginTop: 18 },
  group: { gap: 12, marginBottom: 16 },
  grow: { flexShrink: 1 },
  hero: { borderRadius: bentoRadii.hero, padding: 20 },
  heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  metric: {
    borderRadius: bentoRadii.card,
    flex: 1,
    gap: 6,
    justifyContent: "space-between",
    minHeight: 110,
    padding: 14,
  },
  metricTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 32, lineHeight: 40, marginBottom: 4 },
  row: { alignItems: "stretch", flexDirection: "row", gap: 10 },
  smallValue: { fontSize: 18, lineHeight: 25 },
  status: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  value: { fontSize: 26, lineHeight: 34 },
  weight: { flex: 1.4 },
})
