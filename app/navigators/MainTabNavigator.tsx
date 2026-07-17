import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { TextStyle, ViewStyle, View, Image, ImageStyle, Platform } from "react-native"

import { DashboardScreen } from "@/screens/DashboardScreen"
import { HerdListScreen } from "@/screens/HerdListScreen"
import { ChuteScreen } from "@/screens/ChuteScreen"
import { PasturesScreen } from "@/screens/PasturesScreen"
import { CalendarScreen } from "@/screens/CalendarScreen"
import { BreedingScreen } from "@/screens/BreedingScreen"
import { useAppTheme } from "@/theme/context"

import type { MainTabParamList } from "./navigationTypes"

const Tab = createBottomTabNavigator<MainTabParamList>()

// Branded tab silhouettes. require() must be static literals for Metro. These
// are alpha-clean PNGs rendered as masks via Image tintColor, so they recolour
// by active/inactive state exactly like the old icon font did.
const TAB_ICONS = {
  dashboard: require("../assets/icons/tab/dashboard.png"),
  herd: require("../assets/icons/tab/herd.png"),
  chute: require("../assets/icons/tab/chute.png"),
  pastures: require("../assets/icons/tab/pastures.png"),
  calendar: require("../assets/icons/tab/calendar.png"),
  breeding: require("../assets/icons/tab/breeding.png"),
} as const

export const MainTabNavigator = () => {
  const {
    theme: { colors },
  } = useAppTheme()

  const renderTabIcon = (icon: keyof typeof TAB_ICONS, focused: boolean, color: string) => {
    return (
      <View
        style={[
          $iconContainer,
          focused && {
            backgroundColor: colors.tint + '15',
            transform: [{ scale: 1.05 }],
          },
        ]}
      >
        <Image
          source={TAB_ICONS[icon]}
          style={[$tabIcon, { tintColor: color, width: focused ? 26 : 24, height: focused ? 26 : 24 }]}
          resizeMode="contain"
        />
      </View>
    )
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [$tabBar, {
          borderTopColor: colors.separator,
          backgroundColor: colors.background,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }],
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: $tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => renderTabIcon("dashboard", focused, color),
        }}
      />
      <Tab.Screen
        name="HerdList"
        component={HerdListScreen}
        options={{
          tabBarLabel: "Herd",
          tabBarIcon: ({ color, focused }) => renderTabIcon("herd", focused, color),
        }}
      />
      <Tab.Screen
        name="Chute"
        component={ChuteScreen}
        options={{
          tabBarLabel: "Chute",
          tabBarIcon: ({ color, focused }) => renderTabIcon("chute", focused, color),
        }}
      />
      <Tab.Screen
        name="Pastures"
        component={PasturesScreen}
        options={{
          tabBarLabel: "Pastures",
          tabBarIcon: ({ color, focused }) => renderTabIcon("pastures", focused, color),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: "Calendar",
          tabBarIcon: ({ color, focused }) => renderTabIcon("calendar", focused, color),
        }}
      />
      <Tab.Screen
        name="Breeding"
        component={BreedingScreen}
        options={{
          tabBarLabel: "Breeding",
          tabBarIcon: ({ color, focused }) => renderTabIcon("breeding", focused, color),
        }}
      />
    </Tab.Navigator>
  )
}

const $tabBar: ViewStyle = {
  borderTopWidth: 1,
}

const $tabBarLabel: TextStyle = {
  fontSize: 11,
  fontWeight: "600",
  lineHeight: 16,
}

const $tabIcon: ImageStyle = {
  width: 24,
  height: 24,
}

const $iconContainer: ViewStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
}
