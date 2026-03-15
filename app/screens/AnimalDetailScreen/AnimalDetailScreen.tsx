import { FC, useCallback, useState } from "react"
import { Pressable, View, ViewStyle, TextStyle } from "react-native"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"

import { Screen, Text, Button } from "@/components"
import { WeightChart } from "@/components/WeightChart"
import { PhotoGallery } from "@/components/PhotoGallery"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAnimal, useAnimalActions } from "@/hooks/useAnimals"
import { useHealthRecords, useWeightRecords, useBreedingRecords } from "@/hooks/useRecords"
import { useScheduledVaccinations } from "@/hooks/useVaccinationSchedules"
import { MaterialCommunityIcons } from "@expo/vector-icons"

type Tab = "overview" | "health" | "vaccinations" | "weight" | "breeding"

export const AnimalDetailScreen: FC<AppStackScreenProps<"AnimalDetail">> = ({ route, navigation }) => {
  const { t } = useTranslation()
  const { themed, theme } = useAppTheme()
  const { animalId } = route.params
  const { animal, isLoading } = useAnimal(animalId)
  const { deleteAnimal } = useAnimalActions()
  const { records: healthRecords } = useHealthRecords(animalId)
  const { records: weightRecords } = useWeightRecords(animalId)
  const { records: breedingRecords } = useBreedingRecords(animalId)
  const { vaccinations } = useScheduledVaccinations(animalId)

  // Debug logging
  if (__DEV__ && vaccinations.length > 0) {
    console.log("[AnimalDetail] Vaccinations:", vaccinations.map(v => ({
      id: v.id,
      hasSchedule: !!v.schedule,
      scheduleName: v.schedule?.name,
      hasAnimal: !!v.animal,
    })))
  }
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  const handleEdit = useCallback(() => {
    navigation.navigate("AnimalForm", { mode: "edit", animalId })
  }, [navigation, animalId])

  const handleDelete = useCallback(async () => {
    await deleteAnimal(animalId)
    navigation.goBack()
  }, [deleteAnimal, animalId, navigation])

  if (isLoading || !animal) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]}>
        <View style={themed($centered)}>
          <Text text={isLoading ? t("animalDetailScreen.loading") : t("animalDetailScreen.notFound")} />
        </View>
      </Screen>
    )
  }

  const formatDate = (d: Date | null) => d ? format(d, "dd MMM yyyy") : t("animalDetailScreen.overview.noValue")

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($headerRow)}>
        <Button text={t("animalDetailScreen.backButton")} preset="default" onPress={() => navigation.goBack()} />
        <Button text={t("animalDetailScreen.editButton")} preset="default" onPress={handleEdit} />
      </View>

      <Text preset="heading" text={animal.displayName} style={themed($heading)} />
      <View style={themed($metaRow)}>
        <View style={[$statusBadge, { backgroundColor: theme.colors.tint + "22" }]}>
          <Text text={animal.status} size="xxs" style={{ color: theme.colors.tint }} />
        </View>
        <Text text={`${animal.breed} | ${animal.sex}`} size="sm" style={themed($dimText)} />
      </View>

      {/* Tabs */}
      <View style={themed($tabRow)}>
        {(["overview", "health", "vaccinations", "weight", "breeding"] as Tab[]).map((tab) => {
          const getTabIcon = () => {
            switch (tab) {
              case "overview": return "information-outline"
              case "health": return "medical-bag"
              case "vaccinations": return "needle"
              case "weight": return "scale"
              case "breeding": return "heart"
              default: return "circle"
            }
          }
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={themed(activeTab === tab ? $tabActive : $tab)}
            >
              <MaterialCommunityIcons
                name={getTabIcon()}
                size={18}
                color={activeTab === tab ? "#FFFFFF" : theme.colors.text}
              />
              <Text
                preset="formLabel"
                text={t(`animalDetailScreen.tabs.${tab}`)}
                style={activeTab === tab ? themed($tabTextActive) : themed($tabText)}
                numberOfLines={1}
              />
            </Pressable>
          )
        })}
      </View>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <View style={themed($section)}>
          <PhotoGallery photosJson={animal.photos} />
          <DetailRow label={t("animalDetailScreen.overview.rfidTag")} value={animal.rfidTag} themed={themed} />
          <DetailRow label={t("animalDetailScreen.overview.visualTag")} value={animal.visualTag} themed={themed} />
          <DetailRow label={t("animalDetailScreen.overview.dateOfBirth")} value={formatDate(animal.dateOfBirth)} themed={themed} />
          <DetailRow label={t("animalDetailScreen.overview.registrationNumber")} value={animal.registrationNumber || t("animalDetailScreen.overview.noValue")} themed={themed} />
          {animal.notes ? <DetailRow label={t("animalDetailScreen.overview.notes")} value={animal.notes} themed={themed} /> : null}

          <Button
            text={t("animalDetailScreen.deleteButton")}
            preset="default"
            textStyle={themed($deleteText)}
            style={themed($deleteButton)}
            onPress={handleDelete}
          />
        </View>
      )}

      {activeTab === "health" && (
        <View style={themed($section)}>
          <Button
            text={t("animalDetailScreen.health.addButton")}
            preset="filled"
            style={themed($addRecordButton)}
            onPress={() => navigation.navigate("HealthRecordForm", { animalId })}
          />
          {healthRecords.length === 0 ? (
            <Text text={t("animalDetailScreen.health.empty")} style={themed($dimText)} />
          ) : (
            healthRecords.map((r) => (
              <View key={r.id} style={themed($recordCard)}>
                <View style={themed($recordHeader)}>
                  <Text preset="bold" text={r.recordType} />
                  <Text size="xs" text={formatDate(r.recordDate)} style={themed($dimText)} />
                </View>
                <Text text={r.description} size="sm" />
                {r.productName ? <Text text={t("animalDetailScreen.health.product", { product: r.productName })} size="xs" style={themed($dimText)} /> : null}
                <PhotoGallery photosJson={r.photos} />
                {r.createdByName ? (
                  <Text
                    text={t("animalDetailScreen.health.recordedBy", { name: r.createdByName.split('@')[0] })}
                    size="xxs"
                    style={themed($createdByText)}
                  />
                ) : null}
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === "vaccinations" && (
        <View style={themed($section)}>
          <Text preset="subheading" text="Vaccination Schedule" style={themed($sectionTitle)} />
          {vaccinations.length === 0 ? (
            <View style={themed($emptyState)}>
              <MaterialCommunityIcons name="needle" size={48} color={theme.colors.palette.neutral300} />
              <Text text="No vaccinations scheduled" style={themed($emptyText)} />
              <Text text="Vaccinations are automatically scheduled based on age and active schedules" size="xs" style={themed($dimText)} />
            </View>
          ) : (
            <>
            {vaccinations.map((v) => {
              const getUrgencyColor = () => {
                if (v.urgencyLevel === "critical" || v.urgencyLevel === "overdue") return theme.colors.error
                if (v.urgencyLevel === "soon") return theme.colors.palette.accent500
                return theme.colors.textDim
              }

              const getStatusBadgeColor = () => {
                if (v.status === "administered") return theme.colors.palette.primary100
                if (v.status === "skipped") return theme.colors.palette.neutral200
                return theme.colors.palette.accent100
              }

              return (
                <View key={v.id} style={[themed($vaccinationCard), { borderLeftColor: getUrgencyColor() }]}>
                  <View style={themed($recordHeader)}>
                    <View style={themed($vaccinationHeaderLeft)}>
                      <MaterialCommunityIcons name="needle" size={20} color={getUrgencyColor()} />
                      <Text
                        preset="bold"
                        text={v.schedule?.name || "Unknown Vaccination"}
                        style={{ marginLeft: 8, flex: 1 }}
                        numberOfLines={2}
                      />
                    </View>
                    <View style={[themed($vaccinationBadge), { backgroundColor: getStatusBadgeColor() }]}>
                      <Text text={v.status} size="xxs" style={themed($vaccinationBadgeText)} />
                    </View>
                  </View>

                  {v.schedule?.protocol && (
                    <Text text={v.schedule.protocol.productName} size="sm" style={themed($dimText)} />
                  )}

                  <View style={themed($vaccinationDetails)}>
                    <View style={themed($vaccinationDetailRow)}>
                      <MaterialCommunityIcons name="calendar" size={14} color={theme.colors.textDim} />
                      <Text text={`Due: ${formatDate(v.dueDate)}`} size="xs" style={themed($vaccinationDetailText)} />
                    </View>

                    {v.status === "pending" && v.daysUntilDue !== undefined && (
                      <View style={themed($vaccinationDetailRow)}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={getUrgencyColor()} />
                        <Text
                          text={v.daysUntilDue < 0 ? `${Math.abs(v.daysUntilDue)} days overdue` : `${v.daysUntilDue} days until due`}
                          size="xs"
                          style={[themed($vaccinationDetailText), { color: getUrgencyColor() }]}
                        />
                      </View>
                    )}

                    {v.administeredDate && (
                      <View style={themed($vaccinationDetailRow)}>
                        <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.palette.primary500} />
                        <Text text={`Administered: ${formatDate(v.administeredDate)}`} size="xs" style={themed($vaccinationDetailText)} />
                      </View>
                    )}

                    <View style={themed($vaccinationDetailRow)}>
                      <MaterialCommunityIcons name="needle" size={14} color={theme.colors.textDim} />
                      <Text text={`Dose ${v.doseNumber}${v.schedule?.boosterCount ? ` of ${v.schedule.boosterCount}` : ""}`} size="xs" style={themed($vaccinationDetailText)} />
                    </View>
                  </View>

                  {v.status === "pending" && (
                    <Button
                      text="Administer Vaccination"
                      preset="filled"
                      style={themed($administerButton)}
                      onPress={() => navigation.navigate("HealthRecordForm", {
                        animalId,
                        protocolId: v.schedule?.protocol?.id,
                        vaccinationId: v.id,
                      })}
                    />
                  )}
                </View>
              )
            })}
            </>
          )}
        </View>
      )}

      {activeTab === "weight" && (
        <View style={themed($section)}>
          <Button
            text={t("animalDetailScreen.weight.addButton")}
            preset="filled"
            style={themed($addRecordButton)}
            onPress={() => navigation.navigate("WeightRecordForm", { animalId })}
          />
          {weightRecords.length >= 2 && <WeightChart records={weightRecords} />}
          {weightRecords.length === 0 ? (
            <Text text={t("animalDetailScreen.weight.empty")} style={themed($dimText)} />
          ) : (
            weightRecords.map((r) => (
              <View key={r.id} style={themed($recordCard)}>
                <View style={themed($recordHeader)}>
                  <Text preset="bold" text={t("animalDetailScreen.weight.weightValue", { weight: r.weightKg })} />
                  <Text size="xs" text={formatDate(r.recordDate)} style={themed($dimText)} />
                </View>
                {r.conditionScore ? <Text text={t("animalDetailScreen.weight.condition", { score: r.conditionScore })} size="sm" /> : null}
                <PhotoGallery photosJson={r.photos} />
                {r.createdByName ? (
                  <Text
                    text={t("animalDetailScreen.weight.recordedBy", { name: r.createdByName.split('@')[0] })}
                    size="xxs"
                    style={themed($createdByText)}
                  />
                ) : null}
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === "breeding" && (
        <View style={themed($section)}>
          <Button
            text={t("animalDetailScreen.breeding.addButton")}
            preset="filled"
            style={themed($addRecordButton)}
            onPress={() => navigation.navigate("BreedingRecordForm", { animalId })}
          />
          {breedingRecords.length === 0 ? (
            <Text text={t("animalDetailScreen.breeding.empty")} style={themed($dimText)} />
          ) : (
            breedingRecords.map((r) => (
              <View key={r.id} style={themed($recordCard)}>
                <View style={themed($recordHeader)}>
                  <Text preset="bold" text={r.method} />
                  <Text size="xs" text={r.outcome} style={themed($dimText)} />
                </View>
                <Text text={t("animalDetailScreen.breeding.bred", { date: formatDate(r.breedingDate) })} size="sm" />
                {r.expectedCalvingDate ? (
                  <Text text={t("animalDetailScreen.breeding.expectedCalving", { date: formatDate(r.expectedCalvingDate) })} size="xs" style={themed($dimText)} />
                ) : null}
                <PhotoGallery photosJson={r.photos} />
                {r.createdByName ? (
                  <Text
                    text={t("animalDetailScreen.breeding.recordedBy", { name: r.createdByName.split('@')[0] })}
                    size="xxs"
                    style={themed($createdByText)}
                  />
                ) : null}
              </View>
            ))
          )}
        </View>
      )}
    </Screen>
  )
}

// Simple detail row component
function DetailRow({ label, value, themed }: { label: string; value: string; themed: (style: ThemedStyle<any>) => any }) {
  return (
    <View style={themed($detailRow)}>
      <Text text={label} size="sm" style={themed($detailLabel)} />
      <Text text={value} size="sm" />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $centered: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
})

const $headerRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: spacing.md,
  marginBottom: spacing.sm,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $metaRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.lg,
})

const $statusBadge: ViewStyle = {
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 2,
}

const $tabRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xxs,
  marginBottom: spacing.lg,
  flexWrap: "nowrap",
})

const $tab: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  minWidth: 60,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.xxs,
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
})

const $tabActive: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  minWidth: 60,
  backgroundColor: colors.tint,
  borderRadius: 8,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.xxs,
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
})

const $tabText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 10,
  textAlign: "center",
})

const $tabTextActive: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontSize: 10,
  fontWeight: "600",
  textAlign: "center",
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
})

const $detailRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  paddingVertical: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $detailLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $recordCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 10,
  padding: spacing.sm,
})

const $recordHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $addRecordButton: ThemedStyle<ViewStyle> = () => ({
  alignSelf: "flex-start",
})

const $deleteButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
})

const $deleteText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const $createdByText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xxs,
  fontStyle: "italic",
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.xxl,
})

const $emptyText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  marginBottom: spacing.xs,
})

const $vaccinationCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.md,
  borderLeftWidth: 4,
})

const $vaccinationHeaderLeft: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
})

const $vaccinationBadge: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 10,
})

const $vaccinationBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "600",
})

const $vaccinationDetails: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  gap: spacing.xs,
})

const $vaccinationDetailRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
})

const $vaccinationDetailText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $administerButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

