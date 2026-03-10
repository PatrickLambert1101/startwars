import { FC, useCallback, useState, useEffect } from "react"
import { Pressable, View, ViewStyle, TextStyle, Modal, FlatList } from "react-native"
import { Q } from "@nozbe/watermelondb"

import { Screen, Text, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import type { MainTabScreenProps } from "@/navigators/navigationTypes"
import { database } from "@/db"
import { Organization } from "@/db/models/Organization"
import { OrganizationMember } from "@/db/models/OrganizationMember"

export const DashboardScreen: FC<MainTabScreenProps<"Dashboard">> = ({ navigation }) => {
  const { themed, theme: { colors } } = useAppTheme()
  const { stats } = useDashboardStats()
  const { currentOrg, switchOrganization } = useDatabase()
  const { user } = useAuth()
  const [showFarmPicker, setShowFarmPicker] = useState(false)
  const [userOrgs, setUserOrgs] = useState<Organization[]>([])

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
  }, [user])

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

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <Text preset="heading" text="Dashboard" style={themed($heading)} />
      {user?.email ? (
        <Text text={user.email} size="xs" style={themed($emailText)} />
      ) : null}

      {!currentOrg ? (
        <View style={themed($setupCard)}>
          <Text preset="subheading" text="Welcome to HerdTrackr" />
          <Text
            text="Set up your farm to start managing your herd."
            style={themed($dimText)}
          />
          <Button text="Set Up Farm" preset="reversed" onPress={handleSetupOrg} />
        </View>
      ) : (
        <>
          {/* Farm Switcher */}
          <Pressable onPress={() => setShowFarmPicker(true)} style={themed($farmSwitcher)}>
            <View>
              <Text text="Current Farm" size="xs" style={themed($dimText)} />
              <Text text={currentOrg.name} preset="bold" />
            </View>
            <Text text="▼" size="sm" style={themed($dimText)} />
          </Pressable>

          <View style={themed($statsRow)}>
            <View style={themed($statCard)}>
              <Text preset="subheading" text={String(stats.totalHead)} style={themed($statNumber)} />
              <Text preset="formHelper" text="Total Head" />
            </View>
            <View style={themed($statCard)}>
              <Text preset="subheading" text={String(stats.activeCount)} style={themed($statNumber)} />
              <Text preset="formHelper" text="Active" />
            </View>
          </View>

          <View style={themed($statsRow)}>
            <View style={themed($statCard)}>
              <Text preset="subheading" text={String(stats.dueToCalve)} style={themed($statNumber)} />
              <Text preset="formHelper" text="Due to Calve" />
            </View>
            <View style={themed($statCard)}>
              <Text preset="subheading" text="0" style={themed($statNumber)} />
              <Text preset="formHelper" text="Pending Sync" />
            </View>
          </View>

          <View style={themed($section)}>
            <Text preset="subheading" text="Recent Animals" />
            {stats.recentAnimals.length === 0 ? (
              <Text
                text="No animals yet. Go to the Herd tab to add your first animal."
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
            <Text preset="subheading" text="Switch Farm" style={themed($modalTitle)} />

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
                    <Text text="✓" style={{ color: colors.tint }} />
                  )}
                </Pressable>
              )}
              ListFooterComponent={
                <>
                  <View style={themed($divider)} />
                  <Pressable onPress={handleCreateNewFarm} style={themed($farmOption)}>
                    <Text text="+ Create New Farm" style={{ color: colors.tint }} />
                  </Pressable>
                </>
              }
            />

            <Button text="Cancel" onPress={() => setShowFarmPicker(false)} style={themed($cancelButton)} />
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

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
  marginTop: spacing.md,
})

const $emailText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.lg,
})

const $orgName: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
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
