import { FC, useMemo, useState } from "react"
import { Alert, FlatList, Pressable, ScrollView, TextStyle, View, ViewStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { Button, Icon, Screen, Text } from "@/components"
import { PhotoGallery } from "@/components/PhotoGallery"
import {
  PASTURE_ACTIVITY_LABELS,
  PASTURE_ACTIVITY_TYPES,
  PastureActivity,
  PastureActivityType,
  TICK_LOAD_OPTIONS,
} from "@/db/models"
import { usePastureActivities, usePastureActivityActions } from "@/hooks/usePastureActivities"
import { usePasture } from "@/hooks/usePastures"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { formatDate } from "@/utils/formatDate"

type ActivityFilter = "all" | PastureActivityType

interface PastureActivityListScreenProps extends AppStackScreenProps<"PastureActivityList"> {}

export const PastureActivityListScreen: FC<PastureActivityListScreenProps> = ({
  navigation,
  route,
}) => {
  const { pastureId } = route.params
  const { pasture } = usePasture(pastureId)
  const { activities, isLoading } = usePastureActivities(pastureId)
  const { deleteActivity } = usePastureActivityActions()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const [filter, setFilter] = useState<ActivityFilter>("all")

  const filteredActivities = useMemo(
    () =>
      filter === "all"
        ? activities
        : activities.filter((activity) => activity.activityType === filter),
    [activities, filter],
  )

  const handleDelete = (activity: PastureActivity) => {
    Alert.alert(
      "Delete activity?",
      `${PASTURE_ACTIVITY_LABELS[activity.activityType]} on ${formatDate(activity.activityDate.toISOString(), "PP")} will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteActivity(activity.id)
            } catch (error) {
              console.error("[PastureActivity] Failed to delete:", error)
              Alert.alert("Could not delete activity", "Please try again.")
            }
          },
        },
      ],
    )
  }

  const renderActivity = ({ item: activity }: { item: PastureActivity }) => (
    <View style={themed($activityCard)}>
      <View style={themed($activityHeader)}>
        <View style={themed($activityIcon)}>
          <MaterialCommunityIcons
            name={
              activity.activityType === "burning"
                ? "fire"
                : activity.activityType === "tick_observation"
                  ? "bug-outline"
                  : "tree-outline"
            }
            size={22}
            color={
              activity.activityType === "burning"
                ? colors.palette.accent500
                : activity.activityType === "tick_observation"
                  ? colors.palette.angry500
                  : colors.palette.primary500
            }
          />
        </View>
        <View style={themed($activityInfo)}>
          <Text
            text={PASTURE_ACTIVITY_LABELS[activity.activityType]}
            style={themed($activityTitle)}
          />
          <Text
            text={formatDate(activity.activityDate.toISOString(), "PP")}
            style={themed($activityDate)}
          />
        </View>
        <Pressable
          accessibilityLabel={`Delete ${PASTURE_ACTIVITY_LABELS[activity.activityType]} activity`}
          onPress={() => handleDelete(activity)}
          style={themed($deleteButton)}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color={colors.palette.neutral500}
          />
        </Pressable>
      </View>

      {(activity.areaHectares ||
        activity.targetSpecies ||
        activity.performedBy ||
        activity.tickLoadScore !== null ||
        activity.animalsInspected) && (
        <View style={themed($details)}>
          {activity.tickLoadScore !== null && (
            <Text
              text={`Tick load: ${activity.tickLoadScore}/5 (${
                TICK_LOAD_OPTIONS.find((option) => option.score === activity.tickLoadScore)
                  ?.label ?? "Recorded"
              })`}
              style={themed($detailText)}
            />
          )}
          {!!activity.animalsInspected && (
            <Text
              text={`${activity.animalsInspected} animals inspected`}
              style={themed($detailText)}
            />
          )}
          {!!activity.areaHectares && (
            <Text text={`${activity.areaHectares} ha treated`} style={themed($detailText)} />
          )}
          {!!activity.targetSpecies && (
            <Text text={`Target: ${activity.targetSpecies}`} style={themed($detailText)} />
          )}
          {!!activity.performedBy && (
            <Text text={`By: ${activity.performedBy}`} style={themed($detailText)} />
          )}
        </View>
      )}

      {!!activity.notes && <Text text={activity.notes} style={themed($notes)} />}
      <PhotoGallery photosJson={activity.photos} />
    </View>
  )

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={themed($backButton)}
        >
          <Icon icon="back" size={24} />
        </Pressable>
        <View style={themed($headerText)}>
          <Text preset="heading" text="Pasture Activity" />
          {!!pasture && <Text text={pasture.name} style={themed($subtitle)} />}
        </View>
        <Pressable
          accessibilityLabel="Log pasture activity"
          onPress={() => navigation.navigate("PastureActivityForm", { pastureId })}
          style={themed($headerAddButton)}
        >
          <MaterialCommunityIcons name="plus" size={22} color={colors.palette.primary600} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={themed($filterContent)}
        style={themed($filterScroll)}
      >
        <Pressable
          onPress={() => setFilter("all")}
          style={[themed($filterChip), filter === "all" && themed($filterChipSelected)]}
        >
          <Text
            text={`All (${activities.length})`}
            style={[themed($filterText), filter === "all" && themed($filterTextSelected)]}
          />
        </Pressable>
        {PASTURE_ACTIVITY_TYPES.map((type) => {
          const selected = filter === type
          const count = activities.filter((activity) => activity.activityType === type).length
          return (
            <Pressable
              key={type}
              onPress={() => setFilter(type)}
              style={[themed($filterChip), selected && themed($filterChipSelected)]}
            >
              <Text
                text={`${PASTURE_ACTIVITY_LABELS[type]} (${count})`}
                style={[themed($filterText), selected && themed($filterTextSelected)]}
              />
            </Pressable>
          )
        })}
      </ScrollView>

      <FlatList
        data={filteredActivities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={themed($listContent)}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={themed($emptyState)}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={42}
              color={colors.palette.neutral400}
            />
            <Text
              text={
                isLoading
                  ? "Loading activity…"
                  : filter === "all"
                    ? "No pasture activity recorded yet."
                    : `No ${PASTURE_ACTIVITY_LABELS[filter].toLowerCase()} records yet.`
              }
              style={themed($emptyText)}
            />
            {!isLoading && filter === "all" && (
              <Button
                text="Log first activity"
                preset="reversed"
                onPress={() => navigation.navigate("PastureActivityForm", { pastureId })}
                style={themed($emptyButton)}
              />
            )}
          </View>
        }
      />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginTop: spacing.md,
  marginBottom: spacing.md,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $headerText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  marginTop: 2,
})

const $headerAddButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.primary100,
  marginRight: spacing.xxs,
})

const $filterScroll: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 0,
  marginBottom: spacing.md,
})

const $filterContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xs,
  paddingRight: spacing.lg,
})

const $filterChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 18,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
})

const $filterChipSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $filterText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
})

const $filterTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
  fontWeight: "600",
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxxl,
  flexGrow: 1,
})

const $activityCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $activityHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $activityIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 38,
  height: 38,
  borderRadius: 19,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.neutral200,
})

const $activityInfo: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $activityTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 15,
  fontWeight: "600",
})

const $activityDate: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginTop: 2,
})

const $deleteButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $details: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  gap: spacing.xxs,
  marginTop: spacing.sm,
  paddingTop: spacing.sm,
  borderTopWidth: 1,
  borderTopColor: colors.palette.neutral200,
})

const $detailText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
})

const $notes: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  fontSize: 13,
  lineHeight: 19,
  marginTop: spacing.sm,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: spacing.xl,
  paddingBottom: spacing.xxxl,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 14,
  textAlign: "center",
  marginTop: spacing.sm,
})

const $emptyButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minHeight: 44,
  marginTop: spacing.lg,
  paddingHorizontal: spacing.lg,
})
