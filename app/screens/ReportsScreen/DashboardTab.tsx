import { FC, useState } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { Pressable } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"

import { Text, FriendlyEmpty } from "@/components"
import {
  ChartCard,
  DonutChart,
  HorizontalBarList,
  LineTrendChart,
  StatPill,
} from "@/components/charts"
import type { BarItem, DonutSlice } from "@/components/charts"
import { useReportAggregates } from "@/hooks/useReportAggregates"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import {
  DEFAULT_REPORT_COLUMNS,
  DEFAULT_REPORT_FILTERS,
  serializeReportConfig,
  type AgeBracketKey,
  type ReportConfig,
  type ReportFilters,
} from "@/services/reports/reportConfig"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

type NavigationProp = NativeStackNavigationProp<AppStackParamList>

type MakeupDimension = "breed" | "sex" | "age"

/** Age bracket -> ageFrom/ageTo months for drill-down filters. */
const AGE_BRACKET_RANGES: Partial<
  Record<AgeBracketKey, { from: number | null; to: number | null }>
> = {
  "under_6m": { from: 0, to: 5 },
  "6_12m": { from: 6, to: 11 },
  "1_2y": { from: 12, to: 23 },
  "2_5y": { from: 24, to: 59 },
  "over_5y": { from: 60, to: null },
}

const STATUS_PALETTE: Record<string, string> = {
  active: "#739134",
  sold: "#96805F",
  deceased: "#D64220",
  transferred: "#F5AD1C",
}

const SEX_PALETTE = ["#739134", "#95AB65", "#7A6644", "#B5AFA6"]

export const DashboardTab: FC = () => {
  const { t } = useTranslation()
  const { themed, theme } = useAppTheme()
  const navigation = useNavigation<NavigationProp>()
  const { aggregates, isLoading } = useReportAggregates()
  const [makeupDimension, setMakeupDimension] = useState<MakeupDimension>("breed")

  const { composition, growth, breeding, vaccinations, pastures } = aggregates

  const openDrilldown = (title: string, filters: Partial<ReportFilters>) => {
    const config: ReportConfig = {
      filters: { ...DEFAULT_REPORT_FILTERS, ...filters },
      groupBy: null,
      columns: DEFAULT_REPORT_COLUMNS,
      sections: [],
    }
    navigation.navigate("ReportViewer", { adHocConfig: serializeReportConfig(config), title })
  }

  if (!isLoading && composition.totalHead === 0) {
    return (
      <FriendlyEmpty
        icon="chart-box-outline"
        heading={t("reportsScreen.dashboard.emptyTitle")}
        content={t("reportsScreen.noAnimals")}
        style={themed($empty)}
      />
    )
  }

  // --- Herd at a glance ----------------------------------------------------
  const statusSlices: DonutSlice[] = Object.entries(composition.byStatus).map(
    ([status, count]) => ({
      key: status,
      label: t(`reportsScreen.statuses.${status}`, { defaultValue: status }),
      value: count,
      color: STATUS_PALETTE[status] ?? theme.colors.palette.neutral400,
    }),
  )

  // --- Herd makeup ---------------------------------------------------------
  const makeupItems: BarItem[] =
    makeupDimension === "breed"
      ? Object.entries(composition.byBreed).map(([breed, count]) => ({
          key: breed,
          label: breed,
          value: count,
        }))
      : makeupDimension === "sex"
        ? Object.entries(composition.bySex).map(([sex, count], index) => ({
            key: sex,
            label: t(`reportsScreen.sexes.${sex}`, { defaultValue: sex }),
            value: count,
            color: SEX_PALETTE[index % SEX_PALETTE.length],
          }))
        : (Object.entries(composition.byAgeBracket) as [AgeBracketKey, number][])
            .filter(([, count]) => count > 0)
            .map(([bracket, count]) => ({
              key: bracket,
              label: t(`reportsScreen.ageBrackets.${bracket}`),
              value: count,
            }))

  const onMakeupPress = (item: BarItem) => {
    if (makeupDimension === "breed") {
      openDrilldown(item.label, { breeds: [item.key] })
    } else if (makeupDimension === "sex") {
      openDrilldown(item.label, { sexes: [item.key] })
    } else {
      const range = AGE_BRACKET_RANGES[item.key as AgeBracketKey]
      if (range) openDrilldown(item.label, { ageFromMonths: range.from, ageToMonths: range.to })
    }
  }

  // --- Breeding ------------------------------------------------------------
  const outcomeItems: BarItem[] = Object.entries(breeding.byOutcome)
    .filter(([, count]) => count > 0)
    .map(([outcome, count]) => ({
      key: outcome,
      label: t(`reportsScreen.breedingOutcomes.${outcome}`, { defaultValue: outcome }),
      value: count,
      color:
        outcome === "live_calf"
          ? theme.colors.palette.primary500
          : theme.colors.palette.secondary300,
    }))

  // --- Pastures ------------------------------------------------------------
  const pastureItems: BarItem[] = pastures.map((pasture) => ({
    key: pasture.id,
    label: pasture.name,
    value: pasture.currentCount,
    valueLabel: pasture.maxCapacity
      ? `${pasture.currentCount}/${pasture.maxCapacity}`
      : String(pasture.currentCount),
    color:
      pasture.maxCapacity && pasture.currentCount > pasture.maxCapacity
        ? theme.colors.error
        : theme.colors.palette.primary400,
  }))

  return (
    <View>
      <ChartCard
        title={t("reportsScreen.dashboard.glance.title")}
        subtitle={t("reportsScreen.dashboard.glance.subtitle")}
      >
        <View style={themed($pillRow)}>
          <StatPill
            label={t("reportsScreen.herdSummary.totalHead")}
            value={String(composition.totalHead)}
          />
          <StatPill
            label={t("reportsScreen.statuses.active")}
            value={String(composition.activeCount)}
          />
          <StatPill
            label={t("reportsScreen.dashboard.glance.dueToCalve")}
            value={String(breeding.pendingCount)}
            tone={breeding.pendingCount > 0 ? "warn" : "neutral"}
          />
        </View>
        {statusSlices.length > 1 ? (
          <DonutChart
            slices={statusSlices}
            centerValue={String(composition.totalHead)}
            centerLabel={t("reportsScreen.herdSummary.totalHead")}
            onSlicePress={(slice) => openDrilldown(slice.label, { statuses: [slice.key] })}
          />
        ) : null}
      </ChartCard>

      <ChartCard
        title={t("reportsScreen.dashboard.makeup.title")}
        subtitle={t("reportsScreen.dashboard.makeup.subtitle")}
      >
        <View style={themed($chipRow)}>
          {(["breed", "sex", "age"] as MakeupDimension[]).map((dimension) => {
            const isActive = makeupDimension === dimension
            return (
              <Pressable
                key={dimension}
                onPress={() => setMakeupDimension(dimension)}
                style={[themed($chip), isActive && themed($chipActive)]}
                accessibilityRole="button"
              >
                <Text
                  size="xs"
                  preset={isActive ? "bold" : "default"}
                  text={t(`reportsScreen.dashboard.makeup.${dimension}`)}
                  style={isActive ? themed($chipTextActive) : undefined}
                />
              </Pressable>
            )
          })}
        </View>
        <HorizontalBarList
          items={makeupItems}
          otherLabel={t("reportsScreen.dashboard.other")}
          onItemPress={onMakeupPress}
        />
      </ChartCard>

      <ChartCard
        title={t("reportsScreen.dashboard.growth.title")}
        subtitle={t("reportsScreen.dashboard.growth.subtitle")}
      >
        <View style={themed($pillRow)}>
          <StatPill
            label={t("reportsScreen.dashboard.growth.avgWeight")}
            value={growth.latestAvgKg !== null ? `${growth.latestAvgKg} kg` : "—"}
          />
          <StatPill
            label={t("reportsScreen.dashboard.growth.adg")}
            value={growth.adgKgPerDay !== null ? `${growth.adgKgPerDay} kg` : "—"}
            tone={growth.adgKgPerDay !== null && growth.adgKgPerDay < 0 ? "alert" : "brand"}
          />
        </View>
        <LineTrendChart
          points={growth.trend.map((point) => ({ label: point.label, value: point.avgKg }))}
          unit=""
          emptyText={t("reportsScreen.dashboard.growth.empty")}
        />
      </ChartCard>

      <ChartCard
        title={t("reportsScreen.dashboard.breeding.title")}
        subtitle={t("reportsScreen.dashboard.breeding.subtitle")}
      >
        <View style={themed($pillRow)}>
          <StatPill
            label={t("reportsScreen.dashboard.breeding.calvingRate")}
            value={breeding.calvingRatePct !== null ? `${breeding.calvingRatePct}%` : "—"}
          />
          <StatPill
            label={t("reportsScreen.dashboard.breeding.pending")}
            value={String(breeding.pendingCount)}
            tone="neutral"
          />
        </View>
        {outcomeItems.length > 0 ? (
          <HorizontalBarList items={outcomeItems} otherLabel={t("reportsScreen.dashboard.other")} />
        ) : (
          <Text
            size="xs"
            text={t("reportsScreen.dashboard.breeding.empty")}
            style={themed($emptyText)}
          />
        )}
      </ChartCard>

      <ChartCard
        title={t("reportsScreen.dashboard.vaccinations.title")}
        subtitle={t("reportsScreen.dashboard.vaccinations.subtitle")}
        onPress={() => navigation.navigate("PendingVaccinations")}
      >
        <View style={themed($pillRow)}>
          <StatPill
            label={t("reportsScreen.dashboard.vaccinations.coverage")}
            value={vaccinations.coveragePct !== null ? `${vaccinations.coveragePct}%` : "—"}
            tone={
              vaccinations.coveragePct === null || vaccinations.coveragePct >= 80 ? "brand" : "warn"
            }
          />
          <StatPill
            label={t("reportsScreen.dashboard.vaccinations.overdue")}
            value={String(vaccinations.overdue)}
            tone={vaccinations.overdue > 0 ? "alert" : "brand"}
          />
        </View>
      </ChartCard>

      {pastureItems.length > 0 ? (
        <ChartCard
          title={t("reportsScreen.dashboard.pastures.title")}
          subtitle={t("reportsScreen.dashboard.pastures.subtitle")}
        >
          <HorizontalBarList
            items={pastureItems}
            otherLabel={t("reportsScreen.dashboard.other")}
            onItemPress={(item) => openDrilldown(item.label, { pastureIds: [item.key] })}
          />
        </ChartCard>
      ) : null}
    </View>
  )
}

const $empty: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
})

const $pillRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $chipRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $chip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 16,
  backgroundColor: colors.palette.neutral200,
  minHeight: 32,
  justifyContent: "center",
})

const $chipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
})

const $chipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})
