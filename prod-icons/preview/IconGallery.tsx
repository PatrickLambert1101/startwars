import type { ComponentType } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

import * as Icons from "../base/icons"
import type { IconProps } from "../base/icons"

type IconEntry = [string, ComponentType<IconProps>]

const iconEntries = Object.entries(Icons).filter(([, icon]) => typeof icon === "function") as unknown as IconEntry[]

/** A temporary development screen for visually reviewing every HerdTrackr icon. */
export function IconGallery() {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>HerdTrackr Icons</Text>
      <Text style={styles.subtitle}>{iconEntries.length} React Native SVG components</Text>
      <View style={styles.grid}>
        {iconEntries.map(([name, IconComponent]) => (
          <View key={name} style={styles.card}>
            <IconComponent color="#13212B" size={32} />
            <Text numberOfLines={2} style={styles.name}>{name.replace(/Icon$/, "")}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#F7F8F5" },
  content: { padding: 20, paddingBottom: 48 },
  title: { color: "#13212B", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#60706B", fontSize: 14, marginTop: 4, marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E7E1",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    minHeight: 100,
    padding: 14,
    width: "30%",
  },
  name: { color: "#41514C", fontSize: 11, textAlign: "center" },
})
