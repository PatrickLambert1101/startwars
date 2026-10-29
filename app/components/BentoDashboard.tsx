import type { ComponentProps, ReactNode } from "react"
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { bentoColors } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"

import { Text } from "./Text"

const forestColors = bentoColors(false)

interface OverviewProps {
  farm: string
  animals: number
  grazing: number
  occupied: number
  loading: boolean
  pasturesLoading: boolean
  onFarm: () => void
  onHerd: () => void
  onPastures: () => void
}

export function BentoOverview(props: OverviewProps) {
  const { theme } = useAppTheme()
  const c = bentoColors(theme.isDark)
  return (
    <View style={styles.overview}>
      <View style={[styles.hero, { backgroundColor: c.forest }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Switch farm"
          onPress={props.onFarm}
          style={styles.farm}
        >
          <View style={styles.grow}>
            <Text text="YOUR FARM" style={[styles.eyebrow, { color: c.lime }]} />
            <Text text={props.farm} preset="bold" style={styles.farmName} />
          </View>
          <MaterialCommunityIcons name="chevron-down" size={20} color={c.lime} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${props.animals} active animals. Open herd`}
          onPress={props.onHerd}
          style={styles.herdCount}
        >
          {props.loading ? (
            <ActivityIndicator color={c.lime} />
          ) : (
            <Text
              text={String(props.animals)}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              style={styles.bigNumber}
            />
          )}
          <View style={styles.countFooter}>
            <Text
              text={props.animals === 1 ? "active animal" : "active animals"}
              style={styles.onForest}
            />
            <MaterialCommunityIcons name="arrow-top-right" size={22} color={c.lime} />
          </View>
        </Pressable>
      </View>
      <View style={styles.side}>
        {[
          {
            value: props.grazing,
            label: "On pasture",
            icon: "grass" as const,
            tone: c.sage,
            loading: props.loading,
          },
          {
            value: props.occupied,
            loading: props.pasturesLoading,
            label: "Pastures in use",
            icon: "map-outline" as const,
            tone: c.surface,
          },
        ].map((item) => (
          <Pressable
            key={item.label}
            onPress={props.onPastures}
            accessibilityRole="button"
            accessibilityLabel={`${item.value} ${item.label}. Open pastures`}
            style={[styles.metric, { backgroundColor: item.tone }]}
          >
            <View style={styles.metricTop}>
              <MaterialCommunityIcons name={item.icon} size={20} color={c.ink} />
              {item.loading ? (
                <ActivityIndicator color={c.ink} />
              ) : (
                <Text text={String(item.value)} style={[styles.metricNumber, { color: c.ink }]} />
              )}
            </View>
            <Text text={item.label} size="xxs" style={{ color: c.muted }} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

interface ActionsProps {
  scanner: ReactNode
  onWeigh: () => void
  onAdd: () => void
  onTreat: () => void
  onMove: () => void
  onBreed: () => void
}

export function BentoActions(props: ActionsProps) {
  const { theme } = useAppTheme()
  const c = bentoColors(theme.isDark)
  const action = (
    label: string,
    icon: ComponentProps<typeof MaterialCommunityIcons>["name"],
    onPress: () => void,
    compact = false,
  ) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        compact ? styles.smallAction : styles.action,
        { backgroundColor: compact ? c.surface : c.sage },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: compact ? c.sage : c.surface }]}>
        <MaterialCommunityIcons
          accessible={false}
          name={icon}
          size={compact ? 20 : 23}
          color={c.ink}
        />
      </View>
      <Text
        text={label}
        preset="bold"
        size={compact ? "xxs" : "xs"}
        style={[compact ? styles.smallLabel : styles.grow, { color: c.ink }]}
      />
      {!compact && <MaterialCommunityIcons name="arrow-top-right" size={17} color={c.muted} />}
    </Pressable>
  )
  return (
    <View style={styles.actions}>
      <View style={styles.mainActions}>
        <View style={styles.scanner}>{props.scanner}</View>
        <View style={styles.actionStack}>
          {action("Weigh", "scale", props.onWeigh)}
          {action("Add animal", "plus", props.onAdd)}
        </View>
      </View>
      <View style={styles.smallActions}>
        {action("Treatment", "medical-bag", props.onTreat, true)}
        {action("Move animals", "swap-horizontal", props.onMove, true)}
        {action("Breeding", "heart-plus-outline", props.onBreed, true)}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 62,
    padding: 12,
  },
  actionStack: { flex: 1, gap: 10 },
  actions: { gap: 10 },
  bigNumber: {
    color: forestColors.onForest,
    fontSize: 54,
    fontWeight: "600",
    letterSpacing: -2,
    lineHeight: 64,
  },
  countFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "space-between",
  },
  eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.7, lineHeight: 16 },
  farm: { alignItems: "center", flexDirection: "row", gap: 6, minHeight: 50 },
  farmName: { color: forestColors.onForest, fontSize: 23, lineHeight: 29, marginTop: 5 },
  grow: { flex: 1 },
  herdCount: { marginTop: 18 },
  hero: {
    borderRadius: 26,
    flex: 1.45,
    justifyContent: "space-between",
    minHeight: 218,
    padding: 18,
  },
  icon: { alignItems: "center", borderRadius: 12, height: 34, justifyContent: "center", width: 34 },
  mainActions: { alignItems: "stretch", flexDirection: "row", gap: 10 },
  metric: { borderRadius: 24, flex: 1, gap: 6, justifyContent: "space-between", padding: 16 },
  metricNumber: { fontSize: 30, fontWeight: "600", letterSpacing: -1, lineHeight: 38 },
  metricTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "space-between",
  },
  onForest: { color: forestColors.lime, flexShrink: 1, fontSize: 12, lineHeight: 20 },
  overview: { flexDirection: "row", gap: 10 },
  scanner: { flex: 1 },
  side: { flex: 1, gap: 10 },
  smallAction: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    gap: 8,
    paddingHorizontal: 5,
    paddingVertical: 14,
  },
  smallActions: { flexDirection: "row", gap: 10 },
  smallLabel: { textAlign: "center" },
})
