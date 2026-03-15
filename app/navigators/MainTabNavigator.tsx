import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { TextStyle, ViewStyle, View, Platform } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { DashboardScreen } from "@/screens/DashboardScreen"
import { HerdListScreen } from "@/screens/HerdListScreen"
import { ChuteScreen } from "@/screens/ChuteScreen"
import { PasturesScreen } from "@/screens/PasturesScreen"
import { CalendarScreen } from "@/screens/CalendarScreen"
import { SettingsScreen } from "@/screens/SettingsScreen"
import { useAppTheme } from "@/theme/context"

import type { MainTabParamList } from "./navigationTypes"

const Tab = createBottomTabNavigator<MainTabParamList>()

export const MainTabNavigator = () => {
  const {
    theme: { colors },
  } = useAppTheme()

  const renderTabIcon = (iconName: keyof typeof MaterialCommunityIcons.glyphMap, focused: boolean, color: string) => {
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
        <MaterialCommunityIcons name={iconName} size={focused ? 26 : 24} color={color} />
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
          tabBarIcon: ({ color, focused }) => renderTabIcon("view-dashboard-outline", focused, color),
        }}
      />
      <Tab.Screen
        name="HerdList"
        component={HerdListScreen}
        options={{
          tabBarLabel: "Herd",
          tabBarIcon: ({ color, focused }) => renderTabIcon("cow", focused, color),
        }}
      />
      <Tab.Screen
        name="Chute"
        component={ChuteScreen}
        options={{
          tabBarLabel: "Chute",
          tabBarIcon: ({ color, focused }) => renderTabIcon("gate-arrow-right", focused, color),
        }}
      />
      <Tab.Screen
        name="Pastures"
        component={PasturesScreen}
        options={{
          tabBarLabel: "Pastures",
          tabBarIcon: ({ color, focused }) => renderTabIcon("grass", focused, color),
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
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, focused }) => renderTabIcon("cog-outline", focused, color),
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

const $iconContainer: ViewStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
}
