import { FC, useCallback, useState, useEffect } from "react"
import { Pressable, View, ViewStyle, TextStyle, Modal, FlatList, Alert } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Q } from "@nozbe/watermelondb"
import { useTranslation } from "react-i18next"

import { Screen, Text, Button, AppHeader, FriendlyEmpty } from "@/components"
import { RfidLoadingAnimation } from "@/components/RfidLoadingAnimation"
import { usePendingInvites } from "@/hooks/usePendingInvites"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useDatabase } from "@/context/DatabaseContext"
import { useSyncContext } from "@/context/SyncContext"
import { useAuth } from "@/context/AuthContext"
import { usePendingVaccinations } from "@/hooks/useVaccinationSchedules"
import { MainTabScreenProps } from "@/navigators/navigationTypes"
import { database } from "@/db"
import { Organization } from "@/db/models/Organization"
import { OrganizationMember } from "@/db/models/OrganizationMember"

export const DashboardScreen: FC<MainTabScreenProps<"Dashboard">> = ({ navigation }) => {
  const { t } = useTranslation()
  const { themed, theme: { colors } } = useAppTheme()
  const { stats } = useDashboardStats()
  const { currentOrg, isOrgLoading, switchOrganization, leaveOrganization } = useDatabase()
  const { status: syncStatus, lastSynced } = useSyncContext()
  const { user } = useAuth()
  const { invites: pendingInvites, accept: acceptInvite } = usePendingInvites()
  const { vaccinations: pendingVaccinations } = usePendingVaccinations()
  const [showFarmPicker, setShowFarmPicker] = useState(false)
  const [userOrgs, setUserOrgs] = useState<Organization[]>([])
  // True from tapping Accept until the joined farm has synced down and become
  // currentOrg — keeps the cow loader up instead of flashing the setup card.
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false)

  // Load all organizations the user is a member of
  useEffect(() => {
    if (!user) return

    const loadUserOrgs = async () => {
      const memberships = await database.get<OrganizationMember>("organization_members")
        .query(
          Q.where("user_id", user.id),
          Q.where("is_active", true)
        )
        .fetch()

      const orgIds = memberships.map(m => m.organizationId)

      const orgs = await database.get<Organization>("organizations")
        .query(
          Q.where("id", Q.oneOf(orgIds)),
          Q.where("is_deleted", false)
        )
        .fetch()

      setUserOrgs(orgs)
    }

    loadUserOrgs()
  }, [user, currentOrg])

  const handleSetupOrg = useCallback(() => {
    navigation.navigate("OrgSetup")
  }, [navigation])

  const handleAnimalPress = useCallback((animalId: string) => {
    navigation.navigate("AnimalDetail", { animalId })
  }, [navigation])

  const handleSwitchFarm = useCallback(async (orgId: string) => {
    await switchOrganization(orgId)
    setShowFarmPicker(false)
  }, [switchOrganization])

  const handleCreateNewFarm = useCallback(() => {
    setShowFarmPicker(false)
    navigation.navigate("OrgSetup")
  }, [navigation])

  const handleAcceptInvite = useCallback(async (inviteId: string) => {
    setIsAcceptingInvite(true)
    const result = await acceptInvite(inviteId)
    if (!result.success) {
      setIsAcceptingInvite(false)
      Alert.alert(t("dashboardScreen.pendingInvite.errorTitle"), result.error || "")
    }
    // On success, keep the loader up; the effect below clears it once the
    // joined farm has synced down and become currentOrg.
  }, [acceptInvite, t])

  // Clear the accepting state once the joined farm is available.
  useEffect(() => {
    if (currentOrg && isAcceptingInvite) {
      setIsAcceptingInvite(false)
    }
  }, [currentOrg, isAcceptingInvite])

  const handleLeaveFarm = useCallback((orgId: string, orgName: string) => {
    Alert.alert(
      t("dashboardScreen.leaveFarmConfirm.title"),
      t("dashboardScreen.leaveFarmConfirm.message", { farm: orgName }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("dashboardScreen.leaveFarm"),
          style: "destructive",
          onPress: async () => {
            const result = await leaveOrganization(orgId)
            if (!result.success) {
              const msg =
                result.error === "last_admin"
                  ? t("dashboardScreen.leaveFarmLastAdmin")
                  : result.error || ""
              Alert.alert(t("dashboardScreen.leaveFarmConfirm.title"), msg)
            } else {
              setShowFarmPicker(false)
            }
          },
        },
      ],
    )
  }, [leaveOrganization, t])

  const handleViewVaccinations = useCallback(() => {
    navigation.navigate("PendingVaccinations")
  }, [navigation])

  // True while we can't yet be sure whether the user has any farms: the org
  // query is still running, the first sync hasn't finished pulling data down
  // (lastSynced is null and we're not in an error state), a sync is active, or
  // the user just accepted an invite and the joined farm is still syncing in.
  const orgResolving =
    isOrgLoading ||
    isAcceptingInvite ||
    syncStatus === "syncing" ||
    (lastSynced === null && syncStatus !== "error")

  // Calculate vaccination urgency counts
  const vaccinationCounts = {
    dueToday: pendingVaccinations.filter(v => {
      const days = v.daysUntilDue
      return days >= 0 && days <= 0
    }).length,
    dueSoon: pendingVaccinations.filter(v => {
      const days = v.daysUntilDue
      return days > 0 && days <= 7
    }).length,
    overdue: pendingVaccinations.filter(v => v.isOverdue).length,
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <AppHeader title={t("dashboardScreen.title")} showSettings={true} />

      {/* Pending farm invites, matched by the signed-in user's email. */}
      {pendingInvites.map((invite) => (
        <FriendlyEmpty
          key={invite.id}
          icon="email-outline"
          heading={t("dashboardScreen.pendingInvite.title")}
          content={t("dashboardScreen.pendingInvite.subtitle", {
            farm: invite.organizationName,
            role: t(`dashboardScreen.pendingInvite.role.${invite.role}`),
          })}
          buttonText={t("dashboardScreen.pendingInvite.accept")}
          onButtonPress={() => handleAcceptInvite(invite.id)}
          style={themed($inviteCard)}
        />
      ))}

      {!currentOrg && orgResolving ? (
        // Right after login, memberships/farms are still syncing down from the
        // server. Show the cow loader instead of the "set up a farm" card so a
        // user who already has farms doesn't briefly see a false empty state.
        <View style={themed($loadingCard)}>
          <RfidLoadingAnimation size={140} />
          <Text text={t("dashboardScreen.loadingFarms")} style={themed($dimText)} />
        </View>
      ) : !currentOrg ? (
        <View style={themed($setupCard)}>
          <Text preset="subheading" text={t("dashboardScreen.setupCard.title")} />
          <Text
            text={t("dashboardScreen.setupCard.subtitle")}
            style={themed($dimText)}
          />
          <Button text={t("dashboardScreen.setupCard.button")} preset="reversed" onPress={handleSetupOrg} />
        </View>
      ) : (
        <>
          {/* Farm Switcher */}
          <Pressable onPress={() => setShowFarmPicker(true)} style={themed($farmSwitcher)}>
            <View>
              <Text text={t("dashboardScreen.currentFarm")} size="xs" style={themed($dimText)} />
              <Text text={currentOrg.name} preset="bold" />
            </View>
            <Text text="▼" size="sm" style={themed($dimText)} />
          </Pressable>

          <View style={themed($statsRow)}>
            <View style={themed($statCard)}>
              <Text preset="subheading" text={String(stats.totalHead)} style={themed($statNumber)} />
              <Text preset="formHelper" text={t("dashboardScreen.stats.totalHead")} />
            </View>
            <View style={themed($statCard)}>
              <Text preset="subheading" text={String(stats.activeCount)} style={themed($statNumber)} />
              <Text preset="formHelper" text={t("dashboardScreen.stats.active")} />
            </View>
          </View>

          <View style={themed($statsRow)}>
            <View style={themed($statCard)}>
              <Text preset="subheading" text={String(stats.dueToCalve)} style={themed($statNumber)} />
              <Text preset="formHelper" text={t("dashboardScreen.stats.dueToCalve")} />
            </View>
            <View style={themed($statCard)}>
              <Text preset="subheading" text="0" style={themed($statNumber)} />
              <Text preset="formHelper" text={t("dashboardScreen.stats.pendingSync")} />
            </View>
          </View>

          {/* Vaccination Alert Card */}
          {pendingVaccinations.length > 0 && (
            <Pressable onPress={handleViewVaccinations} style={themed($vaccinationCard)}>
              <View style={themed($vaccinationHeader)}>
                <MaterialCommunityIcons name="needle" size={24} color={colors.palette.accent500} />
                <Text preset="subheading" text={t("dashboardScreen.vaccinations.title")} style={themed($vaccinationTitle)} />
              </View>
              <View style={themed($vaccinationCounts)}>
                {vaccinationCounts.overdue > 0 && (
                  <View style={themed($vaccinationBadge($vaccinationBadgeError))}>
                    <Text style={themed($vaccinationBadgeText)}>{vaccinationCounts.overdue} {t("dashboardScreen.vaccinations.overdue")}</Text>
                  </View>
                )}
                {vaccinationCounts.dueToday > 0 && (
                  <View style={themed($vaccinationBadge($vaccinationBadgeWarning))}>
                    <Text style={themed($vaccinationBadgeText)}>{vaccinationCounts.dueToday} {t("dashboardScreen.vaccinations.dueToday")}</Text>
                  </View>
                )}
                {vaccinationCounts.dueSoon > 0 && (
                  <View style={themed($vaccinationBadge($vaccinationBadgeInfo))}>
                    <Text style={themed($vaccinationBadgeText)}>{vaccinationCounts.dueSoon} {t("dashboardScreen.vaccinations.dueSoon")}</Text>
                  </View>
                )}
              </View>
              <View style={themed($vaccinationFooter)}>
                <Text text={t("dashboardScreen.vaccinations.viewAll")} style={themed($vaccinationLink)} />
                <MaterialCommunityIcons name="chevron-right" size={16} color={colors.tint} />
              </View>
            </Pressable>
          )}

          {/* Reports Card */}
          <Pressable onPress={() => navigation.navigate("Reports")} style={themed($reportsCard)}>
            <View style={themed($reportsHeader)}>
              <MaterialCommunityIcons name="chart-bar" size={24} color={colors.tint} />
              <Text preset="bold" text={t("dashboardScreen.reports.title")} size="md" style={{ flex: 1, marginLeft: 12 }} />
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.tint} />
            </View>
            <Text text={t("dashboardScreen.reports.description")} size="xs" style={themed($dimText)} />
          </Pressable>

          <View style={themed($section)}>
            <Text preset="subheading" text={t("dashboardScreen.recentAnimals.title")} />
            {stats.recentAnimals.length === 0 ? (
              <Text
                text={t("dashboardScreen.recentAnimals.empty")}
                style={themed($dimText)}
              />
            ) : (
              stats.recentAnimals.map((a) => (
                <Pressable key={a.id} onPress={() => handleAnimalPress(a.id)} style={themed($recentItem)}>
                  <Text preset="bold" text={a.displayName} />
                  <Text size="xs" text={`${a.breed} | ${a.sex}`} style={themed($dimText)} />
                </Pressable>
              ))
            )}
          </View>
        </>
      )}

      {/* Farm Picker Modal */}
      <Modal
        visible={showFarmPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFarmPicker(false)}
      >
        <Pressable style={themed($modalOverlay)} onPress={() => setShowFarmPicker(false)}>
          <Pressable style={themed($modalContent)} onPress={(e) => e.stopPropagation()}>
            <Text preset="subheading" text={t("dashboardScreen.switchFarm")} style={themed($modalTitle)} />

            <FlatList
              data={userOrgs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={themed($farmOption)}>
                  <Pressable
                    onPress={() => handleSwitchFarm(item.id)}
                    style={themed($farmOptionMain)}
                  >
                    <Text text={item.name} preset="bold" />
                    {item.id === currentOrg?.id && (
                      <MaterialCommunityIcons name="check" size={20} color={colors.tint} />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => handleLeaveFarm(item.id, item.name)}
                    hitSlop={8}
                    style={themed($leaveButton)}
                    accessibilityLabel={t("dashboardScreen.leaveFarm")}
                  >
                    <MaterialCommunityIcons name="exit-to-app" size={20} color={colors.error} />
                  </Pressable>
                </View>
              )}
              ListFooterComponent={
                <>
                  <View style={themed($divider)} />
                  <Pressable onPress={handleCreateNewFarm} style={themed($farmOption)}>
                    <Text text={t("dashboardScreen.createNewFarm")} style={{ color: colors.tint }} />
                  </Pressable>
                </>
              }
            />

            <Button text={t("common.cancel")} onPress={() => setShowFarmPicker(false)} style={themed($cancelButton)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingBottom: spacing.lg,
})

const $setupCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginTop: spacing.sm,
  gap: spacing.xs,
})

const $loadingCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.xxl,
  gap: spacing.sm,
})

const $statsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.xs,
})

const $statCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.sm,
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
})

const $statNumber: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 28,
  fontWeight: "700",
  lineHeight: 32,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  gap: spacing.xs,
})

const $recentItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.xs,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $farmSwitcher: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.sm,
  marginBottom: spacing.sm,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
})

const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  padding: spacing.lg,
  width: "100%",
  maxHeight: "80%",
})

const $modalTitle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $farmOption: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 10,
  padding: spacing.md,
  marginBottom: spacing.xs,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $farmOptionMain: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: spacing.xs,
})

const $leaveButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingLeft: spacing.md,
})

const $inviteCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  marginTop: spacing.sm,
})

const $divider: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 1,
  backgroundColor: colors.separator,
  marginVertical: spacing.sm,
})

const $cancelButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $reportsCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 12,
  padding: spacing.sm,
  marginBottom: spacing.sm,
  borderLeftWidth: 3,
  borderLeftColor: colors.tint,
})

const $reportsHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8,
})

const $vaccinationCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.accent100,
  borderRadius: 12,
  padding: spacing.sm,
  marginBottom: spacing.sm,
  borderLeftWidth: 3,
  borderLeftColor: colors.palette.accent500,
})

const $vaccinationHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: spacing.xs,
})

const $vaccinationTitle: ThemedStyle<TextStyle> = () => ({
  flex: 1,
})

const $vaccinationCounts: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xxs,
  marginBottom: spacing.xs,
})

const $vaccinationBadge = (badgeStyle: ThemedStyle<ViewStyle>): ThemedStyle<ViewStyle> => ({ spacing, colors }) => ({
  ...badgeStyle({ spacing, colors }),
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  borderRadius: 8,
})

const $vaccinationBadgeError: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.errorBackground,
})

const $vaccinationBadgeWarning: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.accent200,
})

const $vaccinationBadgeInfo: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
})

const $vaccinationBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 11,
  fontWeight: "600",
  color: colors.text,
})

const $vaccinationFooter: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  justifyContent: "flex-end",
})

const $vaccinationLink: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.tint,
})
