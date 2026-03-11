import { FC, useCallback, useState, useEffect } from "react"
import { View, ViewStyle, TextStyle, Pressable, Platform, NativeModules, Switch } from "react-native"

import { Screen, Text, ListItem, Button, Icon } from "@/components"
import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"
import { useRfidReader } from "@/hooks/useRfidReader"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { loadString, saveString } from "@/utils/storage"
import { database } from "@/db"
import { Alert } from "react-native"

const STORAGE_KEY_POWER = "rfid_reader_power"
const POWER_MIN = 18
const POWER_MAX = 27
const POWER_DEFAULT = 18

export const SettingsScreen: FC<any> = ({ navigation }) => {
  const { themed, themeContext, setThemeContextOverride } = useAppTheme()
  const { logout, user } = useAuth()
  const { currentOrg } = useDatabase()
  const { setOutputPower, isInitialized, initialize, hasRfidHardware } = useRfidReader()

  const [readerPower, setReaderPower] = useState(POWER_DEFAULT)
  const [powerSaved, setPowerSaved] = useState(false)

  useEffect(() => {
    const saved = loadString(STORAGE_KEY_POWER)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed >= POWER_MIN && parsed <= POWER_MAX) {
        setReaderPower(parsed)
      }
    }
  }, [])

  useEffect(() => {
    if (hasRfidHardware && !isInitialized) {
      initialize()
    }
  }, [hasRfidHardware, isInitialized, initialize])

  const applyPower = useCallback(
    async (power: number) => {
      const clamped = Math.max(POWER_MIN, Math.min(POWER_MAX, power))
      setReaderPower(clamped)
      saveString(STORAGE_KEY_POWER, String(clamped))
      if (hasRfidHardware && isInitialized) {
        await setOutputPower(clamped)
      }
      setPowerSaved(true)
      setTimeout(() => setPowerSaved(false), 1500)
    },
    [hasRfidHardware, isInitialized, setOutputPower],
  )

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  const handleResetDatabase = useCallback(async () => {
    Alert.alert(
      "Reset Local Database",
      "This will delete ALL local data including your organization, animals, and records. This cannot be undone!\n\nOnly do this if you're starting fresh after wiping Supabase.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "WIPE EVERYTHING",
          style: "destructive",
          onPress: async () => {
            try {
              await database.write(async () => {
                await database.unsafeResetDatabase()
              })
              Alert.alert("Success", "Local database reset! Please restart the app.")
            } catch (error) {
              Alert.alert("Error", `Failed to reset database: ${error}`)
            }
          },
        },
      ],
    )
  }, [])

  const powerPercent = Math.round(((readerPower - POWER_MIN) / (POWER_MAX - POWER_MIN)) * 100)

  const isDarkMode = themeContext === "dark"

  const handleToggleDarkMode = useCallback(() => {
    setThemeContextOverride(isDarkMode ? "light" : "dark")
  }, [isDarkMode, setThemeContextOverride])

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <Text preset="heading" text="Settings" style={themed($heading)} />

      <View style={themed($section)}>
        <Text preset="formLabel" text="APPEARANCE" style={themed($sectionLabel)} />
        <View style={themed($themeCard)}>
          <View style={themed($themeRow)}>
            <View style={themed($themeContent)}>
              <Icon icon={isDarkMode ? "view" : "hidden"} size={24} color={themed($themeIcon).color} />
              <View>
                <Text style={themed($themeTitle)}>Dark Mode</Text>
                <Text style={themed($themeSubtext)}>
                  {isDarkMode ? "Dark theme enabled" : "Light theme enabled"}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: "#D1D5DB", true: "#4A8C3F" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      <View style={themed($section)}>
        <Text preset="formLabel" text="ACCOUNT" style={themed($sectionLabel)} />
        <ListItem text={user?.email || "Not signed in"} bottomSeparator />
        <ListItem text={`Org: ${currentOrg?.name || "None"}`} bottomSeparator />
      </View>

      <View style={themed($section)}>
        <Text preset="formLabel" text="MANAGEMENT" style={themed($sectionLabel)} />
        <ListItem
          text="Team"
          bottomSeparator
          rightIcon="caretRight"
          onPress={() => navigation.navigate("Team")}
        />
        <ListItem
          text="Treatment Protocols"
          bottomSeparator
          rightIcon="caretRight"
          onPress={() => navigation.navigate("TreatmentProtocols")}
        />
      </View>

      {hasRfidHardware && (
        <View style={themed($section)}>
          <Text preset="formLabel" text="RFID SCANNER" style={themed($sectionLabel)} />

          <View style={themed($rfidCard)}>
            <View style={themed($rfidStatusRow)}>
              <View style={themed($rfidStatusDot)} />
              <Text style={themed($rfidStatusText)}>Hand scanner connected</Text>
            </View>

            <Text style={themed($rfidPowerLabel)}>Reader Power</Text>
            <View style={themed($rfidPowerControl)}>
              <Pressable
                style={themed($rfidPowerButton)}
                onPress={() => applyPower(readerPower - 1)}
                disabled={readerPower <= POWER_MIN}
              >
                <Text style={themed($rfidPowerButtonText)}>-</Text>
              </Pressable>

              <View style={themed($rfidPowerDisplay)}>
                <Text style={themed($rfidPowerValue)}>{readerPower}</Text>
                <Text style={themed($rfidPowerPercent)}>{powerPercent}%</Text>
              </View>

              <Pressable
                style={themed($rfidPowerButton)}
                onPress={() => applyPower(readerPower + 1)}
                disabled={readerPower >= POWER_MAX}
              >
                <Text style={themed($rfidPowerButtonText)}>+</Text>
              </Pressable>
            </View>

            <View style={themed($rfidBarTrack)}>
              <View style={[themed($rfidBarFill), { width: `${powerPercent}%` }]} />
            </View>

            <View style={themed($rfidPresetRow)}>
              {[
                { label: "Low", value: 18 },
                { label: "Med", value: 21 },
                { label: "High", value: 24 },
                { label: "Max", value: 27 },
              ].map((preset) => (
                <Pressable
                  key={preset.label}
                  style={[
                    themed($rfidPresetChip),
                    readerPower === preset.value && themed($rfidPresetChipActive),
                  ]}
                  onPress={() => applyPower(preset.value)}
                >
                  <Text
                    style={[
                      themed($rfidPresetChipText),
                      readerPower === preset.value && themed($rfidPresetChipTextActive),
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {powerSaved && (
              <Text style={themed($rfidSavedText)}>Power set to {readerPower}</Text>
            )}

            <Text style={themed($rfidHint)}>
              Range: {POWER_MIN} (shortest) to {POWER_MAX} (longest). Higher power drains battery faster.
            </Text>
          </View>
        </View>
      )}

      <View style={themed($section)}>
        <Text preset="formLabel" text="DANGER ZONE" style={themed($dangerLabel)} />
        <View style={themed($dangerCard)}>
          <Text style={themed($dangerTitle)}>Reset Local Database</Text>
          <Text style={themed($dangerText)}>
            Wipes ALL local data. Only use if starting fresh after wiping Supabase.
          </Text>
          <Button
            text="Wipe Local Database"
            preset="filled"
            onPress={handleResetDatabase}
            style={themed($dangerButton)}
          />
        </View>
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

// --- RFID styles ---

const $rfidCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
})

const $rfidStatusRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.md,
})

const $rfidStatusDot: ThemedStyle<ViewStyle> = () => ({
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: "#4A8C3F",
})

const $rfidStatusText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.palette.primary600,
})

const $rfidPowerLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 13,
  fontWeight: "600",
  color: colors.textDim,
  marginBottom: spacing.xs,
  textTransform: "uppercase",
  letterSpacing: 0.5,
})

const $rfidPowerControl: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.md,
  marginBottom: spacing.sm,
})

const $rfidPowerButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: colors.palette.neutral200,
  alignItems: "center",
  justifyContent: "center",
})

const $rfidPowerButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 24,
  fontWeight: "700",
  color: colors.text,
  lineHeight: 28,
})

const $rfidPowerDisplay: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  minWidth: 80,
})

const $rfidPowerValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 36,
  fontWeight: "800",
  color: colors.text,
  lineHeight: 40,
})

const $rfidPowerPercent: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  color: colors.textDim,
  fontWeight: "500",
})

const $rfidBarTrack: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.palette.neutral200,
  marginBottom: spacing.md,
  overflow: "hidden",
})

const $rfidBarFill: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: "100%",
  borderRadius: 4,
  backgroundColor: colors.palette.primary500,
})

const $rfidPresetRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $rfidPresetChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  paddingVertical: spacing.xs,
  borderRadius: 8,
  borderWidth: 1.5,
  borderColor: colors.palette.neutral300,
  alignItems: "center",
})

const $rfidPresetChipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $rfidPresetChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  fontWeight: "600",
  color: colors.palette.neutral500,
})

const $rfidPresetChipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
})

const $rfidSavedText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 13,
  fontWeight: "600",
  color: colors.palette.primary500,
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $rfidHint: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.textDim,
  lineHeight: 18,
})

const $rfidDisabledCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderRadius: 12,
  padding: spacing.md,
  opacity: 0.6,
})

const $rfidDisabledTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.textDim,
  marginBottom: spacing.xs,
})

const $rfidDisabledText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
  lineHeight: 20,
})

// --- DANGER ZONE styles ---

const $dangerLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  color: "#E53E3E",
  marginBottom: spacing.xs,
  letterSpacing: 1,
})

const $dangerCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: "#FFF5F5",
  borderRadius: 12,
  borderWidth: 2,
  borderColor: "#FEB2B2",
  padding: spacing.md,
})

const $dangerTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 16,
  fontWeight: "700",
  color: "#E53E3E",
  marginBottom: spacing.xs,
})

const $dangerText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 14,
  color: "#9B2C2C",
  lineHeight: 20,
  marginBottom: spacing.md,
})

const $dangerButton: ThemedStyle<ViewStyle> = () => ({
  backgroundColor: "#E53E3E",
})

// --- THEME / DARK MODE styles ---

const $themeCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
})

const $themeRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $themeContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
  flex: 1,
})

const $themeIcon: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
})

const $themeTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
})

const $themeSubtext: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  color: colors.textDim,
  marginTop: 2,
})
