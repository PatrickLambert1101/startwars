import { useState, useEffect, useMemo, useCallback } from "react"
import { View, ViewStyle, TextStyle, ScrollView, Pressable, Alert, Modal, FlatList } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { Screen, Text, TextField, Button } from "@/components"
import { DateField } from "@/components/DateField"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useVaccinationSchedule, useVaccinationScheduleActions, VaccinationScheduleFormData } from "@/hooks/useVaccinationSchedules"
import { useProtocols } from "@/hooks/useProtocols"
import { usePastures } from "@/hooks/usePastures"
import { ScheduleType } from "@/db/models"
import { recalculateSchedule } from "@/services/vaccinationScheduler"

const SCHEDULE_TYPES: { value: ScheduleType; label: string; icon: string }[] = [
  { value: "age_based", label: "Age-Based", icon: "calendar-clock" },
  { value: "date_based", label: "Date-Based", icon: "calendar" },
  { value: "group_based", label: "Group-Based", icon: "map-marker" },
]

const SEX_OPTIONS = [
  { value: "", label: "All" },
  { value: "male", label: "Bulls" },
  { value: "female", label: "Cows" },
  { value: "castrated", label: "Steers" },
]

export function VaccinationScheduleFormScreen({ route, navigation }: AppStackScreenProps<"VaccinationScheduleForm">) {
  const { mode, scheduleId } = route.params
  const { t } = useTranslation()
  const { themed, theme: { colors } } = useAppTheme()
  const { schedule, isLoading } = useVaccinationSchedule(scheduleId || "")
  const { createSchedule, updateSchedule } = useVaccinationScheduleActions()
  const { protocols } = useProtocols()
  const { pastures } = usePastures()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedProtocolId, setSelectedProtocolId] = useState("")
  const [scheduleType, setScheduleType] = useState<ScheduleType>("age_based")

  // Age-based fields
  const [targetAgeMonths, setTargetAgeMonths] = useState("")
  const [ageWindowDays, setAgeWindowDays] = useState("7")

  // Date-based fields
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null)
  const [repeatAnnually, setRepeatAnnually] = useState(false)

  // Group-based fields
  const [selectedPastureId, setSelectedPastureId] = useState("")
  const [intervalMonths, setIntervalMonths] = useState("")

  // Filters
  const [targetSpecies, setTargetSpecies] = useState("cattle")
  const [targetSex, setTargetSex] = useState("")
  const [minAgeMonths, setMinAgeMonths] = useState("")
  const [maxAgeMonths, setMaxAgeMonths] = useState("")

  // Booster fields
  const [requiresBooster, setRequiresBooster] = useState(false)
  const [boosterIntervalDays, setBoosterIntervalDays] = useState("21")
  const [boosterCount, setBoosterCount] = useState("2")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProtocolModal, setShowProtocolModal] = useState(false)
  const [protocolSearch, setProtocolSearch] = useState("")

  const vaccinationProtocols = useMemo(() => {
    return protocols.filter(p => p.protocolType === "vaccination" && p.isActive)
  }, [protocols])

  const filteredProtocols = useMemo(() => {
    if (!protocolSearch.trim()) return vaccinationProtocols
    const search = protocolSearch.toLowerCase()
    return vaccinationProtocols.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.productName.toLowerCase().includes(search)
    )
  }, [vaccinationProtocols, protocolSearch])

  // Load existing schedule data
  useEffect(() => {
    if (mode === "edit" && schedule && !isLoading) {
      setName(schedule.name)
      setDescription(schedule.description || "")
      setSelectedProtocolId(schedule.protocolId)
      setScheduleType(schedule.scheduleType)
      setTargetAgeMonths(schedule.targetAgeMonths?.toString() || "")
      setAgeWindowDays(schedule.ageWindowDays?.toString() || "7")
      setScheduledDate(schedule.scheduledDate)
      setRepeatAnnually(schedule.repeatAnnually)
      setSelectedPastureId(schedule.pastureId || "")
      setIntervalMonths(schedule.intervalMonths?.toString() || "")
      setTargetSpecies(schedule.targetSpecies || "cattle")
      setTargetSex(schedule.targetSex || "")
      setMinAgeMonths(schedule.minAgeMonths?.toString() || "")
      setMaxAgeMonths(schedule.maxAgeMonths?.toString() || "")
      setRequiresBooster(schedule.requiresBooster)
      setBoosterIntervalDays(schedule.boosterIntervalDays?.toString() || "21")
      setBoosterCount(schedule.boosterCount.toString())
    }
  }, [mode, schedule, isLoading])

  const handleSave = useCallback(async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert(t("common.error"), "Schedule name is required")
      return
    }
    if (!selectedProtocolId) {
      Alert.alert(t("common.error"), "Please select a vaccination protocol")
      return
    }

    // Schedule type specific validation
    if (scheduleType === "age_based" && !targetAgeMonths) {
      Alert.alert(t("common.error"), "Target age is required for age-based schedules")
      return
    }
    if (scheduleType === "date_based" && !scheduledDate) {
      Alert.alert(t("common.error"), "Scheduled date is required for date-based schedules")
      return
    }
    if (scheduleType === "group_based" && (!selectedPastureId || !intervalMonths)) {
      Alert.alert(t("common.error"), "Pasture and interval are required for group-based schedules")
      return
    }

    setIsSubmitting(true)
    try {
      const data: VaccinationScheduleFormData = {
        protocolId: selectedProtocolId,
        name: name.trim(),
        description: description.trim() || undefined,
        scheduleType,
        targetAgeMonths: targetAgeMonths ? parseInt(targetAgeMonths) : undefined,
        ageWindowDays: ageWindowDays ? parseInt(ageWindowDays) : undefined,
        scheduledDate: scheduledDate || undefined,
        repeatAnnually,
        pastureId: selectedPastureId || undefined,
        intervalMonths: intervalMonths ? parseInt(intervalMonths) : undefined,
        targetSpecies: targetSpecies || undefined,
        targetSex: targetSex || undefined,
        minAgeMonths: minAgeMonths ? parseInt(minAgeMonths) : undefined,
        maxAgeMonths: maxAgeMonths ? parseInt(maxAgeMonths) : undefined,
        requiresBooster,
        boosterIntervalDays: requiresBooster && boosterIntervalDays ? parseInt(boosterIntervalDays) : undefined,
        boosterCount: parseInt(boosterCount),
      }

      if (mode === "create") {
        const newSchedule = await createSchedule(data)
        // Trigger calculation for this schedule
        await recalculateSchedule(newSchedule.id)
      } else if (scheduleId) {
        await updateSchedule(scheduleId, data)
        // Recalculate when schedule is updated
        await recalculateSchedule(scheduleId)
      }

      navigation.goBack()
    } catch (error) {
      console.error("Failed to save schedule:", error)
      Alert.alert(t("common.error"), "Failed to save vaccination schedule")
    }
    setIsSubmitting(false)
  }, [
    name, selectedProtocolId, scheduleType, targetAgeMonths, ageWindowDays,
    scheduledDate, repeatAnnually, selectedPastureId, intervalMonths,
    targetSpecies, targetSex, minAgeMonths, maxAgeMonths,
    requiresBooster, boosterIntervalDays, boosterCount,
    mode, scheduleId, createSchedule, updateSchedule, navigation, t,
  ])

  const selectedProtocol = useMemo(() => {
    return protocols.find(p => p.id === selectedProtocolId)
  }, [protocols, selectedProtocolId])

  const selectedPasture = useMemo(() => {
    return pastures.find(p => p.id === selectedPastureId)
  }, [pastures, selectedPastureId])

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($header)}>
        <Button text={t("common.cancel")} preset="default" onPress={() => navigation.goBack()} />
        <Text preset="heading" text={mode === "create" ? "New Schedule" : "Edit Schedule"} />
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={themed($form)} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={themed($section)}>
          <Text preset="subheading" text="Basic Information" style={themed($sectionTitle)} />

          <TextField
            label="Schedule Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Calf IBR Vaccination"
          />

          <TextField
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Additional notes about this schedule"
            multiline
          />

          {/* Protocol Selector */}
          <View>
            <Text preset="formLabel" text="Vaccination Protocol *" style={themed($fieldLabel)} />
            {selectedProtocol ? (
              <Pressable onPress={() => setSelectedProtocolId("")} style={themed($selectedProtocol)}>
                <View>
                  <Text preset="bold">{selectedProtocol.name}</Text>
                  <Text size="xs" style={themed($dimText)}>{selectedProtocol.productName}</Text>
                </View>
                <MaterialCommunityIcons name="close" size={20} color={colors.text} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setShowProtocolModal(true)}
                style={themed($protocolButton)}
              >
                <Text style={themed($protocolButtonText)}>+ Select Vaccination Protocol</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Schedule Type */}
        <View style={themed($section)}>
          <Text preset="subheading" text="Schedule Type *" style={themed($sectionTitle)} />
          <View style={themed($typeRow)}>
            {SCHEDULE_TYPES.map(type => {
              const isActive = scheduleType === type.value
              return (
                <Pressable
                  key={type.value}
                  onPress={() => setScheduleType(type.value)}
                  style={[themed($typeCard), isActive && themed($typeCardActive)]}
                >
                  <MaterialCommunityIcons
                    name={type.icon as any}
                    size={24}
                    color={isActive ? colors.tint : colors.textDim}
                  />
                  <Text style={[themed($typeText), isActive && themed($typeTextActive)]}>
                    {type.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Schedule Type Specific Fields */}
        <View style={themed($section)}>
          {scheduleType === "age_based" && (
            <>
              <Text preset="subheading" text="Age-Based Settings" style={themed($sectionTitle)} />
              <TextField
                label="Target Age (months) *"
                value={targetAgeMonths}
                onChangeText={setTargetAgeMonths}
                placeholder="e.g., 3, 6, 12"
                keyboardType="numeric"
              />
              <TextField
                label="Age Window (±days)"
                value={ageWindowDays}
                onChangeText={setAgeWindowDays}
                placeholder="7"
                keyboardType="numeric"
                helper="Animals within ±7 days of target age will be scheduled"
              />
            </>
          )}

          {scheduleType === "date_based" && (
            <>
              <Text preset="subheading" text="Date-Based Settings" style={themed($sectionTitle)} />
              <DateField
                label="Scheduled Date *"
                value={scheduledDate}
                onChange={setScheduledDate}
                placeholder="Select date"
              />
              <Pressable onPress={() => setRepeatAnnually(!repeatAnnually)} style={themed($checkboxRow)}>
                <MaterialCommunityIcons
                  name={repeatAnnually ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={24}
                  color={colors.tint}
                />
                <Text>Repeat annually</Text>
              </Pressable>
            </>
          )}

          {scheduleType === "group_based" && (
            <>
              <Text preset="subheading" text="Group-Based Settings" style={themed($sectionTitle)} />
              {selectedPasture ? (
                <Pressable onPress={() => setSelectedPastureId("")} style={themed($selectedProtocol)}>
                  <View>
                    <Text preset="bold">{selectedPasture.name}</Text>
                    <Text size="xs" style={themed($dimText)}>{selectedPasture.code}</Text>
                  </View>
                  <MaterialCommunityIcons name="close" size={20} color={colors.text} />
                </Pressable>
              ) : (
                <View>
                  <Text preset="formLabel" text="Select Pasture *" style={themed($fieldLabel)} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={themed($protocolList)}>
                    {pastures.map(pasture => (
                      <Pressable
                        key={pasture.id}
                        onPress={() => setSelectedPastureId(pasture.id)}
                        style={themed($protocolChip)}
                      >
                        <Text>{pasture.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
              <TextField
                label="Re-vaccinate every (months) *"
                value={intervalMonths}
                onChangeText={setIntervalMonths}
                placeholder="e.g., 6, 12"
                keyboardType="numeric"
              />
            </>
          )}
        </View>

        {/* Filters */}
        <View style={themed($section)}>
          <Text preset="subheading" text="Filters (optional)" style={themed($sectionTitle)} />

          <View>
            <Text preset="formLabel" text="Sex" style={themed($fieldLabel)} />
            <View style={themed($sexRow)}>
              {SEX_OPTIONS.map(option => {
                const isActive = targetSex === option.value
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setTargetSex(option.value)}
                    style={[themed($sexChip), isActive && themed($sexChipActive)]}
                  >
                    <Text style={[themed($sexChipText), isActive && themed($sexChipTextActive)]}>
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={themed($ageRangeRow)}>
            <TextField
              label="Min Age (months)"
              value={minAgeMonths}
              onChangeText={setMinAgeMonths}
              placeholder="0"
              keyboardType="numeric"
              containerStyle={themed($halfWidth)}
            />
            <TextField
              label="Max Age (months)"
              value={maxAgeMonths}
              onChangeText={setMaxAgeMonths}
              placeholder="24"
              keyboardType="numeric"
              containerStyle={themed($halfWidth)}
            />
          </View>
        </View>

        {/* Booster Settings */}
        <View style={themed($section)}>
          <Text preset="subheading" text="Booster Doses" style={themed($sectionTitle)} />

          <Pressable onPress={() => setRequiresBooster(!requiresBooster)} style={themed($checkboxRow)}>
            <MaterialCommunityIcons
              name={requiresBooster ? "checkbox-marked" : "checkbox-blank-outline"}
              size={24}
              color={colors.tint}
            />
            <Text>Requires booster doses</Text>
          </Pressable>

          {requiresBooster && (
            <>
              <TextField
                label="Booster Interval (days)"
                value={boosterIntervalDays}
                onChangeText={setBoosterIntervalDays}
                placeholder="21"
                keyboardType="numeric"
                helper="Days until next dose"
              />
              <TextField
                label="Total Doses"
                value={boosterCount}
                onChangeText={setBoosterCount}
                placeholder="2"
                keyboardType="numeric"
                helper="Including initial dose (e.g., 2 = initial + 1 booster)"
              />
            </>
          )}
        </View>

        <Button
          text={isSubmitting ? t("common.loading") : mode === "create" ? "Create Schedule" : "Save Changes"}
          preset="reversed"
          style={themed($saveButton)}
          onPress={handleSave}
          disabled={isSubmitting}
        />
      </ScrollView>

      {/* Protocol Selection Modal */}
      <Modal visible={showProtocolModal} transparent animationType="slide">
        <View style={themed($modalOverlay)}>
          <View style={themed($modalContent)}>
            <View style={themed($modalHeader)}>
              <Text preset="heading" text="Select Vaccination Protocol" size="md" />
              <Pressable onPress={() => setShowProtocolModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <TextField
              value={protocolSearch}
              onChangeText={setProtocolSearch}
              placeholder="Search protocols..."
              containerStyle={themed($searchContainer)}
            />

            <FlatList
              data={filteredProtocols}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={themed($protocolItem)}
                  onPress={() => {
                    setSelectedProtocolId(item.id)
                    setShowProtocolModal(false)
                    setProtocolSearch("")
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text preset="bold" text={item.name} />
                    <Text text={item.productName} size="xs" style={themed($dimText)} />
                    {item.dosage && (
                      <Text text={`Dosage: ${item.dosage}`} size="xs" style={themed($dimText)} />
                    )}
                  </View>
                  {selectedProtocolId === item.id && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.tint} />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={themed($emptyProtocols)}>
                  <Text text="No protocols found" style={themed($dimText)} />
                </View>
              }
              style={themed($protocolFlatList)}
            />

            <Button text={t("common.cancel")} onPress={() => {
              setShowProtocolModal(false)
              setProtocolSearch("")
            }} />
          </View>
        </View>
      </Modal>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: spacing.md,
  marginBottom: spacing.lg,
})

const $form: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $fieldLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $selectedProtocol: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 8,
  padding: spacing.md,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $protocolButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.md,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: spacing.xs,
})

const $protocolButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "flex-end",
})

const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: spacing.lg,
  maxHeight: "80%",
})

const $modalHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.md,
})

const $searchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $protocolFlatList: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  maxHeight: 400,
  marginBottom: spacing.md,
})

const $protocolItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.md,
  marginBottom: spacing.xs,
  flexDirection: "row",
  alignItems: "center",
})

const $emptyProtocols: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xl,
  alignItems: "center",
})

const $typeRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $typeCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  alignItems: "center",
  gap: spacing.xs,
  borderWidth: 2,
  borderColor: "transparent",
})

const $typeCardActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.tint,
  backgroundColor: colors.palette.primary100,
})

const $typeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  color: colors.textDim,
  fontWeight: "500",
})

const $typeTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $checkboxRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginVertical: spacing.sm,
})

const $sexRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  flexWrap: "wrap",
})

const $sexChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 20,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
  borderWidth: 1.5,
  borderColor: colors.palette.neutral300,
})

const $sexChipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
  borderColor: colors.tint,
})

const $sexChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
})

const $sexChipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $ageRangeRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $halfWidth: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $saveButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
  marginBottom: spacing.xxl,
})
