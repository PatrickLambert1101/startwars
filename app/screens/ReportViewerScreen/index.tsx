import { FC, useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Alert, SectionList, View, ViewStyle, TextStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { AppHeader, Button, FriendlyEmpty, Screen, Text } from "@/components"
import { useDatabase } from "@/context/DatabaseContext"
import { useReportTemplate, useReportTemplateActions } from "@/hooks/useReportTemplates"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { exportReportAsCsv, reportGroupLabel } from "@/services/reports/csvExport"
import { exportReportPdf } from "@/services/reports/pdfExport"
import {
  parseReportConfig,
  runReport,
  type ReportResult,
  type ReportRow,
} from "@/services/reports/reportEngine"
import { exportReportAsXlsx } from "@/services/reports/xlsxExport"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

type ViewerSection = { title: string; count: number; data: ReportRow[] }

type BusyKind = "pdf" | "xlsx" | "csv" | null

/**
 * Runs a report (saved template or ad-hoc drill-down from the dashboard) and
 * shows the grouped animals with one-tap PDF / Excel / CSV export.
 */
export const ReportViewerScreen: FC<AppStackScreenProps<"ReportViewer">> = ({
  route,
  navigation,
}) => {
  const { templateId, adHocConfig, title } = route.params
  const { t } = useTranslation()
  const { themed, theme } = useAppTheme()
  const { currentOrg } = useDatabase()
  const { template, isLoading: templateLoading } = useReportTemplate(templateId)
  const { touchLastRun } = useReportTemplateActions()

  const [result, setResult] = useState<ReportResult | null>(null)
  const [isRunning, setIsRunning] = useState(true)
  const [busy, setBusy] = useState<BusyKind>(null)

  const reportName = template?.name ?? title ?? t("reportsScreen.viewer.defaultTitle")

  useEffect(() => {
    if (!currentOrg) return
    if (templateId && templateLoading) return

    const config = template?.config ?? (adHocConfig ? parseReportConfig(adHocConfig) : null)
    if (!config) {
      setIsRunning(false)
      return
    }

    setIsRunning(true)
    runReport(currentOrg.id, config)
      .then((reportResult) => {
        setResult(reportResult)
        if (templateId) touchLastRun(templateId).catch(() => undefined)
      })
      .catch((error) => {
        console.error("[ReportViewer] run failed:", error)
        Alert.alert(t("errors.somethingWentWrong"), t("errors.tryAgain"))
      })
      .finally(() => setIsRunning(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg, templateId, template, templateLoading, adHocConfig])

  const handleExport = useCallback(
    async (kind: Exclude<BusyKind, null>) => {
      if (!result || !currentOrg) return
      setBusy(kind)
      try {
        if (kind === "pdf") {
          await exportReportPdf(result, reportName, currentOrg.name, currentOrg.location, null, t)
        } else if (kind === "xlsx") {
          await exportReportAsXlsx(result, reportName.replace(/\s+/g, "_"), currentOrg.name, t)
        } else {
          await exportReportAsCsv(result, reportName.replace(/\s+/g, "_"), t)
        }
      } catch (error) {
        console.error(`[ReportViewer] ${kind} export failed:`, error)
        Alert.alert(t("errors.somethingWentWrong"), t("errors.tryAgain"))
      } finally {
        setBusy(null)
      }
    },
    [result, currentOrg, reportName, t],
  )

  const sections: ViewerSection[] = result
    ? result.groups.map((group) => ({
        title: result.config.groupBy
          ? reportGroupLabel(result, group, t)
          : t("reportsScreen.viewer.allAnimals"),
        count: group.rows.length,
        data: group.rows,
      }))
    : []

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($screen)}>
      <AppHeader title={reportName} showBack={true} showSettings={false} />

      {isRunning ? (
        <View style={themed($centered)}>
          <ActivityIndicator color={theme.colors.tint} />
          <Text size="sm" text={t("reportsScreen.viewer.running")} style={themed($dim)} />
        </View>
      ) : !result || result.totalCount === 0 ? (
        <FriendlyEmpty
          icon="magnify"
          heading={t("reportsScreen.viewer.emptyTitle")}
          content={t("reportsScreen.viewer.emptyDescription")}
          buttonText={t("common.back")}
          onButtonPress={() => navigation.goBack()}
          style={themed($empty)}
        />
      ) : (
        <>
          <View style={themed($summaryRow)}>
            <Text
              preset="bold"
              text={t("reportsScreen.viewer.totalAnimals", { count: result.totalCount })}
            />
            {result.config.groupBy ? (
              <Text
                size="xs"
                text={t("reportsScreen.viewer.groupedBy", {
                  field: t(`reportsScreen.groupBy.${result.config.groupBy}`),
                })}
                style={themed($dim)}
              />
            ) : null}
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(row, index) => `${row.animal.id}_${index}`}
            style={themed($list)}
            stickySectionHeadersEnabled
            renderSectionHeader={({ section }) => (
              <View style={themed($sectionHeader)}>
                <Text preset="bold" size="sm" text={section.title} />
                <Text size="xs" text={String(section.count)} style={themed($dim)} />
              </View>
            )}
            renderItem={({ item }) => (
              <View style={themed($row)}>
                <View style={themed($rowText)}>
                  <Text size="sm" preset="bold" text={item.animal.displayName} />
                  <Text
                    size="xs"
                    text={`${item.animal.breed} • ${item.animal.sexLabel}${
                      item.ageMonths !== null
                        ? ` • ${t("reportsScreen.viewer.months", { count: item.ageMonths })}`
                        : ""
                    }`}
                    style={themed($dim)}
                  />
                </View>
                <View style={themed($rowRight)}>
                  <Text size="xs" text={item.animal.visualTag} style={themed($dim)} />
                  {item.latestWeightKg !== null ? (
                    <Text size="xs" preset="bold" text={`${item.latestWeightKg} kg`} />
                  ) : null}
                </View>
              </View>
            )}
          />

          <View style={themed($exportBar)}>
            <Button
              preset="filled"
              style={themed($exportButton)}
              onPress={() => handleExport("pdf")}
              disabled={busy !== null}
              LeftAccessory={() => (
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={20}
                  color="#fff"
                  style={themed($buttonIcon)}
                />
              )}
              text={busy === "pdf" ? t("reportsScreen.export.working") : "PDF"}
            />
            <Button
              preset="filled"
              style={themed($exportButton)}
              onPress={() => handleExport("xlsx")}
              disabled={busy !== null}
              LeftAccessory={() => (
                <MaterialCommunityIcons
                  name="file-excel"
                  size={20}
                  color="#fff"
                  style={themed($buttonIcon)}
                />
              )}
              text={busy === "xlsx" ? t("reportsScreen.export.working") : "Excel"}
            />
            <Button
              preset="filled"
              style={themed($exportButton)}
              onPress={() => handleExport("csv")}
              disabled={busy !== null}
              LeftAccessory={() => (
                <MaterialCommunityIcons
                  name="file-delimited"
                  size={20}
                  color="#fff"
                  style={themed($buttonIcon)}
                />
              )}
              text={busy === "csv" ? t("reportsScreen.export.working") : "CSV"}
            />
          </View>
        </>
      )}
    </Screen>
  )
}

const $screen: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  // Screen's "fixed" preset justifies content flex-end; override so the
  // AppHeader stays pinned at the top instead of drifting to center.
  justifyContent: "flex-start",
})

const $centered: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
})

const $empty: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
})

const $summaryRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
})

const $list: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.sm,
})

const $sectionHeader: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: colors.palette.primary100,
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  marginTop: spacing.xs,
})

const $row: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
  backgroundColor: colors.palette.neutral100,
})

const $rowText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $rowRight: ThemedStyle<ViewStyle> = () => ({
  alignItems: "flex-end",
})

const $exportBar: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  padding: spacing.sm,
  backgroundColor: colors.background,
})

const $exportButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  minHeight: 48,
})

const $buttonIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginEnd: spacing.xxs,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})
