import { useEffect, useState } from "react"
import { Image, Keyboard, Pressable, StyleSheet, View } from "react-native"
import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/components/Text"
import { BreedingScreen } from "@/screens/BreedingScreen"
import { CalendarScreen } from "@/screens/CalendarScreen"
import { ChuteScreen } from "@/screens/ChuteScreen"
import { DashboardScreen } from "@/screens/DashboardScreen"
import { HerdListScreen } from "@/screens/HerdListScreen"
import { PasturesScreen } from "@/screens/PasturesScreen"
import { bentoColors } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"

import type { MainTabParamList } from "./navigationTypes"

const Tab = createBottomTabNavigator<MainTabParamList>()
const destinations = [
  { route: "Dashboard", label: "Home", icon: require("../assets/icons/tab/dashboard.png") },
  { route: "HerdList", label: "Herd", icon: require("../assets/icons/tab/herd.png") },
  { route: "Chute", label: "Chute", icon: require("../assets/icons/tab/chute.png") },
  { route: "Pastures", label: "Pastures", icon: require("../assets/icons/tab/pastures.png") },
  { route: "Calendar", label: "Plan", icon: require("../assets/icons/tab/calendar.png") },
] as const

export function BentoTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { theme } = useAppTheme()
  const c = bentoColors(theme.isDark)
  const [keyboardVisible, setKeyboardVisible] = useState(Keyboard.isVisible())
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true))
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])
  const active = state.routes[state.index].name
  if (keyboardVisible) return null
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: c.surface,
          borderTopColor: c.line,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingLeft: Math.max(insets.left, 8),
          paddingRight: Math.max(insets.right, 8),
        },
      ]}
    >
      {destinations.map((item) => {
        const target = item.route === "Calendar" && active === "Breeding" ? "Breeding" : item.route
        const route = state.routes.find((entry) => entry.name === target)!
        const selected = active === target
        const chute = item.route === "Chute"
        return (
          <Pressable
            key={item.route}
            testID={`navigation-${item.route}`}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              })
              if (!selected && !event.defaultPrevented)
                navigation.navigate(route.name, route.params)
            }}
            onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.65 : 1 }]}
          >
            <View
              style={[
                styles.iconWrap,
                chute
                  ? [styles.chute, { backgroundColor: selected ? c.forest : c.sage }]
                  : selected && { backgroundColor: c.sage },
              ]}
            >
              <Image
                source={item.icon}
                accessible={false}
                resizeMode="contain"
                style={[
                  styles.icon,
                  { tintColor: chute && selected ? c.onForest : selected ? c.ink : c.muted },
                ]}
              />
            </View>
            <Text
              text={item.label}
              numberOfLines={1}
              maxFontSizeMultiplier={1.4}
              style={[
                styles.label,
                selected ? styles.selectedLabel : styles.inactiveLabel,
                { color: selected ? c.ink : c.muted },
              ]}
            />
          </Pressable>
        )
      })}
    </View>
  )
}

export const MainTabNavigator = () => (
  <Tab.Navigator
    backBehavior="history"
    detachInactiveScreens
    tabBar={(props) => <BentoTabBar {...props} />}
    screenOptions={{ headerShown: false, lazy: true, freezeOnBlur: true, animation: "none" }}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="HerdList" component={HerdListScreen} />
    <Tab.Screen name="Chute" component={ChuteScreen} />
    <Tab.Screen name="Pastures" component={PasturesScreen} />
    <Tab.Screen name="Calendar" component={CalendarScreen} />
    <Tab.Screen name="Breeding" component={BreedingScreen} />
  </Tab.Navigator>
)

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", paddingTop: 6 },
  chute: { borderRadius: 16, height: 42, marginTop: -8, width: 48 },
  icon: { height: 23, width: 23 },
  iconWrap: {
    alignItems: "center",
    borderRadius: 13,
    height: 34,
    justifyContent: "center",
    width: 48,
  },
  inactiveLabel: { fontWeight: "500" },
  item: {
    alignItems: "center",
    flex: 1,
    gap: 3,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 2,
  },
  label: { fontSize: 11, lineHeight: 17 },
  selectedLabel: { fontWeight: "700" },
})
