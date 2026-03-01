import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { TextStyle, ViewStyle } from "react-native"

import { Icon } from "@/components"
import { DashboardScreen } from "@/screens/DashboardScreen"
import { HerdListScreen } from "@/screens/HerdListScreen"
import { ChuteScreen } from "@/screens/ChuteScreen"
import { ReportsScreen } from "@/screens/ReportsScreen"
import { SettingsScreen } from "@/screens/SettingsScreen"
import { useAppTheme } from "@/theme/context"

import type { MainTabParamList } from "./navigationTypes"

const Tab = createBottomTabNavigator<MainTabParamList>()

export const MainTabNavigator = () => {
  const {
    theme: { colors, spacing },
  } = useAppTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [$tabBar, { borderTopColor: colors.separator, backgroundColor: colors.background }],
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
          tabBarIcon: ({ focused, color }) => (
            <Icon icon="components" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="HerdList"
        component={HerdListScreen}
        options={{
          tabBarLabel: "Herd",
          tabBarIcon: ({ focused, color }) => (
            <Icon icon="community" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="Chute"
        component={ChuteScreen}
        options={{
          tabBarLabel: "Chute",
          tabBarIcon: ({ focused, color }) => (
            <Icon icon="view" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: "Reports",
          tabBarIcon: ({ focused, color }) => (
            <Icon icon="debug" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ focused, color }) => (
            <Icon icon="settings" color={color} size={24} />
          ),
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
  fontWeight: "500",
  lineHeight: 16,
}
