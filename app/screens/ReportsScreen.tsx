import { FC, useEffect, useState } from "react"
import { Share, View, ViewStyle, TextStyle, Pressable, Alert, ScrollView, TouchableOpacity } from "react-native"

import { Screen, Text, Button, Icon } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useDatabase } from "@/context/DatabaseContext"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { HealthRecord } from "@/db/models/HealthRecord"
import { WeightRecord } from "@/db/models/WeightRecord"
import { BreedingRecord } from "@/db/models/BreedingRecord"
import { Q } from "@nozbe/watermelondb"
import { differenceInMonths, differenceInDays } from "date-fns"
import { generateTraceabilityReport, formatFullTraceabilityReport } from "@/services/traceabilityReport"

type ReportData = {
  totalHead: number
  byStatus: Record<string, number>
  bySex: Record<string, number>
  byBreed: Record<string, number>
  healthRecordCount: number
  weightRecordCount: number
  breedingRecordCount: number
  avgWeight: number | null
  pregnancyRate: number | null
  treatmentStats: {
    vaccinations: number
    treatments: number
    deworming: number
  }
  animalsNeedingAttention: Array<{
    id: string
    name: string
    ageMonths: number
    reason: string
  }>
}

export const ReportsScreen: FC = () => {
  const { themed } = useAppTheme()
  const { currentOrg } = useDatabase()
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [allAnimals, setAllAnimals] = useState<Animal[]>([])
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<Set<string>>(new Set())
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  useEffect(() => {
    if (!currentOrg) {
      setIsLoading(false)
      return
    }

    const loadReport = async () => {
      const animals = await database.get<Animal>("animals")
        .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
        .fetch()

      setAllAnimals(animals)

      const healthRecords = await database.get<HealthRecord>("health_records")
        .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
        .fetch()

      const weightRecords = await database.get<WeightRecord>("weight_records")
        .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
        .fetch()

      const breedingRecords = await database.get<BreedingRecord>("breeding_records")
        .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
        .fetch()

      const byStatus: Record<string, number> = {}
      const bySex: Record<string, number> = {}
      const byBreed: Record<string, number> = {}

      for (const a of animals) {
        byStatus[a.status] = (byStatus[a.status] || 0) + 1
        bySex[a.sex] = (bySex[a.sex] || 0) + 1
        byBreed[a.breed] = (byBreed[a.breed] || 0) + 1
      }

      const avgWeight = weightRecords.length > 0
        ? weightRecords.reduce((sum, r) => sum + r.weightKg, 0) / weightRecords.length
        : null

      const totalBreedings = breedingRecords.length
      const liveCalves = breedingRecords.filter((r) => r.outcome === "live_calf").length
      const pregnancyRate = totalBreedings > 0 ? (liveCalves / totalBreedings) * 100 : null

      // Calculate treatment statistics
      const treatmentStats = {
        vaccinations: healthRecords.filter((r) => r.recordType === "vaccination").length,
        treatments: healthRecords.filter((r) => r.recordType === "treatment").length,
        deworming: healthRecords.filter((r) => r.recordType === "other").length,
      }

      // Find animals needing attention (calves without key vaccinations)
      const animalsNeedingAttention: Array<{
        id: string
        name: string
        ageMonths: number
        reason: string
      }> = []

      const now = new Date()

      for (const animal of animals) {
        if (!animal.dateOfBirth) continue

        const ageMonths = differenceInMonths(now, new Date(animal.dateOfBirth))

        // Only check calves up to 12 months old
        if (ageMonths < 0 || ageMonths > 12) continue

        // Get this animal's health records
        const animalHealthRecords = healthRecords.filter((r) => r.animalId === animal.id)
        const vaccinationRecords = animalHealthRecords.filter((r) => r.recordType === "vaccination")

        // Check vaccination schedule based on age
        if (ageMonths >= 2 && vaccinationRecords.length === 0) {
          animalsNeedingAttention.push({
            id: animal.id,
            name: animal.name || animal.visualTag,
            ageMonths,
            reason: "No vaccinations recorded - calves should be vaccinated by 2 months",
          })
        } else if (ageMonths >= 6 && vaccinationRecords.length < 2) {
          animalsNeedingAttention.push({
            id: animal.id,
            name: animal.name || animal.visualTag,
            ageMonths,
            reason: "May need booster shots - typically required by 6 months",
          })
        }
      }

      setReport({
        totalHead: animals.length,
        byStatus,
        bySex,
        byBreed,
        healthRecordCount: healthRecords.length,
        weightRecordCount: weightRecords.length,
        breedingRecordCount: totalBreedings,
        avgWeight,
        pregnancyRate,
        treatmentStats,
        animalsNeedingAttention,
      })
      setIsLoading(false)
    }

    loadReport()
  }, [currentOrg])

  const handleExportCSV = async () => {
    if (!currentOrg) return

    const animals = await database.get<Animal>("animals")
      .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
      .fetch()

    const header = "Visual Tag,RFID Tag,Name,Breed,Sex,Status,Notes"
    const rows = animals.map((a) =>
      [a.visualTag, a.rfidTag, a.name || "", a.breed, a.sex, a.status, (a.notes || "").replace(/,/g, ";")]
        .map((v) => `"${v}"`)
        .join(","),
    )
    const csv = [header, ...rows].join("\n")

    await Share.share({
      message: csv,
      title: "HerdTrackr Export",
    })
  }

  const toggleAnimalSelection = (animalId: string) => {
    setSelectedAnimalIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(animalId)) {
        newSet.delete(animalId)
      } else {
        newSet.add(animalId)
      }
      return newSet
    })
  }

  const selectAllAnimals = () => {
    setSelectedAnimalIds(new Set(allAnimals.map((a) => a.id)))
  }

  const clearSelection = () => {
    setSelectedAnimalIds(new Set())
  }

  const handleGenerateTraceabilityReport = async () => {
    if (!currentOrg || selectedAnimalIds.size === 0) {
      Alert.alert("No Selection", "Please select at least one animal to generate a traceability report.")
      return
    }

    setIsGeneratingReport(true)

    try {
      const reportData = await generateTraceabilityReport(
        Array.from(selectedAnimalIds),
        currentOrg.name,
        currentOrg.location,
      )

      const formattedReport = formatFullTraceabilityReport(reportData)

      // Create a descriptive filename
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const animalCount = selectedAnimalIds.size
      const fileName = animalCount === 1
        ? `Livestock_Traceability_${allAnimals.find(a => selectedAnimalIds.has(a.id))?.visualTag || 'Animal'}_${today}.txt`
        : `Livestock_Traceability_${animalCount}_Animals_${today}.txt`

      await Share.share({
        message: formattedReport,
        title: fileName,
      })
    } catch (error) {
      console.error("Error generating traceability report:", error)
      Alert.alert("Error", "Failed to generate traceability report. Please try again.")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  if (isLoading) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]}>
        <View style={themed($centered)}>
          <Text text="Loading reports..." />
        </View>
      </Screen>
    )
  }

  if (!report || report.totalHead === 0) {
    return (
      <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
        <Text preset="heading" text="Reports" style={themed($heading)} />
        <Text text="Add animals to see reports and analytics." style={themed($dimText)} />
      </Screen>
    )
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <Text preset="heading" text="Reports" style={themed($heading)} />

      <View style={themed($card)}>
        <Text preset="subheading" text="Herd Summary" style={themed($cardTitle)} />
        <SummaryRow label="Total Head" value={String(report.totalHead)} themed={themed} />
        {Object.entries(report.byStatus).map(([k, v]) => (
          <SummaryRow key={k} label={`  ${k}`} value={String(v)} themed={themed} />
        ))}
      </View>

      <View style={themed($card)}>
        <Text preset="subheading" text="By Sex" style={themed($cardTitle)} />
        {Object.entries(report.bySex).map(([k, v]) => (
          <SummaryRow key={k} label={k} value={String(v)} themed={themed} />
        ))}
      </View>

      <View style={themed($card)}>
        <Text preset="subheading" text="By Breed" style={themed($cardTitle)} />
        {Object.entries(report.byBreed).map(([k, v]) => (
          <SummaryRow key={k} label={k} value={String(v)} themed={themed} />
        ))}
      </View>

      <View style={themed($card)}>
        <Text preset="subheading" text="Records" style={themed($cardTitle)} />
        <SummaryRow label="Health records" value={String(report.healthRecordCount)} themed={themed} />
        <SummaryRow label="Weight records" value={String(report.weightRecordCount)} themed={themed} />
        <SummaryRow label="Breeding records" value={String(report.breedingRecordCount)} themed={themed} />
        {report.avgWeight !== null && (
          <SummaryRow label="Avg weight" value={`${report.avgWeight.toFixed(1)} kg`} themed={themed} />
        )}
        {report.pregnancyRate !== null && (
          <SummaryRow label="Calving success" value={`${report.pregnancyRate.toFixed(0)}%`} themed={themed} />
        )}
      </View>

      <View style={themed($card)}>
        <Text preset="subheading" text="Treatment Statistics" style={themed($cardTitle)} />
        <SummaryRow label="Vaccinations" value={String(report.treatmentStats.vaccinations)} themed={themed} />
        <SummaryRow label="Treatments" value={String(report.treatmentStats.treatments)} themed={themed} />
        <SummaryRow label="Deworming" value={String(report.treatmentStats.deworming)} themed={themed} />
        <SummaryRow
          label="Total health events"
          value={String(report.treatmentStats.vaccinations + report.treatmentStats.treatments + report.treatmentStats.deworming)}
          themed={themed}
        />
      </View>

      {report.animalsNeedingAttention.length > 0 && (
        <View style={themed($alertCard)}>
          <View style={themed($alertHeader)}>
            <Icon icon="caretRight" size={20} color="#E53E3E" />
            <Text preset="subheading" text="Animals Needing Attention" style={themed($alertTitle)} />
          </View>
          <Text style={themed($alertSubtext)}>
            {report.animalsNeedingAttention.length} {report.animalsNeedingAttention.length === 1 ? 'animal needs' : 'animals need'} attention
          </Text>
          {report.animalsNeedingAttention.map((animal) => (
            <View key={animal.id} style={themed($alertItem)}>
              <View style={themed($alertItemHeader)}>
                <Text preset="bold" style={themed($alertItemName)}>
                  {animal.name}
                </Text>
                <Text size="xs" style={themed($alertItemAge)}>
                  {animal.ageMonths} months old
                </Text>
              </View>
              <Text size="sm" style={themed($alertItemReason)}>
                {animal.reason}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Button
        text="Export Herd as CSV"
        preset="reversed"
        onPress={handleExportCSV}
        style={themed($exportButton)}
      />

      <View style={themed($traceabilitySection)}>
        <Text preset="subheading" text="Animal Traceability Reports" style={themed($sectionTitle)} />
        <Text style={themed($sectionDescription)}>
          Generate comprehensive traceability reports for individual animals or groups. Reports include complete
          history: health records, weights, breeding, movements, and photos.
        </Text>

        <View style={themed($selectionControls)}>
          <Text text={`${selectedAnimalIds.size} selected`} preset="bold" size="sm" />
          <View style={themed($selectionButtons)}>
            <Button
              text="Select All"
              preset="default"
              onPress={selectAllAnimals}
              style={themed($smallButton)}
              textStyle={themed($smallButtonText)}
            />
            <Button
              text="Clear"
              preset="default"
              onPress={clearSelection}
              style={themed($smallButton)}
              textStyle={themed($smallButtonText)}
            />
          </View>
        </View>

        <View style={themed($animalList)}>
          {allAnimals.map((animal) => {
            const isSelected = selectedAnimalIds.has(animal.id)
            return (
              <TouchableOpacity
                key={animal.id}
                onPress={() => toggleAnimalSelection(animal.id)}
                style={themed(isSelected ? $animalItemSelected : $animalItem)}
              >
                <View style={themed($animalItemLeft)}>
                  <View style={themed($checkbox)}>
                    {isSelected && <Icon icon="check" size={16} color="#fff" />}
                  </View>
                  <View>
                    <Text text={animal.displayName} preset="bold" size="sm" />
                    <Text text={`${animal.breed} • ${animal.sexLabel}`} size="xs" style={themed($animalMeta)} />
                  </View>
                </View>
                <Text text={animal.visualTag} size="xs" style={themed($dimText)} />
              </TouchableOpacity>
            )
          })}
        </View>

        <Button
          text={isGeneratingReport ? "Generating Report..." : "Generate & Share Report"}
          preset="filled"
          onPress={handleGenerateTraceabilityReport}
          disabled={selectedAnimalIds.size === 0 || isGeneratingReport}
          style={themed($generateButton)}
        />
      </View>
    </Screen>
  )
}

function SummaryRow({ label, value, themed }: { label: string; value: string; themed: any }) {
  return (
    <View style={themed($summaryRow)}>
      <Text text={label} size="sm" />
      <Text text={value} size="sm" preset="bold" />
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

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.lg,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.md,
})

const $cardTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $summaryRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  paddingVertical: spacing.xxs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $exportButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

const $alertCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: "#FFF5F5",
  borderRadius: 12,
  borderWidth: 2,
  borderColor: "#FEB2B2",
  padding: spacing.md,
  marginBottom: spacing.md,
})

const $alertHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: spacing.xxs,
})

const $alertTitle: ThemedStyle<TextStyle> = () => ({
  color: "#E53E3E",
  marginBottom: 0,
})

const $alertSubtext: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 13,
  color: "#9B2C2C",
  marginBottom: spacing.md,
  fontWeight: "600",
})

const $alertItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: "#FFFFFF",
  borderRadius: 8,
  padding: spacing.sm,
  marginBottom: spacing.xs,
  borderLeftWidth: 3,
  borderLeftColor: "#E53E3E",
})

const $alertItemHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.xxs,
})

const $alertItemName: ThemedStyle<TextStyle> = () => ({
  fontSize: 15,
  color: "#2D3748",
})

const $alertItemAge: ThemedStyle<TextStyle> = () => ({
  fontSize: 12,
  color: "#E53E3E",
  fontWeight: "600",
})

const $alertItemReason: ThemedStyle<TextStyle> = () => ({
  fontSize: 13,
  color: "#4A5568",
  lineHeight: 18,
})

const $traceabilitySection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginTop: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $sectionDescription: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 13,
  color: colors.textDim,
  lineHeight: 18,
  marginBottom: spacing.md,
})

const $selectionControls: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
})

const $selectionButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})

const $smallButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  minHeight: 32,
})

const $smallButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 12,
})

const $animalList: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  maxHeight: 300,
  marginBottom: spacing.md,
})

const $animalItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
  backgroundColor: colors.background,
})

const $animalItemSelected: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
  backgroundColor: colors.palette.primary100,
})

const $animalItemLeft: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $checkbox: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 24,
  height: 24,
  borderRadius: 4,
  borderWidth: 2,
  borderColor: colors.border,
  backgroundColor: colors.palette.primary500,
  justifyContent: "center",
  alignItems: "center",
})

const $animalMeta: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $generateButton: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})
