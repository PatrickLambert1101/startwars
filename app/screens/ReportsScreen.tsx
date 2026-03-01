import { FC, useEffect, useState } from "react"
import { Share, View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useDatabase } from "@/context/DatabaseContext"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { HealthRecord } from "@/db/models/HealthRecord"
import { WeightRecord } from "@/db/models/WeightRecord"
import { BreedingRecord } from "@/db/models/BreedingRecord"
import { Q } from "@nozbe/watermelondb"

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
}

export const ReportsScreen: FC = () => {
  const { themed } = useAppTheme()
  const { currentOrg } = useDatabase()
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setIsLoading(false)
      return
    }

    const loadReport = async () => {
      const animals = await database.get<Animal>("animals")
        .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
        .fetch()

      const healthRecordCount = await database.get<HealthRecord>("health_records")
        .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
        .fetchCount()

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

      setReport({
        totalHead: animals.length,
        byStatus,
        bySex,
        byBreed,
        healthRecordCount,
        weightRecordCount: weightRecords.length,
        breedingRecordCount: totalBreedings,
        avgWeight,
        pregnancyRate,
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

      <Button
        text="Export Herd as CSV"
        preset="reversed"
        onPress={handleExportCSV}
        style={themed($exportButton)}
      />
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
