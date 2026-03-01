import { FC, useCallback } from "react"
import { View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, ListItem, Button } from "@/components"
import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const SettingsScreen: FC = () => {
  const { themed } = useAppTheme()
  const { logout, user } = useAuth()
  const { currentOrg } = useDatabase()

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <Text preset="heading" text="Settings" style={themed($heading)} />

      <View style={themed($section)}>
        <Text preset="formLabel" text="ACCOUNT" style={themed($sectionLabel)} />
        <ListItem text={user?.email || "Not signed in"} bottomSeparator />
        <ListItem text={`Org: ${currentOrg?.name || "None"}`} bottomSeparator />
        <ListItem text="Organization" bottomSeparator rightIcon="caretRight" />
        <ListItem text="Team Members" bottomSeparator rightIcon="caretRight" />
      </View>

      <View style={themed($section)}>
        <Text preset="formLabel" text="SYNC" style={themed($sectionLabel)} />
        <ListItem text="Sync Status" bottomSeparator rightIcon="caretRight" />
        <ListItem text="Last synced: Never" bottomSeparator />
      </View>

      <View style={themed($section)}>
        <Text preset="formLabel" text="APP" style={themed($sectionLabel)} />
        <ListItem text="Appearance" bottomSeparator rightIcon="caretRight" />
        <ListItem text="Units (kg/lbs)" bottomSeparator rightIcon="caretRight" />
        <ListItem text="RFID Scanner Setup" bottomSeparator rightIcon="caretRight" />
      </View>

      <View style={themed($section)}>
        <Text preset="formLabel" text="DATA" style={themed($sectionLabel)} />
        <ListItem text="Export Data (CSV)" bottomSeparator rightIcon="caretRight" />
        <ListItem text="Import Data" bottomSeparator rightIcon="caretRight" />
      </View>

      <Button text="Sign Out" preset="default" onPress={handleLogout} style={themed($logoutButton)} />

      <Text preset="formHelper" text="HerdTrackr v0.1.0" style={themed($version)} />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.lg,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $sectionLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.xs,
  letterSpacing: 1,
})

const $logoutButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $version: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginTop: spacing.xl,
})
