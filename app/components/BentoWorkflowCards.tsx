import type { ComponentProps } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { bentoColors, bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"

import { Text } from "./Text"

type ChuteMode = "weight" | "condition" | "weight_and_treatment" | "protocol"
type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"]

export function BentoChuteModes({ onSelect }: { onSelect: (mode: ChuteMode) => void }) {
  const { t } = useTranslation()
  const { theme } = useAppTheme()
  const c = bentoColors(theme.isDark)
  const tile = (
    mode: ChuteMode,
    key: "weight" | "protocol" | "condition" | "weightAndTreatment",
    icon: IconName,
    background: string,
    hero = false,
    wide = false,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t(`chuteScreen.modes.${key}.title`)}. ${t(`chuteScreen.modes.${key}.description`)}`}
      onPress={() => onSelect(mode)}
      style={({ pressed }) => [
        styles.tile,
        wide && styles.wide,
        hero && styles.hero,
        { backgroundColor: background, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: hero ? c.forestGlass : c.surface }]}>
        <MaterialCommunityIcons
          accessible={false}
          name={icon}
          size={hero ? 30 : 24}
          color={hero ? c.lime : c.ink}
        />
      </View>
      <View style={styles.copy}>
        <Text
          text={t(`chuteScreen.modes.${key}.title`)}
          preset="bold"
          style={[hero ? styles.heroTitle : styles.title, { color: hero ? c.onForest : c.ink }]}
        />
        <Text
          text={t(`chuteScreen.modes.${key}.description`)}
          size="xs"
          style={[styles.description, { color: hero ? c.lime : c.muted }]}
        />
      </View>
      <MaterialCommunityIcons
        accessible={false}
        name="arrow-top-right"
        size={22}
        color={hero ? c.lime : c.muted}
        style={styles.arrow}
      />
    </Pressable>
  )
  return (
    <View style={styles.group}>
      <Text text={t("chuteScreen.selectMode")} style={[styles.intro, { color: c.muted }]} />
      {tile("weight", "weight", "scale", c.forest, true, true)}
      <View style={styles.row}>
        {tile("protocol", "protocol", "medical-bag", c.sage)}
        {tile("condition", "condition", "cow", c.peach)}
      </View>
      {tile(
        "weight_and_treatment",
        "weightAndTreatment",
        "clipboard-pulse-outline",
        c.surface,
        false,
        true,
      )}
    </View>
  )
}

export function BentoPastureActions({
  onMap,
  onCreate,
  onImport,
  createLabel,
}: {
  onMap: () => void
  onCreate: () => void
  onImport: () => void
  createLabel: string
}) {
  const { theme } = useAppTheme()
  const c = bentoColors(theme.isDark)
  return (
    <View style={styles.pastureActions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View all on map"
        onPress={onMap}
        style={({ pressed }) => [
          styles.map,
          { backgroundColor: c.forest, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <MaterialCommunityIcons accessible={false} name="map-outline" size={30} color={c.lime} />
        <Text
          text="View all on map"
          preset="bold"
          style={[styles.mapTitle, { color: c.onForest }]}
        />
        <MaterialCommunityIcons
          accessible={false}
          name="arrow-top-right"
          size={24}
          color={c.lime}
          style={styles.mapArrow}
        />
      </Pressable>
      <View style={styles.side}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={createLabel}
          onPress={onCreate}
          style={({ pressed }) => [
            styles.utility,
            { backgroundColor: c.sage, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <MaterialCommunityIcons accessible={false} name="plus" size={22} color={c.ink} />
          <Text
            text={createLabel.replace(/^\+\s*/, "")}
            preset="bold"
            size="sm"
            style={[styles.copy, { color: c.ink }]}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Import pasture map (KML/KMZ)"
          onPress={onImport}
          style={({ pressed }) => [
            styles.utility,
            { backgroundColor: c.surface, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <MaterialCommunityIcons
            accessible={false}
            name="tray-arrow-down"
            size={22}
            color={c.ink}
          />
          <View style={styles.copy}>
            <Text text="Import map" preset="bold" size="sm" style={{ color: c.ink }} />
            <Text text="KML / KMZ" size="xxs" style={{ color: c.muted }} />
          </View>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  arrow: { alignSelf: "flex-start" },
  copy: { flex: 1 },
  description: { marginTop: 6 },
  group: { gap: 12, paddingBottom: 24 },
  hero: { borderRadius: bentoRadii.hero, minHeight: 152 },
  heroTitle: { fontSize: 27, lineHeight: 34 },
  icon: { alignItems: "center", borderRadius: 16, height: 48, justifyContent: "center", width: 48 },
  intro: { fontSize: 15, lineHeight: 23, marginBottom: 4, marginTop: 8 },
  map: {
    borderRadius: bentoRadii.hero,
    flex: 1.3,
    gap: 12,
    justifyContent: "space-between",
    minHeight: 164,
    padding: 20,
  },
  mapArrow: { alignSelf: "flex-end" },
  mapTitle: { fontSize: 23, lineHeight: 29 },
  pastureActions: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    marginTop: 8,
  },
  row: { alignItems: "stretch", flexDirection: "row", gap: 12 },
  side: { flex: 1, gap: 12 },
  tile: { borderRadius: bentoRadii.card, flex: 1, gap: 12, minHeight: 180, padding: 18 },
  title: { fontSize: 18, lineHeight: 25 },
  utility: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 72,
    padding: 14,
  },
  wide: { alignItems: "center", flex: undefined, flexDirection: "row", minHeight: 112 },
})
