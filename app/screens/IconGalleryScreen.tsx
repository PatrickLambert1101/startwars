import { useState } from "react"
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

import { herdtrackrIconImages as hexIconImages } from "@/assets/icons/herdtrackr-hex"
import { herdtrackrIconImages as plainIconImages } from "@/assets/icons/herdtrackr-transparent"
import { RfidLoadingAnimation } from "@/components/RfidLoadingAnimation"

/** Development route for reviewing the complete HerdTrackr icon set. */
export function IconGalleryScreen() {
  const [variant, setVariant] = useState<"plain" | "hex">("plain")
  const iconEntries = Object.entries(variant === "plain" ? plainIconImages : hexIconImages)

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>HerdTrackr Icons</Text>
      <Text style={styles.subtitle}>{iconEntries.length} transparent PNG icons</Text>
      <View style={styles.loaderPreview}>
        <RfidLoadingAnimation size={118} />
        <View style={styles.loaderCopy}>
          <Text style={styles.loaderTitle}>Cow RFID loading animation</Text>
          <Text style={styles.loaderSubtitle}>Approved SVG mark · slow rotating hex</Text>
        </View>
      </View>
      <View style={styles.variantPicker}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setVariant("plain")}
          style={[styles.variantButton, variant === "plain" && styles.variantButtonActive]}
        >
          <Text style={[styles.variantText, variant === "plain" && styles.variantTextActive]}>Plain</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setVariant("hex")}
          style={[styles.variantButton, variant === "hex" && styles.variantButtonActive]}
        >
          <Text style={[styles.variantText, variant === "hex" && styles.variantTextActive]}>Hex badge</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {iconEntries.map(([name, source]) => (
          <View key={name} style={styles.card}>
            <Image source={source} resizeMode="contain" style={styles.icon} />
            <Text numberOfLines={2} style={styles.name}>{name.replaceAll("-", " ")}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#20322C", flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#D2DED4", fontSize: 14, marginTop: 4 },
  loaderPreview: { alignItems: "center", backgroundColor: "#294139", borderColor: "#466156", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 12, marginTop: 16, padding: 12 },
  loaderCopy: { flex: 1 },
  loaderTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  loaderSubtitle: { color: "#BFD0C2", fontSize: 12, marginTop: 3 },
  variantPicker: { flexDirection: "row", gap: 8, marginBottom: 20, marginTop: 14 },
  variantButton: { borderColor: "#5F776B", borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  variantButtonActive: { backgroundColor: "#6B8F3E", borderColor: "#6B8F3E" },
  variantText: { color: "#D2DED4", fontSize: 13, fontWeight: "600" },
  variantTextActive: { color: "#FFFFFF" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { alignItems: "center", backgroundColor: "#294139", borderColor: "#466156", borderRadius: 12, borderWidth: 1, gap: 8, minHeight: 118, padding: 10, width: "30%" },
  icon: { height: 72, width: 72 },
  name: { color: "#DFE9E1", fontSize: 10, textAlign: "center" },
})
