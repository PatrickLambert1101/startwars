import { type ComponentProps, type FC, useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Q } from "@nozbe/watermelondb"
import { useIsFocused } from "@react-navigation/native"
import { formatDistanceToNow } from "date-fns"
import { useTranslation } from "react-i18next"

import {
  AnimalPicker,
  AppHeader,
  Button,
  FriendlyEmpty,
  HerdInsightsCard,
  ScanTagButton,
  Screen,
  Text,
} from "@/components"
import { RfidLoadingAnimation } from "@/components/RfidLoadingAnimation"
import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"
import { useSyncContext } from "@/context/SyncContext"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { Organization } from "@/db/models/Organization"
import { OrganizationMember } from "@/db/models/OrganizationMember"
import { useDashboardActivity } from "@/hooks/useDashboardActivity"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useAllPastureActivities } from "@/hooks/usePastureActivities"
import { usePastures } from "@/hooks/usePastures"
import { usePendingInvites } from "@/hooks/usePendingInvites"
import { useRfidReader } from "@/hooks/useRfidReader"
import { usePendingVaccinations } from "@/hooks/useVaccinationSchedules"
import { MainTabScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { DashboardActivityItem } from "@/utils/dashboardActivity"
import { getPastureMapStatus } from "@/utils/pastureMapStatus"

type AnimalQuickAction = "treatment" | "breeding"

const ACTIVITY_ICONS: Record<
  DashboardActivityItem["kind"],
  ComponentProps<typeof MaterialCommunityIcons>["name"]
> = {
  health: "medical-bag",
  breeding: "heart-outline",
  movement: "swap-horizontal",
  pasture: "grass",
}

export const DashboardScreen: FC<MainTabScreenProps<"Dashboard">> = ({ navigation }) => {
  const { t } = useTranslation()
  const isFocused = useIsFocused()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const { stats, isLoading: statsLoading } = useDashboardStats()
  const { activities: recentActivity, isLoading: activityLoading } = useDashboardActivity()
  const { pastures, isLoading: pasturesLoading } = usePastures()
  const { activities: pastureActivities, isLoading: pastureActivitiesLoading } =
    useAllPastureActivities()
  const { currentOrg, isOrgLoading, switchOrganization, leaveOrganization } = useDatabase()
  const { status: syncStatus, lastSynced, error: syncError, sync } = useSyncContext()
  const { user } = useAuth()
  const { invites: pendingInvites, accept: acceptInvite } = usePendingInvites()
  const { vaccinations: pendingVaccinations, isLoading: vaccinationsLoading } =
    usePendingVaccinations()
  const [showFarmPicker, setShowFarmPicker] = useState(false)
  const [showRfidScanModal, setShowRfidScanModal] = useState(false)
  const [userOrgs, setUserOrgs] = useState<Organization[]>([])
  const [animalQuickAction, setAnimalQuickAction] = useState<AnimalQuickAction | null>(null)
  const {
    hasRfidHardware,
    isInitialized: isRfidInitialized,
    isScanning: isRfidScanning,
    scannedTag,
    initialize: initializeRfid,
    clearScannedTag,
  } = useRfidReader()
  // True from tapping Accept until the joined farm has synced down and become
  // currentOrg — keeps the cow loader up instead of flashing the setup card.
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false)

  useEffect(() => {
    if (hasRfidHardware && !isRfidInitialized) initializeRfid()
  }, [hasRfidHardware, initializeRfid, isRfidInitialized])

  // Load all organizations the user is a member of
  useEffect(() => {
    if (!user) return

    const loadUserOrgs = async () => {
      const memberships = await database
        .get<OrganizationMember>("organization_members")
        .query(Q.where("user_id", user.id), Q.where("is_active", true))
        .fetch()

      const orgIds = memberships.map((m) => m.organizationId)

      const orgs = await database
        .get<Organization>("organizations")
        .query(Q.where("id", Q.oneOf(orgIds)), Q.where("is_deleted", false))
        .fetch()

      setUserOrgs(orgs)
    }

    loadUserOrgs()
  }, [user, currentOrg])

  const handleSetupOrg = useCallback(() => {
    navigation.navigate("OrgSetup")
  }, [navigation])

  const handleActiveAnimalsPress = useCallback(() => {
    navigation.navigate("HerdList", {
      statuses: ["active"],
      requestId: Date.now(),
    })
  }, [navigation])

  const handleBreedingAttentionPress = useCallback(() => {
    navigation.navigate("Breeding", {
      initialFilter: "attention",
      requestId: Date.now(),
    })
  }, [navigation])

  const handlePasturesPress = useCallback(() => {
    navigation.navigate("Pastures")
  }, [navigation])

  const handleDashboardScan = useCallback(
    async (tagNumber: string) => {
      if (!currentOrg) return
      const tag = tagNumber.trim()
      if (!tag) return

      try {
        const matches = await database
          .get<Animal>("animals")
          .query(
            Q.where("organization_id", currentOrg.id),
            Q.where("is_deleted", false),
            Q.or(Q.where("visual_tag", tag), Q.where("rfid_tag", tag)),
          )
          .fetch()

        if (matches[0]) {
          navigation.navigate("AnimalDetail", { animalId: matches[0].id })
        } else {
          Alert.alert("Animal not found", `No animal matches tag ${tag}.`)
        }
      } catch (scanError) {
        console.error("[Dashboard] Could not find scanned animal:", scanError)
        Alert.alert("Could not open animal", "Please try the scan again.")
      }
    },
    [currentOrg, navigation],
  )

  useEffect(() => {
    if (!scannedTag) return

    // Only an explicit Dashboard scan session should consume the hardware event.
    // Other mounted tabs and the animal picker own their own RFID flows.
    if (isFocused && showRfidScanModal && animalQuickAction === null) {
      setShowRfidScanModal(false)
      handleDashboardScan(scannedTag.epc)
    }
    clearScannedTag()
  }, [
    animalQuickAction,
    clearScannedTag,
    handleDashboardScan,
    isFocused,
    scannedTag,
    showRfidScanModal,
  ])

  const handleRfidQuickActionPress = useCallback(() => {
    clearScannedTag()
    setShowRfidScanModal(true)
  }, [clearScannedTag])

  const handleQuickAnimalSelected = useCallback(
    (animal: Animal | null) => {
      if (!animal || !animalQuickAction) return
      const action = animalQuickAction
      setAnimalQuickAction(null)
      if (action === "treatment") {
        navigation.navigate("HealthRecordForm", { animalId: animal.id })
      } else {
        navigation.navigate("BreedingRecordForm", { animalId: animal.id })
      }
    },
    [animalQuickAction, navigation],
  )

  const handleActivityPress = useCallback(
    (activity: DashboardActivityItem) => {
      if (activity.animalId) {
        navigation.navigate("AnimalDetail", {
          animalId: activity.animalId,
          initialTab: activity.animalTab,
        })
      } else if (activity.pastureId) {
        navigation.navigate("PastureDetail", { pastureId: activity.pastureId })
      }
    },
    [navigation],
  )

  const handleSwitchFarm = useCallback(
    async (orgId: string) => {
      await switchOrganization(orgId)
      setShowFarmPicker(false)
    },
    [switchOrganization],
  )

  const handleCreateNewFarm = useCallback(() => {
    setShowFarmPicker(false)
    navigation.navigate("OrgSetup")
  }, [navigation])

  const handleAcceptInvite = useCallback(
    async (inviteId: string) => {
      setIsAcceptingInvite(true)
      const result = await acceptInvite(inviteId)
      if (!result.success) {
        setIsAcceptingInvite(false)
        Alert.alert(t("dashboardScreen.pendingInvite.errorTitle"), result.error || "")
      }
      // On success, keep the loader up; the effect below clears it once the
      // joined farm has synced down and become currentOrg.
    },
    [acceptInvite, t],
  )

  // Clear the accepting state once the joined farm is available.
  useEffect(() => {
    if (currentOrg && isAcceptingInvite) {
      setIsAcceptingInvite(false)
    }
  }, [currentOrg, isAcceptingInvite])

  const handleLeaveFarm = useCallback(
    (orgId: string, orgName: string) => {
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
    },
    [leaveOrganization, t],
  )

  const handleViewVaccinations = useCallback(() => {
    navigation.navigate("PendingVaccinations", { initialFilter: "attention" })
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
    dueToday: pendingVaccinations.filter((v) => {
      const days = v.daysUntilDue
      return days === 0
    }).length,
    dueSoon: pendingVaccinations.filter((v) => {
      const days = v.daysUntilDue
      return days > 0 && days <= 7
    }).length,
    overdue: pendingVaccinations.filter((v) => v.isOverdue).length,
  }
  const vaccinationsNeedingAttention =
    vaccinationCounts.overdue + vaccinationCounts.dueToday + vaccinationCounts.dueSoon

  const pastureAlerts = useMemo(() => {
    const latestTickByPasture = new Map<string, number | null>()
    for (const activity of pastureActivities) {
      if (
        activity.activityType === "tick_observation" &&
        !latestTickByPasture.has(activity.pastureId)
      ) {
        latestTickByPasture.set(activity.pastureId, activity.tickLoadScore)
      }
    }

    return pastures
      .map((pasture) => ({
        pasture,
        status: getPastureMapStatus(pasture, latestTickByPasture.get(pasture.id) ?? null),
      }))
      .filter(
        ({ status }) =>
          status.level === "red" || (status.level === "amber" && status.label !== "Resting"),
      )
      .sort((left, right) => {
        const rank = { red: 0, amber: 1, grey: 2, green: 3 }
        return rank[left.status.level] - rank[right.status.level]
      })
  }, [pastureActivities, pastures])

  const occupiedPastureCount = pastures.filter((pasture) => pasture.isOccupied).length
  const upcomingCalvings = stats.dueToCalve - stats.overdueCalvings
  const allCaughtUp =
    !statsLoading &&
    !pasturesLoading &&
    !pastureActivitiesLoading &&
    !vaccinationsLoading &&
    stats.dueToCalve === 0 &&
    vaccinationsNeedingAttention === 0 &&
    pastureAlerts.length === 0

  const syncStatusText =
    syncStatus === "syncing"
      ? "Syncing farm data…"
      : syncStatus === "error"
        ? "Sync needs attention — tap to retry"
        : lastSynced
          ? `Last synced ${formatDistanceToNow(lastSynced, { addSuffix: true })}`
          : "Waiting for first sync"
  const syncIcon =
    syncStatus === "syncing"
      ? "sync"
      : syncStatus === "error"
        ? "cloud-alert"
        : "cloud-check-outline"

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
          <Text text={t("dashboardScreen.setupCard.subtitle")} style={themed($dimText)} />
          <Button
            text={t("dashboardScreen.setupCard.button")}
            preset="reversed"
            onPress={handleSetupOrg}
          />
        </View>
      ) : (
        <>
          <View style={themed($farmCard)}>
            <Pressable
              onPress={() => setShowFarmPicker(true)}
              style={themed($farmSwitcher)}
              accessibilityRole="button"
              accessibilityLabel="Switch farm"
            >
              <View>
                <Text text={t("dashboardScreen.currentFarm")} size="xs" style={themed($dimText)} />
                <Text text={currentOrg.name} preset="bold" />
              </View>
              <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textDim} />
            </Pressable>
            <Pressable
              onPress={() => void sync()}
              disabled={syncStatus === "syncing"}
              style={themed($syncRow)}
              accessibilityRole="button"
              accessibilityLabel={syncStatusText}
            >
              {syncStatus === "syncing" ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <MaterialCommunityIcons
                  name={syncIcon}
                  size={18}
                  color={syncStatus === "error" ? colors.error : colors.textDim}
                />
              )}
              <View style={themed($syncText)}>
                <Text
                  text={syncStatusText}
                  size="xs"
                  style={syncStatus === "error" ? { color: colors.error } : themed($dimText)}
                />
                {syncStatus === "error" && syncError ? (
                  <Text text={syncError} size="xxs" numberOfLines={1} style={themed($dimText)} />
                ) : null}
              </View>
            </Pressable>
          </View>

          <View style={themed($section)}>
            <View style={themed($sectionHeader)}>
              <Text preset="subheading" text="Needs attention" />
              {(statsLoading ||
                pasturesLoading ||
                pastureActivitiesLoading ||
                vaccinationsLoading) && <ActivityIndicator size="small" color={colors.tint} />}
            </View>

            {allCaughtUp && (
              <View style={themed($caughtUpCard)}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={24}
                  color={colors.palette.primary500}
                />
                <View style={themed($alertText)}>
                  <Text preset="bold" text="Nothing urgent right now" />
                  <Text
                    text="Calving, vaccination and pasture alerts are all clear."
                    size="xs"
                    style={themed($dimText)}
                  />
                </View>
              </View>
            )}

            {stats.dueToCalve > 0 && (
              <Pressable
                onPress={handleBreedingAttentionPress}
                style={themed($calvingCard)}
                accessibilityRole="button"
              >
                <View style={themed($alertIcon)}>
                  <MaterialCommunityIcons name="cow" size={24} color={colors.tint} />
                </View>
                <View style={themed($alertText)}>
                  <Text
                    preset="bold"
                    text={`${stats.dueToCalve} expected calving${
                      stats.dueToCalve === 1 ? "" : "s"
                    } need attention`}
                  />
                  <Text
                    text={
                      stats.overdueCalvings > 0 && upcomingCalvings > 0
                        ? `${stats.overdueCalvings} overdue · ${upcomingCalvings} due within 60 days`
                        : stats.overdueCalvings > 0
                          ? `${stats.overdueCalvings} overdue`
                          : "Due within the next 60 days"
                    }
                    size="xs"
                    style={themed($dimText)}
                  />
                </View>
                <MaterialCommunityIcons name="chevron-right" size={21} color={colors.tint} />
              </Pressable>
            )}

            {vaccinationsNeedingAttention > 0 && (
              <Pressable onPress={handleViewVaccinations} style={themed($vaccinationCard)}>
                <View style={themed($vaccinationHeader)}>
                  <MaterialCommunityIcons
                    name="needle"
                    size={24}
                    color={colors.palette.accent500}
                  />
                  <Text
                    preset="subheading"
                    text={`${vaccinationsNeedingAttention} vaccination${
                      vaccinationsNeedingAttention === 1 ? "" : "s"
                    } due`}
                    style={themed($vaccinationTitle)}
                  />
                </View>
                <View style={themed($vaccinationCounts)}>
                  {vaccinationCounts.overdue > 0 && (
                    <View style={themed($vaccinationBadge($vaccinationBadgeError))}>
                      <Text style={themed($vaccinationBadgeText)}>
                        {vaccinationCounts.overdue} {t("dashboardScreen.vaccinations.overdue")}
                      </Text>
                    </View>
                  )}
                  {vaccinationCounts.dueToday > 0 && (
                    <View style={themed($vaccinationBadge($vaccinationBadgeWarning))}>
                      <Text style={themed($vaccinationBadgeText)}>
                        {vaccinationCounts.dueToday} {t("dashboardScreen.vaccinations.dueToday")}
                      </Text>
                    </View>
                  )}
                  {vaccinationCounts.dueSoon > 0 && (
                    <View style={themed($vaccinationBadge($vaccinationBadgeInfo))}>
                      <Text style={themed($vaccinationBadgeText)}>
                        {vaccinationCounts.dueSoon} {t("dashboardScreen.vaccinations.dueSoon")}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={themed($vaccinationFooter)}>
                  <Text text="Review due vaccinations" style={themed($vaccinationLink)} />
                  <MaterialCommunityIcons name="chevron-right" size={16} color={colors.tint} />
                </View>
              </Pressable>
            )}

            {pastureAlerts.length > 0 && (
              <View style={themed($pastureAlertCard)}>
                <Pressable onPress={handlePasturesPress} style={themed($pastureAlertHeader)}>
                  <View style={themed($pastureHeaderTitle)}>
                    <MaterialCommunityIcons name="grass" size={24} color={colors.error} />
                    <Text
                      preset="subheading"
                      text={`${pastureAlerts.length} pasture alert${
                        pastureAlerts.length === 1 ? "" : "s"
                      }`}
                    />
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={21} color={colors.tint} />
                </Pressable>
                {pastureAlerts.slice(0, 3).map(({ pasture, status }) => (
                  <Pressable
                    key={pasture.id}
                    onPress={() => navigation.navigate("PastureDetail", { pastureId: pasture.id })}
                    style={themed($pastureAlertRow)}
                  >
                    <View
                      style={[
                        themed($alertDot),
                        {
                          backgroundColor:
                            status.level === "red" ? colors.error : colors.palette.accent500,
                        },
                      ]}
                    />
                    <View style={themed($alertText)}>
                      <Text text={pasture.name} preset="bold" size="sm" />
                      <Text
                        text={`${status.label} · ${status.reason}`}
                        size="xs"
                        style={themed($dimText)}
                      />
                    </View>
                  </Pressable>
                ))}
                {pastureAlerts.length > 3 && (
                  <Text
                    text={`+ ${pastureAlerts.length - 3} more pasture alerts`}
                    size="xs"
                    style={themed($moreAlerts)}
                  />
                )}
              </View>
            )}
          </View>

          <View style={themed($section)}>
            <Text preset="subheading" text="Herd snapshot" />
            <View style={themed($statsRow)}>
              <Pressable onPress={handleActiveAnimalsPress} style={themed($statCard)}>
                {statsLoading ? (
                  <ActivityIndicator color={colors.tint} />
                ) : (
                  <Text
                    preset="subheading"
                    text={String(stats.activeCount)}
                    style={themed($statNumber)}
                  />
                )}
                <Text preset="formHelper" text="Active animals" />
              </Pressable>
              <Pressable onPress={handlePasturesPress} style={themed($statCard)}>
                {statsLoading ? (
                  <ActivityIndicator color={colors.tint} />
                ) : (
                  <Text
                    preset="subheading"
                    text={String(stats.assignedToPastureCount)}
                    style={themed($statNumber)}
                  />
                )}
                <Text preset="formHelper" text="In pastures" />
              </Pressable>
              <Pressable onPress={handlePasturesPress} style={themed($statCard)}>
                {pasturesLoading ? (
                  <ActivityIndicator color={colors.tint} />
                ) : (
                  <Text
                    preset="subheading"
                    text={String(occupiedPastureCount)}
                    style={themed($statNumber)}
                  />
                )}
                <Text preset="formHelper" text="Occupied" />
              </Pressable>
            </View>
          </View>

          <View style={themed($section)}>
            <HerdInsightsCard />
          </View>

          <View style={themed($section)}>
            <Text preset="subheading" text="Quick actions" />
            <View style={themed($quickActionGrid)}>
              {hasRfidHardware ? (
                <Pressable
                  onPress={handleRfidQuickActionPress}
                  style={[
                    themed($quickActionButton),
                    { backgroundColor: colors.tint, borderColor: colors.tint },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Scan cow with RFID"
                >
                  {isRfidScanning ? (
                    <ActivityIndicator size="small" color={colors.palette.neutral100} />
                  ) : (
                    <MaterialCommunityIcons
                      name="access-point"
                      size={23}
                      color={colors.palette.neutral100}
                    />
                  )}
                  <Text
                    text={isRfidScanning ? "Scanning for RFID…" : "Scan cow with RFID"}
                    preset="bold"
                    size="sm"
                    style={themed($primaryQuickActionText)}
                  />
                </Pressable>
              ) : (
                <ScanTagButton
                  label="Scan cow"
                  onTagScanned={handleDashboardScan}
                  style={[
                    themed($quickActionButton),
                    { backgroundColor: colors.tint, borderColor: colors.tint },
                  ]}
                />
              )}
              <Pressable
                onPress={() => setAnimalQuickAction("treatment")}
                style={themed($quickActionButton)}
              >
                <MaterialCommunityIcons name="medical-bag" size={23} color={colors.tint} />
                <Text text="Record treatment" preset="bold" size="sm" />
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate("MovementForm", {})}
                style={themed($quickActionButton)}
              >
                <MaterialCommunityIcons name="swap-horizontal" size={25} color={colors.tint} />
                <Text text="Move animals" preset="bold" size="sm" />
              </Pressable>
              <Pressable
                onPress={() => setAnimalQuickAction("breeding")}
                style={themed($quickActionButton)}
              >
                <MaterialCommunityIcons name="heart-plus-outline" size={23} color={colors.tint} />
                <Text text="Record breeding" preset="bold" size="sm" />
              </Pressable>
            </View>
          </View>

          <View style={themed($section)}>
            <Text preset="subheading" text="Recent farm activity" />
            {activityLoading ? (
              <View style={themed($activityLoading)}>
                <ActivityIndicator color={colors.tint} />
                <Text text="Loading recent activity…" size="xs" style={themed($dimText)} />
              </View>
            ) : recentActivity.length === 0 ? (
              <View style={themed($activityEmpty)}>
                <MaterialCommunityIcons name="history" size={22} color={colors.textDim} />
                <Text
                  text="Treatments, breeding, movements and pasture work will appear here."
                  size="xs"
                  style={themed($dimText)}
                />
              </View>
            ) : (
              recentActivity.map((activity) => (
                <Pressable
                  key={activity.id}
                  onPress={() => handleActivityPress(activity)}
                  style={themed($activityItem)}
                >
                  <View style={themed($activityIcon)}>
                    <MaterialCommunityIcons
                      name={ACTIVITY_ICONS[activity.kind]}
                      size={20}
                      color={colors.tint}
                    />
                  </View>
                  <View style={themed($activityContent)}>
                    <View style={themed($activityTitleRow)}>
                      <Text text={activity.title} preset="bold" size="sm" style={$flexText} />
                      <Text
                        text={formatDistanceToNow(activity.occurredAt, { addSuffix: true })}
                        size="xxs"
                        style={themed($dimText)}
                      />
                    </View>
                    {activity.detail ? (
                      <Text
                        text={activity.detail}
                        size="xs"
                        numberOfLines={2}
                        style={themed($dimText)}
                      />
                    ) : null}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDim} />
                </Pressable>
              ))
            )}
          </View>

          <Pressable onPress={() => navigation.navigate("Reports")} style={themed($reportsCard)}>
            <View style={themed($reportsHeader)}>
              <MaterialCommunityIcons name="chart-bar" size={24} color={colors.tint} />
              <Text
                preset="bold"
                text={t("dashboardScreen.reports.title")}
                size="md"
                style={$reportsTitle}
              />
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.tint} />
            </View>
            <Text
              text={t("dashboardScreen.reports.description")}
              size="xs"
              style={themed($dimText)}
            />
          </Pressable>
        </>
      )}

      <AnimalPicker
        visible={animalQuickAction !== null}
        onClose={() => setAnimalQuickAction(null)}
        onSelect={handleQuickAnimalSelected}
        filterSex={animalQuickAction === "breeding" ? "female" : undefined}
        title={
          animalQuickAction === "breeding"
            ? "Choose female to breed"
            : "Choose animal for treatment"
        }
        allowClear={false}
      />

      <Modal
        visible={showRfidScanModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRfidScanModal(false)}
      >
        <Pressable style={themed($modalOverlay)} onPress={() => setShowRfidScanModal(false)}>
          <Pressable style={themed($rfidScanModal)} onPress={(event) => event.stopPropagation()}>
            <View style={themed($rfidScanIcon)}>
              {isRfidScanning ? (
                <ActivityIndicator size="large" color={colors.tint} />
              ) : (
                <MaterialCommunityIcons name="access-point" size={42} color={colors.tint} />
              )}
            </View>
            <Text preset="subheading" text="Scan cow with RFID" />
            <Text
              text={isRfidScanning ? "Scanning for RFID…" : "Pull and hold the trigger to scan"}
              preset="bold"
              size="md"
              style={themed($rfidScanInstruction)}
            />
            <Text
              text="The matching cow will open automatically."
              size="xs"
              style={themed($rfidScanHelp)}
            />
            <Button
              text="Cancel"
              preset="default"
              onPress={() => setShowRfidScanModal(false)}
              style={themed($rfidScanCancel)}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Farm Picker Modal */}
      <Modal
        visible={showFarmPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFarmPicker(false)}
      >
        <Pressable style={themed($modalOverlay)} onPress={() => setShowFarmPicker(false)}>
          <Pressable style={themed($modalContent)} onPress={(e) => e.stopPropagation()}>
            <Text
              preset="subheading"
              text={t("dashboardScreen.switchFarm")}
              style={themed($modalTitle)}
            />

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
                    <Text
                      text={t("dashboardScreen.createNewFarm")}
                      style={{ color: colors.tint }}
                    />
                  </Pressable>
                </>
              }
            />

            <Button
              text={t("common.cancel")}
              onPress={() => setShowFarmPicker(false)}
              style={themed($cancelButton)}
            />
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

const $sectionHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})

const $farmCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  marginBottom: spacing.xs,
  overflow: "hidden",
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $farmSwitcher: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.sm,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $syncRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderTopWidth: 1,
  borderTopColor: colors.separator,
})

const $syncText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $caughtUpCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.sm,
  borderRadius: 12,
  backgroundColor: colors.palette.primary100,
})

const $calvingCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.sm,
  borderRadius: 12,
  borderLeftWidth: 3,
  borderLeftColor: colors.tint,
  backgroundColor: colors.palette.primary100,
})

const $alertIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.background,
})

const $alertText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $pastureAlertCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.sm,
  borderRadius: 12,
  borderLeftWidth: 3,
  borderLeftColor: colors.error,
  backgroundColor: colors.errorBackground,
})

const $pastureAlertHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.xs,
})

const $pastureHeaderTitle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $pastureAlertRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  paddingVertical: spacing.xs,
  borderTopWidth: 1,
  borderTopColor: colors.separator,
})

const $alertDot: ThemedStyle<ViewStyle> = () => ({
  width: 9,
  height: 9,
  borderRadius: 5,
})

const $moreAlerts: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  fontWeight: "600",
  marginTop: spacing.xs,
  textAlign: "right",
})

const $quickActionGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $quickActionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "48.5%",
  minHeight: 58,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.xs,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.sm,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.palette.neutral100,
})

const $primaryQuickActionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  flexShrink: 1,
  textAlign: "center",
})

const $activityLoading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
})

const $activityEmpty: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
  borderRadius: 12,
  backgroundColor: colors.palette.neutral100,
})

const $activityItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.sm,
  borderRadius: 12,
  backgroundColor: colors.palette.neutral100,
})

const $activityIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 38,
  height: 38,
  borderRadius: 19,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.primary100,
})

const $activityContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $activityTitleRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.xs,
})

const $flexText: TextStyle = {
  flex: 1,
}

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

const $rfidScanModal: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  backgroundColor: colors.background,
  borderRadius: 20,
  maxWidth: 360,
  padding: spacing.xl,
  width: "100%",
})

const $rfidScanIcon: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  backgroundColor: colors.palette.primary100,
  borderRadius: 42,
  height: 84,
  justifyContent: "center",
  marginBottom: spacing.md,
  width: 84,
})

const $rfidScanInstruction: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginTop: spacing.md,
  textAlign: "center",
})

const $rfidScanHelp: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xs,
  textAlign: "center",
})

const $rfidScanCancel: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignSelf: "stretch",
  marginTop: spacing.lg,
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
  marginTop: spacing.md,
  marginBottom: spacing.sm,
  borderLeftWidth: 3,
  borderLeftColor: colors.tint,
})

const $reportsHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8,
})

const $reportsTitle: TextStyle = {
  flex: 1,
  marginLeft: 12,
}

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

const $vaccinationBadge =
  (badgeStyle: ThemedStyle<ViewStyle>): ThemedStyle<ViewStyle> =>
  (theme) => ({
    ...badgeStyle(theme),
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xxs,
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
