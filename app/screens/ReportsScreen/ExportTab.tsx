import { FC, useEffect, useState } from "react"
import {
  Alert,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Q } from "@nozbe/watermelondb"
import { useTranslation } from "react-i18next"

import { Button, Icon, Text } from "@/components"
import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { OrganizationMember } from "@/db/models/OrganizationMember"
import { exportReportAsCsv } from "@/services/reports/csvExport"
import { exportTraceabilityPdf } from "@/services/reports/pdfExport"
import {
  ALL_ANIMAL_COLUMNS,
  ALL_REPORT_SECTIONS,
  DEFAULT_REPORT_COLUMNS,
  DEFAULT_REPORT_FILTERS,
} from "@/services/reports/reportConfig"
import { runReport } from "@/services/reports/reportEngine"
import { exportReportAsXlsx } from "@/services/reports/xlsxExport"
import { generateTraceabilityReport } from "@/services/traceabilityReport"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

type BusyKind = "traceability" | "xlsx" | "csv" | null

export const ExportTab: FC = () => {
  const { t } = useTranslation()
  const { themed, theme } = useAppTheme()
  const { currentOrg } = useDatabase()
  const { user } = useAuth()

  const [animals, setAnimals] = useState<Animal[]>([])
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<Set<string>>(new Set())
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null)
  const [busy, setBusy] = useState<BusyKind>(null)

  useEffect(() => {
    if (!currentOrg) return

    const subscription = database
      .get<Animal>("animals")
      .query(
        Q.where("organization_id", currentOrg.id),
        Q.where("is_deleted", false),
        Q.sortBy("visual_tag", Q.asc),
      )
      .observe()
      .subscribe(setAnimals)

    return () => subscription.unsubscribe()
  }, [currentOrg])

  useEffect(() => {
    if (!currentOrg || !user) return
    database
      .get<OrganizationMember>("organization_members")
      .query(
        Q.where("user_id", user.id),
        Q.where("organization_id", currentOrg.id),
        Q.where("is_active", true),
      )
      .fetch()
      .then((memberships) => {
        if (memberships.length > 0 && memberships[0].userDisplayName) {
          setUserDisplayName(memberships[0].userDisplayName)
        }
      })
      .catch(() => undefined)
  }, [currentOrg, user])

  const toggleAnimalSelection = (animalId: string) => {
    setSelectedAnimalIds((prev) => {
      const next = new Set(prev)
      if (next.has(animalId)) next.delete(animalId)
      else next.add(animalId)
      return next
    })
  }

  const handleTraceabilityPdf = async () => {
    if (!currentOrg) return
    if (selectedAnimalIds.size === 0) {
      Alert.alert(
        t("common.required", { defaultValue: "Required" }),
        t("reportsScreen.traceability.noSelection"),
      )
      return
    }
    setBusy("traceability")
    try {
      const reportData = await generateTraceabilityReport(
        Array.from(selectedAnimalIds),
        currentOrg.name,
        currentOrg.location,
        userDisplayName,
      )
      await exportTraceabilityPdf(reportData, t)
    } catch (error) {
      console.error("[ExportTab] Traceability PDF failed:", error)
      Alert.alert(t("errors.somethingWentWrong"), t("errors.tryAgain"))
    } finally {
      setBusy(null)
    }
  }

  const handleFullHerdXlsx = async () => {
    if (!currentOrg) return
    setBusy("xlsx")
    try {
      const result = await runReport(currentOrg.id, {
        filters: DEFAULT_REPORT_FILTERS,
        groupBy: null,
        columns: ALL_ANIMAL_COLUMNS,
        sections: ALL_REPORT_SECTIONS,
      })
      await exportReportAsXlsx(result, "HerdTrackr_Full_Herd", currentOrg.name, t)
    } catch (error) {
      console.error("[ExportTab] xlsx export failed:", error)
      Alert.alert(t("errors.somethingWentWrong"), t("errors.tryAgain"))
    } finally {
      setBusy(null)
    }
  }

  const handleHerdCsv = async () => {
    if (!currentOrg) return
    setBusy("csv")
    try {
      const result = await runReport(currentOrg.id, {
        filters: DEFAULT_REPORT_FILTERS,
        groupBy: null,
        columns: DEFAULT_REPORT_COLUMNS,
        sections: [],
      })
      await exportReportAsCsv(result, "HerdTrackr_Herd_List", t)
    } catch (error) {
      console.error("[ExportTab] CSV export failed:", error)
      Alert.alert(t("errors.somethingWentWrong"), t("errors.tryAgain"))
    } finally {
      setBusy(null)
    }
  }

  return (
    <View>
      {/* Traceability certificate */}
      <View style={themed($card)}>
        <View style={themed($cardHeader)}>
          <MaterialCommunityIcons name="certificate" size={28} color={theme.colors.tint} />
          <View style={themed($cardHeaderText)}>
            <Text preset="subheading" text={t("reportsScreen.export.traceability.title")} />
            <Text
              size="xs"
              text={t("reportsScreen.export.traceability.description")}
              style={themed($dim)}
            />
          </View>
        </View>

        <View style={themed($selectionControls)}>
          <Text
            text={t("reportsScreen.traceability.selected", { count: selectedAnimalIds.size })}
            preset="bold"
            size="sm"
          />
          <View style={themed($selectionButtons)}>
            <Pressable
              onPress={() => setSelectedAnimalIds(new Set(animals.map((a) => a.id)))}
              style={themed($smallChip)}
            >
              <Text size="xs" text={t("reportsScreen.traceability.selectAll")} />
            </Pressable>
            <Pressable onPress={() => setSelectedAnimalIds(new Set())} style={themed($smallChip)}>
              <Text size="xs" text={t("reportsScreen.traceability.clear")} />
            </Pressable>
          </View>
        </View>

        <ScrollView style={themed($animalList)} nestedScrollEnabled>
          {animals.map((animal) => {
            const isSelected = selectedAnimalIds.has(animal.id)
            return (
              <TouchableOpacity
                key={animal.id}
                onPress={() => toggleAnimalSelection(animal.id)}
                style={themed(isSelected ? $animalItemSelected : $animalItem)}
              >
                <View style={themed($animalItemLeft)}>
                  <View style={[themed($checkbox), !isSelected && themed($checkboxEmpty)]}>
                    {isSelected && <Icon icon="check" size={16} color="#fff" />}
                  </View>
                  <View>
                    <Text text={animal.displayName} preset="bold" size="sm" />
                    <Text
                      text={`${animal.breed} • ${animal.sexLabel}`}
                      size="xs"
                      style={themed($dim)}
                    />
                  </View>
                </View>
                <Text text={animal.visualTag} size="xs" style={themed($dim)} />
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <Button
          text={
            busy === "traceability"
              ? t("reportsScreen.traceability.generating")
              : t("reportsScreen.export.traceability.button")
          }
          preset="filled"
          onPress={handleTraceabilityPdf}
          disabled={selectedAnimalIds.size === 0 || busy !== null}
        />
      </View>

      {/* Full herd Excel */}
      <View style={themed($card)}>
        <View style={themed($cardHeader)}>
          <MaterialCommunityIcons name="file-excel" size={28} color={theme.colors.tint} />
          <View style={themed($cardHeaderText)}>
            <Text preset="subheading" text={t("reportsScreen.export.excel.title")} />
            <Text
              size="xs"
              text={t("reportsScreen.export.excel.description")}
              style={themed($dim)}
            />
          </View>
        </View>
        <Button
          text={
            busy === "xlsx"
              ? t("reportsScreen.export.working")
              : t("reportsScreen.export.excel.button")
          }
          onPress={handleFullHerdXlsx}
          disabled={busy !== null || animals.length === 0}
        />
      </View>

      {/* Simple CSV */}
      <View style={themed($card)}>
        <View style={themed($cardHeader)}>
          <MaterialCommunityIcons name="file-delimited" size={28} color={theme.colors.tint} />
          <View style={themed($cardHeaderText)}>
            <Text preset="subheading" text={t("reportsScreen.export.csv.title")} />
            <Text size="xs" text={t("reportsScreen.export.csv.description")} style={themed($dim)} />
          </View>
        </View>
        <Button
          text={
            busy === "csv"
              ? t("reportsScreen.export.working")
              : t("reportsScreen.export.csv.button")
          }
          onPress={handleHerdCsv}
          disabled={busy !== null || animals.length === 0}
        />
      </View>
    </View>
  )
}

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 14,
  padding: spacing.md,
  marginBottom: spacing.sm,
})

const $cardHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
  marginBottom: spacing.sm,
})

const $cardHeaderText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $selectionControls: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.xs,
})

const $selectionButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})

const $smallChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 14,
  backgroundColor: colors.palette.neutral200,
  minHeight: 32,
  justifyContent: "center",
})

const $animalList: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  maxHeight: 220,
  marginBottom: spacing.sm,
})

const $animalItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $animalItemSelected: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
  backgroundColor: colors.palette.primary100,
})

const $animalItemLeft: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $checkbox: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 22,
  height: 22,
  borderRadius: 4,
  borderWidth: 2,
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary500,
  justifyContent: "center",
  alignItems: "center",
})

const $checkboxEmpty: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.transparent,
  borderColor: colors.border,
})
