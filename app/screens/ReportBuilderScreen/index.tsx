import { FC, useEffect, useMemo, useState } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle } from "react-native"
import { useTranslation } from "react-i18next"

import { AppHeader, Button, Screen, Text, TextField, TagInput } from "@/components"
import { useDatabase } from "@/context/DatabaseContext"
import { BREEDS_BY_SPECIES, SEX_LABELS, type AnimalSpecies } from "@/db/models/Animal"
import { usePastures } from "@/hooks/usePastures"
import { useReportTemplate, useReportTemplateActions } from "@/hooks/useReportTemplates"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import {
  ALL_ANIMAL_COLUMNS,
  ALL_GROUP_BY_FIELDS,
  ALL_REPORT_SECTIONS,
  DEFAULT_REPORT_CONFIG,
  serializeReportConfig,
  type AnimalColumnKey,
  type ReportConfig,
  type ReportGroupByField,
  type ReportSectionKey,
} from "@/services/reports/reportConfig"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const SEXES = ["male", "female", "castrated", "unknown"] as const
const STATUSES = ["active", "sold", "deceased", "transferred"] as const

function toggleInList<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]
}

/**
 * Build-your-own report: pick filters, a grouping, columns and history
 * sections; run it once or save it as a named template to re-run any time.
 */
export const ReportBuilderScreen: FC<AppStackScreenProps<"ReportBuilder">> = ({
  route,
  navigation,
}) => {
  const { templateId } = route.params
  const { t } = useTranslation()
  const { themed } = useAppTheme()
  const { currentOrg } = useDatabase()
  const { pastures } = usePastures()
  const { template, isLoading: templateLoading } = useReportTemplate(templateId)
  const { createTemplate, updateTemplate } = useReportTemplateActions()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_REPORT_CONFIG)
  const [ageFromText, setAgeFromText] = useState("")
  const [ageToText, setAgeToText] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Hydrate the form when editing an existing template
  useEffect(() => {
    if (!template) return
    setName(template.name)
    setDescription(template.description ?? "")
    const templateConfig = template.config
    setConfig(templateConfig)
    setAgeFromText(templateConfig.filters.ageFromMonths?.toString() ?? "")
    setAgeToText(templateConfig.filters.ageToMonths?.toString() ?? "")
  }, [template])

  const orgSpecies: AnimalSpecies[] = currentOrg?.livestockTypes ?? ["cattle"]
  const speciesForBreeds =
    (config.filters.species as AnimalSpecies | null) ?? orgSpecies[0] ?? "cattle"
  const availableBreeds = BREEDS_BY_SPECIES[speciesForBreeds] ?? BREEDS_BY_SPECIES.cattle

  const currentConfig = useMemo<ReportConfig>(() => {
    const ageFrom = ageFromText.trim() === "" ? null : Number.parseInt(ageFromText, 10)
    const ageTo = ageToText.trim() === "" ? null : Number.parseInt(ageToText, 10)
    return {
      ...config,
      filters: {
        ...config.filters,
        ageFromMonths: Number.isNaN(ageFrom as number) ? null : ageFrom,
        ageToMonths: Number.isNaN(ageTo as number) ? null : ageTo,
      },
    }
  }, [config, ageFromText, ageToText])

  const setFilters = (partial: Partial<ReportConfig["filters"]>) => {
    setConfig((prev) => ({ ...prev, filters: { ...prev.filters, ...partial } }))
  }

  const handleRun = () => {
    navigation.navigate("ReportViewer", {
      adHocConfig: serializeReportConfig(currentConfig),
      title: name.trim() || t("reportsScreen.viewer.defaultTitle"),
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        t("reportsScreen.builder.nameRequiredTitle"),
        t("reportsScreen.builder.nameRequiredMessage"),
      )
      return
    }
    setIsSaving(true)
    try {
      const data = { name, description, config: currentConfig }
      if (templateId) await updateTemplate(templateId, data)
      else await createTemplate(data)
      navigation.goBack()
    } catch (error) {
      console.error("[ReportBuilder] save failed:", error)
      Alert.alert(t("errors.somethingWentWrong"), t("errors.tryAgain"))
    } finally {
      setIsSaving(false)
    }
  }

  if (templateId && templateLoading) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($loadingScreen)}>
        <AppHeader
          title={t("reportsScreen.builder.editTitle")}
          showBack={true}
          showSettings={false}
        />
      </Screen>
    )
  }

  const Chip: FC<{ label: string; active: boolean; onPress: () => void }> = ({
    label,
    active,
    onPress,
  }) => (
    <Pressable
      onPress={onPress}
      style={[themed($chip), active && themed($chipActive)]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        size="xs"
        preset={active ? "bold" : "default"}
        text={label}
        style={active ? themed($chipTextActive) : undefined}
      />
    </Pressable>
  )

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <AppHeader
        title={templateId ? t("reportsScreen.builder.editTitle") : t("reportsScreen.builder.title")}
        showBack={true}
        showSettings={false}
      />

      <View style={themed($card)}>
        <TextField
          label={t("reportsScreen.builder.nameLabel")}
          placeholder={t("reportsScreen.builder.namePlaceholder")}
          value={name}
          onChangeText={setName}
        />
        <TextField
          label={t("reportsScreen.builder.descriptionLabel")}
          placeholder={t("reportsScreen.builder.descriptionPlaceholder")}
          value={description}
          onChangeText={setDescription}
          containerStyle={themed($fieldSpacing)}
        />
      </View>

      {/* Filters */}
      <View style={themed($card)}>
        <Text preset="subheading" text={t("reportsScreen.builder.filters.title")} />
        <Text size="xs" text={t("reportsScreen.builder.filters.subtitle")} style={themed($dim)} />

        {orgSpecies.length > 1 ? (
          <>
            <Text
              preset="bold"
              size="sm"
              text={t("reportsScreen.builder.filters.species")}
              style={themed($groupLabel)}
            />
            <View style={themed($chipWrap)}>
              {orgSpecies.map((species) => (
                <Chip
                  key={species}
                  label={species}
                  active={config.filters.species === species}
                  onPress={() =>
                    setFilters({
                      species: config.filters.species === species ? null : species,
                      breeds: [],
                    })
                  }
                />
              ))}
            </View>
          </>
        ) : null}

        <Text
          preset="bold"
          size="sm"
          text={t("reportsScreen.builder.filters.status")}
          style={themed($groupLabel)}
        />
        <View style={themed($chipWrap)}>
          {STATUSES.map((status) => (
            <Chip
              key={status}
              label={t(`reportsScreen.statuses.${status}`)}
              active={config.filters.statuses.includes(status)}
              onPress={() =>
                setFilters({ statuses: toggleInList(config.filters.statuses, status) })
              }
            />
          ))}
        </View>

        <Text
          preset="bold"
          size="sm"
          text={t("reportsScreen.builder.filters.sex")}
          style={themed($groupLabel)}
        />
        <View style={themed($chipWrap)}>
          {SEXES.map((sex) => (
            <Chip
              key={sex}
              label={SEX_LABELS[speciesForBreeds]?.[sex] ?? sex}
              active={config.filters.sexes.includes(sex)}
              onPress={() => setFilters({ sexes: toggleInList(config.filters.sexes, sex) })}
            />
          ))}
        </View>

        <Text
          preset="bold"
          size="sm"
          text={t("reportsScreen.builder.filters.breed")}
          style={themed($groupLabel)}
        />
        <View style={themed($chipWrap)}>
          {availableBreeds.map((breed) => (
            <Chip
              key={breed}
              label={breed}
              active={config.filters.breeds.includes(breed)}
              onPress={() => setFilters({ breeds: toggleInList(config.filters.breeds, breed) })}
            />
          ))}
        </View>

        <Text
          preset="bold"
          size="sm"
          text={t("reportsScreen.builder.filters.age")}
          style={themed($groupLabel)}
        />
        <View style={themed($ageRow)}>
          <TextField
            placeholder={t("reportsScreen.builder.filters.ageFrom")}
            value={ageFromText}
            onChangeText={setAgeFromText}
            keyboardType="number-pad"
            containerStyle={themed($ageField)}
          />
          <TextField
            placeholder={t("reportsScreen.builder.filters.ageTo")}
            value={ageToText}
            onChangeText={setAgeToText}
            keyboardType="number-pad"
            containerStyle={themed($ageField)}
          />
        </View>

        <Text
          preset="bold"
          size="sm"
          text={t("reportsScreen.builder.filters.tags")}
          style={themed($groupLabel)}
        />
        <TagInput
          tags={config.filters.tags}
          onTagsChange={(tags) => setFilters({ tags })}
          placeholder={t("reportsScreen.builder.filters.tagsPlaceholder")}
        />

        {pastures.length > 0 ? (
          <>
            <Text
              preset="bold"
              size="sm"
              text={t("reportsScreen.builder.filters.pasture")}
              style={themed($groupLabel)}
            />
            <View style={themed($chipWrap)}>
              {pastures.map((pasture) => (
                <Chip
                  key={pasture.id}
                  label={pasture.name}
                  active={config.filters.pastureIds.includes(pasture.id)}
                  onPress={() =>
                    setFilters({ pastureIds: toggleInList(config.filters.pastureIds, pasture.id) })
                  }
                />
              ))}
            </View>
          </>
        ) : null}
      </View>

      {/* Group by */}
      <View style={themed($card)}>
        <Text preset="subheading" text={t("reportsScreen.builder.groupBy.title")} />
        <Text size="xs" text={t("reportsScreen.builder.groupBy.subtitle")} style={themed($dim)} />
        <View style={themed($chipWrap)}>
          <Chip
            label={t("reportsScreen.builder.groupBy.none")}
            active={config.groupBy === null}
            onPress={() => setConfig((prev) => ({ ...prev, groupBy: null }))}
          />
          {ALL_GROUP_BY_FIELDS.map((field: ReportGroupByField) => (
            <Chip
              key={field}
              label={t(`reportsScreen.groupBy.${field}`)}
              active={config.groupBy === field}
              onPress={() => setConfig((prev) => ({ ...prev, groupBy: field }))}
            />
          ))}
        </View>
      </View>

      {/* Columns */}
      <View style={themed($card)}>
        <Text preset="subheading" text={t("reportsScreen.builder.columns.title")} />
        <Text size="xs" text={t("reportsScreen.builder.columns.subtitle")} style={themed($dim)} />
        <View style={themed($chipWrap)}>
          {ALL_ANIMAL_COLUMNS.map((column: AnimalColumnKey) => (
            <Chip
              key={column}
              label={t(`reportsScreen.columns.${column}`)}
              active={config.columns.includes(column)}
              onPress={() =>
                setConfig((prev) => {
                  const next = toggleInList(prev.columns, column)
                  // Never allow zero columns — keep at least the visual tag
                  return { ...prev, columns: next.length > 0 ? next : ["visualTag"] }
                })
              }
            />
          ))}
        </View>
      </View>

      {/* History sections (exports) */}
      <View style={themed($card)}>
        <Text preset="subheading" text={t("reportsScreen.builder.sections.title")} />
        <Text size="xs" text={t("reportsScreen.builder.sections.subtitle")} style={themed($dim)} />
        <View style={themed($chipWrap)}>
          {ALL_REPORT_SECTIONS.map((section: ReportSectionKey) => (
            <Chip
              key={section}
              label={t(`reportsScreen.sections.${section}`)}
              active={config.sections.includes(section)}
              onPress={() =>
                setConfig((prev) => ({ ...prev, sections: toggleInList(prev.sections, section) }))
              }
            />
          ))}
        </View>
      </View>

      <Button
        preset="filled"
        text={t("reportsScreen.builder.runButton")}
        onPress={handleRun}
        style={themed($runButton)}
      />
      <Button
        text={
          isSaving
            ? t("reportsScreen.export.working")
            : templateId
              ? t("reportsScreen.builder.updateButton")
              : t("reportsScreen.builder.saveButton")
        }
        onPress={handleSave}
        disabled={isSaving}
      />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingBottom: spacing.xl,
})

// Screen's "fixed" preset justifies content flex-end; override so the
// AppHeader stays pinned at the top during the brief edit-load state.
const $loadingScreen: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "flex-start",
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 14,
  padding: spacing.md,
  marginBottom: spacing.sm,
})

const $fieldSpacing: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

const $groupLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  marginBottom: spacing.xxs,
})

const $chipWrap: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  marginTop: spacing.xxs,
})

const $chip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 16,
  backgroundColor: colors.palette.neutral200,
  minHeight: 36,
  justifyContent: "center",
})

const $chipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
})

const $chipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
})

const $ageRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $ageField: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $runButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})
