import { FC, useCallback, useState, useEffect } from "react"
import { View, ViewStyle, TextStyle, Pressable, Alert, Switch } from "react-native"
import * as LocalAuthentication from "expo-local-authentication"
import { Q } from "@nozbe/watermelondb"
import * as Sentry from "@sentry/react-native"
import { useTranslation } from "react-i18next"

import { Screen, Text, ListItem, Button, Icon, BIOMETRIC_LOCK_KEY } from "@/components"
import { RfidScannerSettings } from "@/components/RfidScannerSettings"
import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"
import { useSubscription } from "@/context/SubscriptionContext"
import { database } from "@/db"
import { useSync } from "@/hooks/useSync"
import { seedDefaultSchedules } from "@/services/defaultSchedules"
import { calculateScheduledVaccinations } from "@/services/vaccinationScheduler"
import { bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { loadString, saveString } from "@/utils/storage"

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu" },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa" },
  { code: "nso", name: "Sepedi", nativeName: "Sepedi" },
]

export const SettingsScreen: FC<any> = ({ navigation }) => {
  // themeContext/setThemeContextOverride dropped with the dark-mode toggle;
  // restore them here if the APPEARANCE section comes back.
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const { logout, user } = useAuth()
  const { currentOrg } = useDatabase()
  const { plan, isPremium, isLoading } = useSubscription()
  const { sync, status } = useSync()
  const { i18n, t } = useTranslation()

  const [hasSchedules, setHasSchedules] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(
    () => loadString(BIOMETRIC_LOCK_KEY) === "true",
  )

  useEffect(() => {
    Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()])
      .then(([hasHardware, isEnrolled]) => setBiometricAvailable(hasHardware && isEnrolled))
      .catch(() => setBiometricAvailable(false))
  }, [])

  const handleToggleBiometricLock = useCallback(
    async (value: boolean) => {
      // Confirm identity before changing the lock, so someone else holding the
      // unlocked phone can't quietly turn it off.
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("biometricLock.prompt"),
      })
      if (!result.success) return
      setBiometricEnabled(value)
      saveString(BIOMETRIC_LOCK_KEY, String(value))
    },
    [t],
  )

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
                  "Default vaccination schedules have been added! Vaccinations have been calculated for your existing animals. Check the Calendar tab to see upcoming vaccinations.",
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
              Alert.alert(
                "Success!",
                "Vaccinations have been recalculated. Check the Calendar tab to see upcoming vaccinations.",
              )
            } catch (error) {
              console.error("Error calculating vaccinations:", error)
              Alert.alert("Error", "An error occurred while calculating vaccinations")
            }
          },
        },
      ],
    )
  }, [currentOrg])

  const handleForceFullSync = useCallback(async () => {
    Alert.alert(
      "Force Full Sync",
      "This will clear the sync timestamp and re-download all data from Supabase. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Full Sync",
          onPress: async () => {
            try {
              // Clear the last sync timestamp to force a full sync
              // Use the database adapter's removeLocal to clear WatermelonDB's sync timestamp
              console.log("[Settings] Clearing WatermelonDB sync timestamp...")
              await database.adapter.removeLocal("__watermelon_last_pulled_at")
              console.log("[Settings] Sync timestamp cleared! Triggering full sync...")

              // Trigger sync
              console.log("[Settings] Calling sync()...")
              const result = await sync()
              console.log("[Settings] Sync result:", result)

              if (result.success) {
                Alert.alert("Success", "Full sync completed successfully!")
              } else {
                Alert.alert("Error", result.error || "Sync failed")
              }
            } catch (error) {
              console.error("[Settings] Force sync error:", error)
              Alert.alert("Error", "Failed to sync: " + (error as Error).message)
            }
          },
        },
      ],
    )
  }, [sync])

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
              Alert.alert(
                t("settingsScreen.dangerZone.alerts.successTitle"),
                t("settingsScreen.dangerZone.alerts.successMessage"),
              )
            } catch (error) {
              Alert.alert(
                t("settingsScreen.dangerZone.alerts.errorTitle"),
                t("settingsScreen.dangerZone.alerts.errorMessage", { error }),
              )
            }
          },
        },
      ],
    )
  }, [t])

  const handleTestSentry = useCallback(() => {
    try {
      console.log("[DEBUG] Testing Sentry integration...")

      // Add a breadcrumb
      Sentry.addBreadcrumb({
        category: "debug",
        message: "User triggered test error from Settings",
        level: "info",
      })

      // Capture a test message
      Sentry.captureMessage("Test message from Settings screen", "info")

      // Throw a test error
      throw new Error("Test error from Settings screen - Sentry integration test")
    } catch (error) {
      // Capture the error
      Sentry.captureException(error)
      console.log("[DEBUG] Test error captured and sent to Sentry")
      Alert.alert(
        "Test Sent!",
        "A test error has been sent to Sentry. Check your Sentry dashboard in a few moments.",
      )
    }
  }, [])

  const handleChangeLanguage = useCallback(
    (languageCode: string) => {
      i18n.changeLanguage(languageCode)
      saveString("app_language", languageCode)
    },
    [i18n],
  )

  const currentLanguage =
    LANGUAGES.find((lang) => lang.code === i18n.language?.split("-")[0]) || LANGUAGES[0]

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($headerRow)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <Icon icon="caretLeft" size={24} color={themed($backIcon).color} />
        </Pressable>
        <Text preset="heading" text={t("settingsScreen.title")} style={themed($heading)} />
        <View style={themed($backButtonPlaceholder)} />
      </View>

      <RfidScannerSettings />

      {/* APPEARANCE / dark mode toggle intentionally hidden — the app is
          light-only for now and the theme is pinned to light in
          app/theme/context.tsx. Re-enable both together. */}

      <View style={themed($section)}>
        <Text
          preset="formLabel"
          text={t("settingsScreen.sections.language")}
          style={themed($sectionLabel)}
        />
        <View style={themed($languageCard)}>
          <Text style={themed($languageTitle)}>{t("settingsScreen.language.appLanguage")}</Text>
          <Text style={themed($languageSubtext)}>
            {t("settingsScreen.language.current", { language: currentLanguage.nativeName })}
          </Text>
          <View style={themed($languageGrid)}>
            {LANGUAGES.map((lang) => {
              const isActive = lang.code === currentLanguage.code
              return (
                <Pressable
                  key={lang.code}
                  style={[themed($languageChip), isActive && themed($languageChipActive)]}
                  onPress={() => handleChangeLanguage(lang.code)}
                >
                  <Text
                    style={[themed($languageChipText), isActive && themed($languageChipTextActive)]}
                  >
                    {lang.nativeName}
                  </Text>
                  <Text
                    style={[
                      themed($languageChipSubtext),
                      isActive && themed($languageChipSubtextActive),
                    ]}
                  >
                    {lang.name}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      </View>

      <View style={themed($section)}>
        <Text
          preset="formLabel"
          text={t("settingsScreen.sections.account")}
          style={themed($sectionLabel)}
        />
        <ListItem text={user?.email || t("settingsScreen.account.notSignedIn")} bottomSeparator />
        <ListItem
          text={t("settingsScreen.account.org", {
            orgName: currentOrg?.name || t("settingsScreen.account.noOrg"),
          })}
          bottomSeparator
        />
        {biometricAvailable && (
          <View style={themed($appLockRow)}>
            <View style={themed($appLockText)}>
              <Text text={t("settingsScreen.account.appLock")} />
              <Text
                size="xxs"
                style={themed($appLockHint)}
                text={t("settingsScreen.account.appLockHint")}
              />
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometricLock}
              trackColor={{ false: "#D1D5DB", true: colors.palette.primary500 }}
              thumbColor="#FFFFFF"
            />
          </View>
        )}
      </View>

      <View style={themed($section)}>
        <Text
          preset="formLabel"
          text={t("settingsScreen.sections.subscription")}
          style={themed($sectionLabel)}
        />
        <View style={themed($subscriptionCard)}>
          <View style={themed($subscriptionHeader)}>
            <View>
              <Text style={themed($subscriptionPlan)}>
                {plan === "commercial"
                  ? t("settingsScreen.subscription.plans.commercial")
                  : plan === "farm"
                    ? t("settingsScreen.subscription.plans.farm")
                    : t("settingsScreen.subscription.plans.starter")}
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
                  {plan === "commercial"
                    ? t("settingsScreen.subscription.badges.com")
                    : t("settingsScreen.subscription.badges.farm")}
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
        <Text
          preset="formLabel"
          text={t("settingsScreen.sections.management")}
          style={themed($sectionLabel)}
        />
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
        <ListItem
          text="Import CSV or Excel data"
          bottomSeparator
          rightIcon="caretRight"
          onPress={() => navigation.navigate("DataImports")}
        />

        {hasSchedules && (
          <View style={themed($recalculateCard)}>
            <Text style={themed($recalculateTitle)}>Recalculate Vaccinations</Text>
            <Text style={themed($recalculateText)}>
              Calculate upcoming vaccinations for all animals based on active schedules. Run this
              after adding new animals or modifying schedules.
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
              Add standard South African cattle vaccination schedules (FMD, Multivax, Brucellosis,
              LSD, BVD, Botulism) to your farm
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

      <View style={themed($section)}>
        <Text preset="formLabel" text="Sync" style={themed($sectionLabel)} />
        <View style={themed($seedCard)}>
          <Text style={themed($seedText)}>
            ✅ Auto-sync is active! Your data syncs automatically when you make changes, when the
            app opens, and every 5 minutes.
          </Text>
        </View>
        {__DEV__ && (
          <View style={themed($seedCard)}>
            <Text style={themed($seedTitle)}>Force Full Sync</Text>
            <Text style={themed($seedText)}>
              Only use this if data is missing or out of sync. This will re-download all data from
              the server.
            </Text>
            <Button
              text={status === "syncing" ? "Syncing..." : "Force Full Sync"}
              preset="default"
              onPress={handleForceFullSync}
              disabled={status === "syncing"}
              style={themed($seedButton)}
            />
          </View>
        )}
      </View>

      {__DEV__ && (
        <View style={themed($section)}>
          <Text preset="formLabel" text="DEBUG & TESTING" style={themed($sectionLabel)} />
          <View style={themed($seedCard)}>
            <Text style={themed($seedTitle)}>Test Sentry Integration</Text>
            <Text style={themed($seedText)}>
              Send a test error to Sentry to verify logging is working. This will create a test
              event in your Sentry dashboard.
            </Text>
            <Button
              text="Test Sentry"
              preset="default"
              onPress={handleTestSentry}
              style={themed($seedButton)}
            />
          </View>
        </View>
      )}

      {__DEV__ && (
        <View style={themed($section)}>
          <Text
            preset="formLabel"
            text={t("settingsScreen.sections.dangerZone")}
            style={themed($dangerLabel)}
          />
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
      )}

      <Button
        text={t("settingsScreen.signOut")}
        preset="default"
        onPress={handleLogout}
        style={themed($logoutButton)}
      />

      <Text preset="formHelper" text={t("settingsScreen.version")} style={themed($version)} />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $headerRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: spacing.md,
  marginBottom: spacing.lg,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
  marginLeft: -spacing.xs,
})

const $backIcon: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $backButtonPlaceholder: ThemedStyle<ViewStyle> = () => ({
  width: 40,
})

const $heading: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  textAlign: "center",
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $sectionLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.xs,
  letterSpacing: 1,
})

const $appLockRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: spacing.sm,
})

const $appLockText: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  marginRight: spacing.md,
})

const $appLockHint: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $logoutButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $version: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginTop: spacing.xl,
})

// --- RECALCULATE VACCINATIONS styles ---

const $recalculateCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: bentoRadii.card,
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
  borderRadius: bentoRadii.card,
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
  borderRadius: bentoRadii.card,
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
  borderRadius: bentoRadii.card,
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
  borderRadius: bentoRadii.card,
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
  borderRadius: bentoRadii.card,
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
