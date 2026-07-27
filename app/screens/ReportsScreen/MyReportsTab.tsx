import { FC } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"

import { Button, FriendlyEmpty, Text } from "@/components"
import type { ReportTemplate } from "@/db/models"
import { useReportTemplates, useReportTemplateActions } from "@/hooks/useReportTemplates"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

type NavigationProp = NativeStackNavigationProp<AppStackParamList>

export const MyReportsTab: FC = () => {
  const { t } = useTranslation()
  const { themed, theme } = useAppTheme()
  const navigation = useNavigation<NavigationProp>()
  const { templates, isLoading } = useReportTemplates()
  const { deleteTemplate } = useReportTemplateActions()

  const confirmDelete = (template: ReportTemplate) => {
    Alert.alert(
      t("reportsScreen.myReports.deleteTitle"),
      t("reportsScreen.myReports.deleteMessage", { name: template.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteTemplate(template.id).catch(() => undefined),
        },
      ],
    )
  }

  return (
    <View>
      <Button
        preset="filled"
        text={t("reportsScreen.myReports.newReport")}
        onPress={() => navigation.navigate("ReportBuilder", {})}
        style={themed($newButton)}
      />

      {!isLoading && templates.length === 0 ? (
        <FriendlyEmpty
          icon="file-chart-outline"
          heading={t("reportsScreen.myReports.emptyTitle")}
          content={t("reportsScreen.myReports.emptyDescription")}
          style={themed($empty)}
        />
      ) : null}

      {templates.map((template) => (
        <Pressable
          key={template.id}
          onPress={() => navigation.navigate("ReportViewer", { templateId: template.id })}
          style={({ pressed }) => [themed($row), pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
        >
          <View style={themed($rowIcon)}>
            <MaterialCommunityIcons name="file-chart" size={26} color={theme.colors.tint} />
          </View>
          <View style={themed($rowText)}>
            <Text preset="bold" text={template.name} />
            {template.description ? (
              <Text size="xs" text={template.description} style={themed($dim)} numberOfLines={1} />
            ) : null}
            <Text
              size="xxs"
              text={
                template.lastRunAt
                  ? t("reportsScreen.myReports.lastRun", {
                      date: format(template.lastRunAt, "yyyy-MM-dd"),
                    })
                  : t("reportsScreen.myReports.neverRun")
              }
              style={themed($dim)}
            />
          </View>
          <View style={themed($rowActions)}>
            <Pressable
              onPress={() => navigation.navigate("ReportBuilder", { templateId: template.id })}
              hitSlop={8}
              style={themed($actionButton)}
              accessibilityRole="button"
              accessibilityLabel={t("common.edit")}
            >
              <MaterialCommunityIcons name="pencil" size={22} color={theme.colors.textDim} />
            </Pressable>
            <Pressable
              onPress={() => confirmDelete(template)}
              hitSlop={8}
              style={themed($actionButton)}
              accessibilityRole="button"
              accessibilityLabel={t("common.delete")}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={22}
                color={theme.colors.error}
              />
            </Pressable>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

const $newButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $empty: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})

const $row: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
  borderRadius: 14,
  padding: spacing.sm,
  marginBottom: spacing.xs,
  minHeight: 64,
})

const $rowIcon: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 44,
  height: 44,
  borderRadius: 10,
  backgroundColor: colors.palette.primary100,
  alignItems: "center",
  justifyContent: "center",
  marginEnd: spacing.sm,
})

const $rowText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $rowActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})

const $actionButton: ThemedStyle<ViewStyle> = () => ({
  width: 40,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})
