import { Pressable, StyleSheet, View } from "react-native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { useNavigation } from "@react-navigation/native"

import type { MainTabParamList } from "@/navigators/navigationTypes"
import { bentoColors } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"

import { Text } from "./Text"

export function PlanSwitcher({ selected }: { selected: "Calendar" | "Breeding" }) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>()
  const { theme } = useAppTheme()
  const c = bentoColors(theme.isDark)
  return (
    <View style={[styles.track, { backgroundColor: c.line }]} accessibilityRole="tablist">
      {(["Calendar", "Breeding"] as const).map((route) => (
        <Pressable
          key={route}
          onPress={() => navigation.navigate(route)}
          testID={`plan-${route}`}
          accessibilityRole="tab"
          accessibilityLabel={route}
          accessibilityState={{ selected: selected === route }}
          style={[styles.tab, selected === route && { backgroundColor: c.surface }]}
        >
          <Text
            text={route}
            preset="bold"
            size="xs"
            style={{ color: selected === route ? c.ink : c.muted }}
          />
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  tab: { alignItems: "center", borderRadius: 14, flex: 1, justifyContent: "center", minHeight: 44 },
  track: {
    borderRadius: 18,
    flexDirection: "row",
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 4,
  },
})
