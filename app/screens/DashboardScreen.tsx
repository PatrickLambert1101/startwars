import { FC, useCallback } from "react"
import { Pressable, View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import type { MainTabScreenProps } from "@/navigators/navigationTypes"

export const DashboardScreen: FC<MainTabScreenProps<"Dashboard">> = ({ navigation }) => {
  const { themed } = useAppTheme()
  const { stats } = useDashboardStats()
  const { currentOrg, createOrganization } = useDatabase()
  const { user } = useAuth()

  const handleSetupOrg = useCallback(async () => {
    // Quick org creation — in a full implementation this would be a dedicated screen
    await createOrganization("My Ranch")
  }, [createOrganization])

  const handleAnimalPress = useCallback((animalId: string) => {
    navigation.navigate("AnimalDetail", { animalId })
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
            text="Set up your organization to start managing your herd."
            style={themed($dimText)}
          />
          <Pressable onPress={handleSetupOrg} style={themed($setupButton)}>
            <Text text="Create Organization" preset="bold" style={themed($setupButtonText)} />
          </Pressable>
        </View>
      ) : (
        <>
          <Text text={currentOrg.name} size="sm" style={themed($orgName)} />

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

const $setupButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  borderRadius: 8,
  padding: spacing.sm,
  alignItems: "center",
  marginTop: spacing.sm,
})

const $setupButtonText: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
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
