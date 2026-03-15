import { FC, useCallback, useState, useEffect } from "react"
import { Pressable, View, ViewStyle, TextStyle, Modal, FlatList } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Q } from "@nozbe/watermelondb"
import { useTranslation } from "react-i18next"

import { Screen, Text, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useDatabase } from "@/context/DatabaseContext"
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
  const { currentOrg, switchOrganization } = useDatabase()
  const { user } = useAuth()
  const { vaccinations: pendingVaccinations } = usePendingVaccinations()
  const [showFarmPicker, setShowFarmPicker] = useState(false)
  const [userOrgs, setUserOrgs] = useState<Organization[]>([])
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null)

  // Load all organizations the user is a member of and user's display name
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

      // Get user's display name from current org membership
      if (currentOrg && memberships.length > 0) {
        const currentMembership = memberships.find(m => m.organizationId === currentOrg.id)
        if (currentMembership?.userDisplayName) {
          setUserDisplayName(currentMembership.userDisplayName)
        }
      }
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

  const handleViewVaccinations = useCallback(() => {
    navigation.navigate("PendingVaccinations")
  }, [navigation])

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
      <View style={themed($headerSection)}>
        <View>
          <Text preset="heading" text={t("dashboardScreen.title")} style={themed($heading)} />
          {userDisplayName ? (
            <Text text={t("dashboardScreen.welcomeBack", { name: userDisplayName })} size="md" style={themed($welcomeText)} />
          ) : null}
          {user?.email ? (
            <Text text={user.email} size="xs" style={themed($emailText)} />
          ) : null}
        </View>
      </View>

      {!currentOrg ? (
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
                <Pressable
                  onPress={() => handleSwitchFarm(item.id)}
                  style={themed($farmOption)}
                >
                  <Text text={item.name} preset="bold" />
                  {item.id === currentOrg?.id && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.tint} />
                  )}
                </Pressable>
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
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
})

const $headerSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xxs,
  marginTop: spacing.md,
})

const $welcomeText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  fontWeight: "500",
  marginBottom: spacing.xxs,
})

const $emailText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.md,
})

const $setupCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  marginTop: spacing.lg,
  gap: spacing.sm,
})

const $statsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginBottom: spacing.sm,
})

const $statCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  alignItems: "center",
})

const $statNumber: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
  gap: spacing.sm,
})

const $recentItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 10,
  padding: spacing.sm,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $farmSwitcher: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.md,
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
  padding: spacing.md,
  marginBottom: spacing.md,
  borderLeftWidth: 4,
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
  padding: spacing.md,
  marginBottom: spacing.md,
  borderLeftWidth: 4,
  borderLeftColor: colors.palette.accent500,
})

const $vaccinationHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.sm,
})

const $vaccinationTitle: ThemedStyle<TextStyle> = () => ({
  flex: 1,
})

const $vaccinationCounts: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $vaccinationBadge = (badgeStyle: ThemedStyle<ViewStyle>): ThemedStyle<ViewStyle> => ({ spacing, colors }) => ({
  ...badgeStyle({ spacing, colors }),
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 12,
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
  fontSize: 12,
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
