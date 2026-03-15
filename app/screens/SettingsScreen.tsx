import { FC, useCallback, useState, useEffect } from "react"
import { View, ViewStyle, TextStyle, Pressable, Switch, Alert } from "react-native"
import { useTranslation } from "react-i18next"
import { Q } from "@nozbe/watermelondb"

import { Screen, Text, ListItem, Button, Icon } from "@/components"
import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"
import { useSubscription } from "@/context/SubscriptionContext"
import { useRfidReader } from "@/hooks/useRfidReader"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { loadString, saveString } from "@/utils/storage"
import { database } from "@/db"
import { seedDefaultSchedules } from "@/services/defaultSchedules"
import { calculateScheduledVaccinations } from "@/services/vaccinationScheduler"

const STORAGE_KEY_POWER = "rfid_reader_power"
const POWER_MIN = 18
const POWER_MAX = 27
const POWER_DEFAULT = 18

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu" },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa" },
]

export const SettingsScreen: FC<any> = ({ navigation }) => {
  const { themed, themeContext, setThemeContextOverride } = useAppTheme()
  const { logout, user } = useAuth()
  const { currentOrg } = useDatabase()
  const { plan, isPremium, isLoading } = useSubscription()
  const { setOutputPower, isInitialized, initialize, hasRfidHardware } = useRfidReader()
  const { i18n, t } = useTranslation()

  const [readerPower, setReaderPower] = useState(POWER_DEFAULT)
  const [powerSaved, setPowerSaved] = useState(false)
  const [hasSchedules, setHasSchedules] = useState(false)

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

  // Check if schedules exist
  useEffect(() => {
    if (!currentOrg) {
      setHasSchedules(false)
      return
    }

    const checkSchedules = async () => {
      const schedules = await database
        .get("vaccination_schedules")
        .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
        .fetch()
      setHasSchedules(schedules.length > 0)
    }

    checkSchedules()

    // Subscribe to changes
    const subscription = database
      .get("vaccination_schedules")
      .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
      .observe()
      .subscribe((schedules) => {
        setHasSchedules(schedules.length > 0)
      })

    return () => subscription.unsubscribe()
  }, [currentOrg])

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

  const handleSeedDefaultSchedules = useCallback(async () => {
    if (!currentOrg) {
      Alert.alert("No Organization", "Please create an organization first")
      return
    }

    Alert.alert(
      "Seed Default Schedules",
      "This will create default South African cattle vaccination schedules and protocols for your farm. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add Schedules",
          onPress: async () => {
            try {
              const success = await seedDefaultSchedules(currentOrg.id)
              if (success) {
                // After seeding, calculate vaccinations for existing animals
                console.log("[Settings] Calculating vaccinations for existing animals...")
                await calculateScheduledVaccinations(currentOrg.id)
                Alert.alert(
                  "Success!",
                  "Default vaccination schedules have been added! Vaccinations have been calculated for your existing animals. Check the Calendar tab to see upcoming vaccinations."
                )
              } else {
                Alert.alert("Error", "Failed to seed default schedules. Check console for details.")
              }
            } catch (error) {
              console.error("Error seeding schedules:", error)
              Alert.alert("Error", "An error occurred while adding schedules")
            }
          },
        },
      ],
    )
  }, [currentOrg])

  const handleRecalculateVaccinations = useCallback(async () => {
    if (!currentOrg) {
      Alert.alert("No Organization", "Please create an organization first")
      return
    }

    Alert.alert(
      "Recalculate Vaccinations",
      "This will recalculate all pending vaccinations based on your active schedules and current animals. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Recalculate",
          onPress: async () => {
            try {
              await calculateScheduledVaccinations(currentOrg.id)
              Alert.alert("Success!", "Vaccinations have been recalculated. Check the Calendar tab to see upcoming vaccinations.")
            } catch (error) {
              console.error("Error calculating vaccinations:", error)
              Alert.alert("Error", "An error occurred while calculating vaccinations")
            }
          },
        },
      ],
    )
  }, [currentOrg])

  const handleResetDatabase = useCallback(async () => {
    Alert.alert(
      t("settingsScreen.dangerZone.alerts.confirmTitle"),
      t("settingsScreen.dangerZone.alerts.confirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settingsScreen.dangerZone.alerts.wipeButton"),
          style: "destructive",
          onPress: async () => {
            try {
              await database.write(async () => {
                await database.unsafeResetDatabase()
              })
              Alert.alert(t("settingsScreen.dangerZone.alerts.successTitle"), t("settingsScreen.dangerZone.alerts.successMessage"))
            } catch (error) {
              Alert.alert(t("settingsScreen.dangerZone.alerts.errorTitle"), t("settingsScreen.dangerZone.alerts.errorMessage", { error }))
            }
          },
        },
      ],
    )
  }, [t])

  const powerPercent = Math.round(((readerPower - POWER_MIN) / (POWER_MAX - POWER_MIN)) * 100)

  const isDarkMode = themeContext === "dark"

  const handleToggleDarkMode = useCallback(() => {
    setThemeContextOverride(isDarkMode ? "light" : "dark")
  }, [isDarkMode, setThemeContextOverride])

  const handleChangeLanguage = useCallback(
    (languageCode: string) => {
      i18n.changeLanguage(languageCode)
      saveString("app_language", languageCode)
    },
    [i18n],
  )

  const currentLanguage = LANGUAGES.find((lang) => lang.code === i18n.language?.split("-")[0]) || LANGUAGES[0]

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <Text preset="heading" text={t("settingsScreen.title")} style={themed($heading)} />

      <View style={themed($section)}>
        <Text preset="formLabel" text={t("settingsScreen.sections.appearance")} style={themed($sectionLabel)} />
        <View style={themed($themeCard)}>
          <View style={themed($themeRow)}>
            <View style={themed($themeContent)}>
              <Icon icon={isDarkMode ? "view" : "hidden"} size={24} color={themed($themeIcon).color} />
              <View>
                <Text style={themed($themeTitle)}>{t("settingsScreen.appearance.darkMode")}</Text>
                <Text style={themed($themeSubtext)}>
                  {isDarkMode ? t("settingsScreen.appearance.darkThemeEnabled") : t("settingsScreen.appearance.lightThemeEnabled")}
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
        <Text preset="formLabel" text={t("settingsScreen.sections.language")} style={themed($sectionLabel)} />
        <View style={themed($languageCard)}>
          <Text style={themed($languageTitle)}>{t("settingsScreen.language.appLanguage")}</Text>
          <Text style={themed($languageSubtext)}>{t("settingsScreen.language.current", { language: currentLanguage.nativeName })}</Text>
          <View style={themed($languageGrid)}>
            {LANGUAGES.map((lang) => {
              const isActive = lang.code === currentLanguage.code
              return (
                <Pressable
                  key={lang.code}
                  style={[themed($languageChip), isActive && themed($languageChipActive)]}
                  onPress={() => handleChangeLanguage(lang.code)}
                >
                  <Text style={[themed($languageChipText), isActive && themed($languageChipTextActive)]}>
                    {lang.nativeName}
                  </Text>
                  <Text style={[themed($languageChipSubtext), isActive && themed($languageChipSubtextActive)]}>
                    {lang.name}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      </View>

      <View style={themed($section)}>
        <Text preset="formLabel" text={t("settingsScreen.sections.account")} style={themed($sectionLabel)} />
        <ListItem text={user?.email || t("settingsScreen.account.notSignedIn")} bottomSeparator />
        <ListItem text={t("settingsScreen.account.org", { orgName: currentOrg?.name || t("settingsScreen.account.noOrg") })} bottomSeparator />
      </View>

      <View style={themed($section)}>
        <Text preset="formLabel" text={t("settingsScreen.sections.subscription")} style={themed($sectionLabel)} />
        <View style={themed($subscriptionCard)}>
          <View style={themed($subscriptionHeader)}>
            <View>
              <Text style={themed($subscriptionPlan)}>
                {plan === "commercial" ? t("settingsScreen.subscription.plans.commercial") : plan === "farm" ? t("settingsScreen.subscription.plans.farm") : t("settingsScreen.subscription.plans.starter")}
              </Text>
              <Text style={themed($subscriptionStatus)}>
                {isLoading
                  ? t("settingsScreen.subscription.status.loading")
                  : plan === "commercial"
                  ? t("settingsScreen.subscription.status.commercialAccess")
                  : plan === "farm"
                  ? t("settingsScreen.subscription.status.farmAccess")
                  : t("settingsScreen.subscription.status.freeTier")}
              </Text>
            </View>
            {isPremium && (
              <View style={themed($proBadge)}>
                <Text style={themed($proBadgeText)}>
                  {plan === "commercial" ? t("settingsScreen.subscription.badges.com") : t("settingsScreen.subscription.badges.farm")}
                </Text>
              </View>
            )}
          </View>

          {plan === "commercial" ? (
            <>
              <Text style={themed($subscriptionDescription)}>
                {t("settingsScreen.subscription.descriptions.commercial")}
              </Text>
              <Button
                text={t("settingsScreen.subscription.buttons.manageSubscription")}
                preset="default"
                onPress={() => navigation.navigate("CustomerCenter")}
                style={themed($subscriptionButton)}
              />
            </>
          ) : plan === "farm" ? (
            <>
              <Text style={themed($subscriptionDescription)}>
                {t("settingsScreen.subscription.descriptions.farm")}
              </Text>
              <Button
                text={t("settingsScreen.subscription.buttons.manageSubscription")}
                preset="default"
                onPress={() => navigation.navigate("CustomerCenter")}
                style={themed($subscriptionButton)}
              />
            </>
          ) : (
            <>
              <Text style={themed($subscriptionDescription)}>
                {t("settingsScreen.subscription.descriptions.starter")}
              </Text>
              <Button
                text={t("settingsScreen.subscription.buttons.viewPlans")}
                preset="filled"
                onPress={() => navigation.navigate("Paywall")}
                style={themed($subscriptionButton)}
              />
            </>
          )}
        </View>
      </View>

      <View style={themed($section)}>
        <Text preset="formLabel" text={t("settingsScreen.sections.management")} style={themed($sectionLabel)} />
        <ListItem
          text={t("settingsScreen.management.team")}
          bottomSeparator
          rightIcon="caretRight"
          onPress={() => navigation.navigate("Team")}
        />
        <ListItem
          text={t("settingsScreen.management.treatmentProtocols")}
          bottomSeparator
          rightIcon="caretRight"
          onPress={() => navigation.navigate("TreatmentProtocols")}
        />
        <ListItem
          text={t("settingsScreen.management.vaccinationSchedules")}
          bottomSeparator
          rightIcon="caretRight"
          onPress={() => navigation.navigate("VaccinationSchedules")}
        />

        {hasSchedules && (
          <View style={themed($recalculateCard)}>
            <Text style={themed($recalculateTitle)}>Recalculate Vaccinations</Text>
            <Text style={themed($recalculateText)}>
              Calculate upcoming vaccinations for all animals based on active schedules. Run this after adding new animals or modifying schedules.
            </Text>
            <Button
              text="Recalculate Now"
              preset="default"
              onPress={handleRecalculateVaccinations}
              style={themed($recalculateButton)}
            />
          </View>
        )}

        {currentOrg?.livestockTypes.includes("cattle") && !hasSchedules && (
          <View style={themed($seedCard)}>
            <Text style={themed($seedTitle)}>Add Default Vaccination Schedules</Text>
            <Text style={themed($seedText)}>
              Add standard South African cattle vaccination schedules (FMD, Multivax, Brucellosis, LSD, BVD, Botulism) to your farm
            </Text>
            <Button
              text="Add Default Schedules"
              preset="default"
              onPress={handleSeedDefaultSchedules}
              style={themed($seedButton)}
            />
          </View>
        )}
      </View>

      {hasRfidHardware && (
        <View style={themed($section)}>
          <Text preset="formLabel" text={t("settingsScreen.sections.rfidScanner")} style={themed($sectionLabel)} />

          <View style={themed($rfidCard)}>
            <View style={themed($rfidStatusRow)}>
              <View style={themed($rfidStatusDot)} />
              <Text style={themed($rfidStatusText)}>{t("settingsScreen.rfid.connected")}</Text>
            </View>

            <Text style={themed($rfidPowerLabel)}>{t("settingsScreen.rfid.readerPower")}</Text>
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
                { label: t("settingsScreen.rfid.presets.low"), value: 18 },
                { label: t("settingsScreen.rfid.presets.med"), value: 21 },
                { label: t("settingsScreen.rfid.presets.high"), value: 24 },
                { label: t("settingsScreen.rfid.presets.max"), value: 27 },
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
              <Text style={themed($rfidSavedText)}>{t("settingsScreen.rfid.powerSaved", { power: readerPower })}</Text>
            )}

            <Text style={themed($rfidHint)}>
              {t("settingsScreen.rfid.rangeHint", { min: POWER_MIN, max: POWER_MAX })}
            </Text>
          </View>
        </View>
      )}

      <View style={themed($section)}>
        <Text preset="formLabel" text={t("settingsScreen.sections.dangerZone")} style={themed($dangerLabel)} />
        <View style={themed($dangerCard)}>
          <Text style={themed($dangerTitle)}>{t("settingsScreen.dangerZone.resetTitle")}</Text>
          <Text style={themed($dangerText)}>
            {t("settingsScreen.dangerZone.resetDescription")}
          </Text>
          <Button
            text={t("settingsScreen.dangerZone.resetButton")}
            preset="filled"
            onPress={handleResetDatabase}
            style={themed($dangerButton)}
          />
        </View>
      </View>

      <Button text={t("settingsScreen.signOut")} preset="default" onPress={handleLogout} style={themed($logoutButton)} />

      <Text preset="formHelper" text={t("settingsScreen.version")} style={themed($version)} />
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

// --- RECALCULATE VACCINATIONS styles ---

const $recalculateCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: colors.palette.primary300,
  padding: spacing.md,
  marginTop: spacing.sm,
})

const $recalculateTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "700",
  color: colors.text,
  marginBottom: spacing.xs,
})

const $recalculateText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.textDim,
  lineHeight: 20,
  marginBottom: spacing.sm,
})

const $recalculateButton: ThemedStyle<ViewStyle> = () => ({
  marginTop: 8,
})

// --- SEED SCHEDULES styles ---

const $seedCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.accent100,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: colors.palette.accent300,
  padding: spacing.md,
  marginTop: spacing.sm,
})

const $seedTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "700",
  color: colors.text,
  marginBottom: spacing.xs,
})

const $seedText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.textDim,
  lineHeight: 20,
  marginBottom: spacing.sm,
})

const $seedButton: ThemedStyle<ViewStyle> = () => ({
  marginTop: 8,
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

// --- LANGUAGE styles ---

const $languageCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
})

const $languageTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.xxs,
})

const $languageSubtext: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 13,
  color: colors.textDim,
  marginBottom: spacing.md,
})

const $languageGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
})

const $languageChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  minWidth: "48%",
  padding: spacing.sm,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.background,
  alignItems: "center",
})

const $languageChipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $languageChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 15,
  fontWeight: "600",
  color: colors.text,
})

const $languageChipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
})

const $languageChipSubtext: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.textDim,
  marginTop: 2,
})

const $languageChipSubtextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
})

// --- SUBSCRIPTION styles ---

const $subscriptionCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $subscriptionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: spacing.sm,
})

const $subscriptionPlan: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  fontWeight: "700",
  color: colors.text,
})

const $subscriptionStatus: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  color: colors.textDim,
  marginTop: 2,
})

const $proBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary500,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 6,
})

const $proBadgeText: ThemedStyle<TextStyle> = () => ({
  fontSize: 11,
  fontWeight: "700",
  color: "#FFFFFF",
  letterSpacing: 1,
})

const $subscriptionDescription: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.textDim,
  lineHeight: 20,
  marginBottom: spacing.md,
})

const $subscriptionButton: ThemedStyle<ViewStyle> = () => ({
  marginTop: 0,
})
