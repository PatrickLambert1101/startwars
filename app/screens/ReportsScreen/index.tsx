import { FC, useState } from "react"
import { Pressable, View, ViewStyle, TextStyle } from "react-native"
import { useTranslation } from "react-i18next"

import { AppHeader, Screen, Text } from "@/components"
import { BentoPageIntro } from "@/components/BentoPageChrome"
import { bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { DashboardTab } from "./DashboardTab"
import { ExportTab } from "./ExportTab"
import { MyReportsTab } from "./MyReportsTab"

type ReportsTabKey = "dashboard" | "myReports" | "export"

const TABS: ReportsTabKey[] = ["dashboard", "myReports", "export"]

/**
 * Reports hub: a live dashboard of the herd, the farmer's saved custom
 * reports, and one-tap exports (traceability PDF, Excel, CSV).
 */
export const ReportsScreen: FC = () => {
  const { t } = useTranslation()
  const { themed } = useAppTheme()
  const [activeTab, setActiveTab] = useState<ReportsTabKey>("dashboard")

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <AppHeader title={t("reportsScreen.title")} showSettings={true} showBack={true} />
      <BentoPageIntro
        title="Your farm, in focus"
        description="Explore herd trends, saved reports and exports."
        icon="chart-box-outline"
      />

      <View style={themed($segmentRow)}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[themed($segment), isActive && themed($segmentActive)]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                size="sm"
                preset={isActive ? "bold" : "default"}
                text={t(`reportsScreen.tabs.${tab}`)}
                style={isActive ? themed($segmentTextActive) : themed($segmentText)}
              />
            </Pressable>
          )
        })}
      </View>

      {activeTab === "dashboard" ? <DashboardTab /> : null}
      {activeTab === "myReports" ? <MyReportsTab /> : null}
      {activeTab === "export" ? <ExportTab /> : null}
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.lg,
})

const $segmentRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  backgroundColor: colors.palette.primary100,
  borderRadius: 20,
  padding: 3,
  marginBottom: spacing.sm,
})

const $segment: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  minHeight: 44,
  borderRadius: bentoRadii.button,
  alignItems: "center",
  justifyContent: "center",
})

const $segmentActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
})

const $segmentText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $segmentTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
})
