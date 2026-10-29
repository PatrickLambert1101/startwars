import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { AppHeader, Button, Screen, Text, TextField } from "@/components"
import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"
import { useSubscription } from "@/context/SubscriptionContext"
import { BREEDS_BY_SPECIES, SEX_LABELS } from "@/db/models/Animal"
import type { AnimalSex } from "@/db/models/Animal"
import { useAnimals } from "@/hooks/useAnimals"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import {
  AnimalImportLimitError,
  autoMapColumns,
  cellText,
  executeAnimalImport,
  executeGrazingImport,
  executeTreatmentImport,
  importFieldsForType,
  importTypeLabel,
  mappedCell,
  previewAnimalImport,
  previewGrazingImport,
  previewTreatmentImport,
  readSpreadsheetFile,
  shareImportTemplate,
} from "@/services/dataImport"
import type {
  AnimalImportRecord,
  ColumnMapping,
  GrazingImportRecord,
  ImportExecutionResult,
  ImportPreviewRow,
  ParsedSpreadsheet,
  TreatmentImportRecord,
} from "@/services/dataImport"
import { bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface DataImportScreenProps extends AppStackScreenProps<"DataImport"> {}

type ImportStage = "mapping" | "preview" | "complete"
type PreviewRecord = AnimalImportRecord | TreatmentImportRecord | GrazingImportRecord
type AnimalSettingTarget = "breed" | "sex"

const PICKER_TYPES = [
  "text/csv",
  "text/comma-separated-values",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]

export function DataImportScreen({ navigation, route }: DataImportScreenProps) {
  const { importType } = route.params
  const { currentOrg } = useDatabase()
  const { user } = useAuth()
  const { animalLimit } = useSubscription()
  const { animals } = useAnimals()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const fields = useMemo(() => importFieldsForType(importType), [importType])
  const [stage, setStage] = useState<ImportStage>("mapping")
  const [parsedFile, setParsedFile] = useState<ParsedSpreadsheet | null>(null)
  const [sheetIndex, setSheetIndex] = useState(0)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [mappingTarget, setMappingTarget] = useState<string | null>(null)
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow<PreviewRecord>[]>([])
  const [result, setResult] = useState<ImportExecutionResult | null>(null)
  const [isReading, setIsReading] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showFieldGuide, setShowFieldGuide] = useState(true)
  const [showAnimalSettings, setShowAnimalSettings] = useState(true)
  const [breedOverride, setBreedOverride] = useState<string | null>(null)
  const [customBreedInput, setCustomBreedInput] = useState("")
  const [sexOverride, setSexOverride] = useState<AnimalSex | null>(null)
  const [importTags, setImportTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [animalSettingTarget, setAnimalSettingTarget] = useState<AnimalSettingTarget | null>(null)

  const sheet = parsedFile?.sheets[sheetIndex] ?? null
  const defaultSpecies = currentOrg?.livestockTypes?.[0] ?? "cattle"
  const detectedBreedOptions = useMemo(() => {
    if (!sheet || mapping.breed == null) return []
    return [
      ...new Set(
        sheet.rows.map((row) => cellText(mappedCell(row, mapping, "breed"))).filter(Boolean),
      ),
    ].sort((first, second) => first.localeCompare(second))
  }, [mapping, sheet])
  const breedOptions = useMemo(
    () => [
      ...new Set([
        ...(breedOverride ? [breedOverride] : []),
        ...BREEDS_BY_SPECIES[defaultSpecies],
        ...animals.map((animal) => animal.breed).filter(Boolean),
        ...detectedBreedOptions,
      ]),
    ],
    [animals, breedOverride, defaultSpecies, detectedBreedOptions],
  )
  const readyRows = previewRows.filter((row) => row.canImport && row.record)
  const blockedRows = previewRows.filter((row) => !row.canImport)
  const warningRows = previewRows.filter(
    (row) => row.canImport && row.issues.some((item) => item.severity === "warning"),
  )

  const addImportTag = () => {
    const nextTag = tagInput.trim()
    if (!nextTag) return
    if (!importTags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) {
      setImportTags((current) => [...current, nextTag])
    }
    setTagInput("")
  }

  const selectSheet = (nextIndex: number, file = parsedFile) => {
    const nextSheet = file?.sheets[nextIndex]
    if (!nextSheet) return
    setSheetIndex(nextIndex)
    setMapping(autoMapColumns(nextSheet.headers, fields))
    setPreviewRows([])
    setStage("mapping")
  }

  const chooseFile = async () => {
    try {
      // Load the native picker only when it is used. This keeps an older dev
      // client from crashing the whole navigator before it has been rebuilt
      // with ExpoDocumentPicker.
      const DocumentPicker = await import("expo-document-picker")
      const selection = await DocumentPicker.getDocumentAsync({
        type: PICKER_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      })
      if (selection.canceled) return

      setIsReading(true)
      const parsed = await readSpreadsheetFile(selection.assets[0])
      setParsedFile(parsed)
      setResult(null)
      selectSheet(0, parsed)
    } catch (error) {
      console.error("[DataImport] Failed to read spreadsheet:", error)
      Alert.alert(
        "Could not read file",
        error instanceof Error ? error.message : "Choose a valid CSV, XLS or XLSX file.",
      )
    } finally {
      setIsReading(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      await shareImportTemplate(importType)
    } catch (error) {
      console.error("[DataImport] Could not share template:", error)
      Alert.alert("Could not create template", "Please try again.")
    }
  }

  const reviewFile = async () => {
    if (!sheet || !currentOrg) return
    const missing = fields.filter((field) => field.required && mapping[field.key] == null)
    if (missing.length > 0) {
      Alert.alert(
        "Match required columns",
        `Choose a spreadsheet column for ${missing.map((field) => field.label).join(", ")}.`,
      )
      return
    }
    if (importType === "animals" && mapping.visualTag == null && mapping.rfidTag == null) {
      Alert.alert(
        "Match an animal ID",
        "Choose a spreadsheet column for either Visual tag or RFID tag.",
      )
      return
    }

    setIsReviewing(true)
    try {
      const rows =
        importType === "animals"
          ? await previewAnimalImport(currentOrg.id, sheet, mapping, defaultSpecies, {
              breed: breedOverride ?? undefined,
              sex: sexOverride ?? undefined,
              tags: importTags,
            })
          : importType === "treatments"
            ? await previewTreatmentImport(currentOrg.id, sheet, mapping)
            : await previewGrazingImport(currentOrg.id, sheet, mapping)
      setPreviewRows(rows)
      setStage("preview")
    } catch (error) {
      console.error("[DataImport] Could not validate file:", error)
      Alert.alert("Could not review file", "Please try again.")
    } finally {
      setIsReviewing(false)
    }
  }

  const importReadyRows = async () => {
    if (!parsedFile || !sheet || !currentOrg || readyRows.length === 0) return

    setIsImporting(true)
    try {
      const options = {
        organizationId: currentOrg.id,
        fileName: parsedFile.fileName,
        sheetName: sheet.name,
        totalRows: sheet.rows.length,
        userId: user?.id,
        userName: user?.email,
        animalLimit,
      }
      const importResult =
        importType === "animals"
          ? await executeAnimalImport(
              readyRows.map((row) => row.record as AnimalImportRecord),
              options,
            )
          : importType === "treatments"
            ? await executeTreatmentImport(
                readyRows.map((row) => row.record as TreatmentImportRecord),
                options,
              )
            : await executeGrazingImport(
                readyRows.map((row) => row.record as GrazingImportRecord),
                options,
              )
      setResult(importResult)
      setStage("complete")
    } catch (error) {
      console.error("[DataImport] Import failed:", error)
      if (error instanceof AnimalImportLimitError) {
        Alert.alert(
          "Animal limit reached",
          `Your plan allows ${error.limit} animals and currently has room for ${error.available}. Import fewer animals or upgrade your plan.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "View plans", onPress: () => navigation.navigate("Paywall") },
          ],
        )
        return
      }
      Alert.alert(
        "Import failed",
        "Nothing from this import was saved. Check the file and try again.",
      )
    } finally {
      setIsImporting(false)
    }
  }

  const mappingField = mappingTarget
    ? fields.find((field) => field.key === mappingTarget)
    : undefined

  return (
    <>
      <Screen preset="scroll" safeAreaEdges={["bottom"]} contentContainerStyle={themed($container)}>
        <AppHeader
          title={`Import ${importTypeLabel(importType).toLowerCase()}`}
          showBack
          showSettings={false}
        />

        <View style={themed($content)}>
          {stage === "complete" && result ? (
            <View style={themed($completeCard)}>
              <View style={themed($completeIcon)}>
                <MaterialCommunityIcons name="check" size={38} color="#FFFFFF" />
              </View>
              <Text preset="heading" size="xl">
                Import complete
              </Text>
              <Text style={themed($centerMuted)}>
                {result.importedRows}{" "}
                {importType === "animals"
                  ? result.importedRows === 1
                    ? "animal"
                    : "animals"
                  : importType === "treatments"
                    ? "treatment records"
                    : "grazing periods"}{" "}
                imported
                {result.skippedRows > 0 ? ` and ${result.skippedRows} rows skipped.` : "."}
              </Text>
              <Text size="xs" style={themed($centerMuted)}>
                You can undo this entire import from Data imports.
              </Text>
              <Button
                preset="filled"
                text="Back to data imports"
                onPress={() => navigation.navigate("DataImports")}
                style={themed($fullButton)}
              />
            </View>
          ) : (
            <>
              <View style={themed($privacyNote)}>
                <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.tint} />
                <Text size="xs" style={themed($privacyText)}>
                  Your file is processed on this device. Nothing is saved until you confirm the
                  reviewed rows.
                </Text>
              </View>

              <View style={themed($guideCard)}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showFieldGuide }}
                  onPress={() => setShowFieldGuide((current) => !current)}
                  style={themed($guideHeader)}
                >
                  <View style={themed($flex)}>
                    <Text weight="semiBold">Fields and matching rules</Text>
                    <Text size="xxs" style={themed($muted)}>
                      {importType === "animals"
                        ? "One row per animal"
                        : importType === "treatments"
                          ? "One row per animal treatment"
                          : "One row per pasture grazing period"}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={showFieldGuide ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={colors.textDim}
                  />
                </Pressable>

                {showFieldGuide && (
                  <View style={themed($guideBody)}>
                    <View style={themed($matchingCallout)}>
                      <MaterialCommunityIcons name="link-variant" size={20} color={colors.tint} />
                      <Text size="xs" style={themed($privacyText)}>
                        {importType === "animals"
                          ? "Every animal needs a visual tag or RFID. Duplicate tags are blocked. Sire and dam link by a unique tag, RFID or name; unmatched parent IDs and breeds are kept as external pedigree details."
                          : importType === "treatments"
                            ? "Animal Tag links to an existing cow or other animal using either its RFID tag or visual tag. It never guesses using the animal’s name."
                            : "Pasture links to an existing pasture using its pasture code or pasture name. Imported history does not move animals or change current occupancy."}
                      </Text>
                    </View>

                    {fields.map((field, index) => (
                      <View
                        key={field.key}
                        style={[
                          themed($guideField),
                          index < fields.length - 1 && themed($rowSeparator),
                        ]}
                      >
                        <View style={themed($guideFieldHeader)}>
                          <Text size="xs" weight="semiBold">
                            {field.label}
                          </Text>
                          <View
                            style={[
                              themed($requirementBadge),
                              !field.required && themed($optionalBadge),
                            ]}
                          >
                            <Text size="xxs" style={themed($requirementText)}>
                              {field.required ? "Required" : "Optional"}
                            </Text>
                          </View>
                          <View style={themed($typeBadge)}>
                            <Text size="xxs" style={themed($typeText)}>
                              {field.dataType}
                            </Text>
                          </View>
                        </View>
                        <Text size="xxs" style={themed($muted)}>
                          {field.help}
                        </Text>
                        <Text size="xxs" style={themed($exampleText)}>
                          Example: {field.example}
                        </Text>
                      </View>
                    ))}

                    <Text size="xxs" style={themed($dateHint)}>
                      Dates accept DD/MM/YYYY, YYYY-MM-DD or genuine Excel date cells.
                    </Text>
                  </View>
                )}
              </View>

              {!parsedFile ? (
                <View style={themed($pickerCard)}>
                  <MaterialCommunityIcons name="file-excel-outline" size={48} color={colors.tint} />
                  <Text preset="subheading">Choose a CSV or Excel file</Text>
                  <Text size="xs" style={themed($centerMuted)}>
                    CSV, XLS and XLSX files are supported. Excel files can contain multiple sheets.
                  </Text>
                  <Button
                    preset="filled"
                    text={isReading ? "Reading file…" : "Choose file"}
                    disabled={isReading}
                    onPress={chooseFile}
                    style={themed($fullButton)}
                  />
                  <Pressable onPress={downloadTemplate} style={themed($linkButton)}>
                    <MaterialCommunityIcons name="download-outline" size={18} color={colors.tint} />
                    <Text size="xs" style={themed($linkText)}>
                      Download CSV template
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={themed($fileCard)}>
                    <MaterialCommunityIcons
                      name="file-check-outline"
                      size={26}
                      color={colors.tint}
                    />
                    <View style={themed($flex)}>
                      <Text weight="semiBold" numberOfLines={1}>
                        {parsedFile.fileName}
                      </Text>
                      <Text size="xxs" style={themed($muted)}>
                        {sheet?.rows.length ?? 0} data rows
                      </Text>
                    </View>
                    <Pressable onPress={chooseFile}>
                      <Text size="xs" style={themed($linkText)}>
                        Change
                      </Text>
                    </Pressable>
                  </View>

                  {parsedFile.sheets.length > 1 && (
                    <View>
                      <Text preset="formLabel" style={themed($fieldHeading)}>
                        EXCEL SHEET
                      </Text>
                      <View style={themed($chips)}>
                        {parsedFile.sheets.map((item, index) => (
                          <Pressable
                            key={`${item.name}-${index}`}
                            onPress={() => selectSheet(index)}
                            style={[themed($chip), index === sheetIndex && themed($selectedChip)]}
                          >
                            <Text
                              size="xs"
                              style={index === sheetIndex ? themed($selectedChipText) : undefined}
                            >
                              {item.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                  {stage === "mapping" && sheet && (
                    <>
                      {importType === "animals" && (
                        <View style={themed($guideCard)}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ expanded: showAnimalSettings }}
                            onPress={() => setShowAnimalSettings((current) => !current)}
                            style={themed($guideHeader)}
                          >
                            <View style={themed($settingsHeaderIcon)}>
                              <MaterialCommunityIcons
                                name="tune-variant"
                                size={20}
                                color={colors.tint}
                              />
                            </View>
                            <View style={themed($flex)}>
                              <Text weight="semiBold">Animal details for this import</Text>
                              <Text size="xxs" style={themed($muted)}>
                                Add tags or override breed and sex for every ready row
                              </Text>
                            </View>
                            <MaterialCommunityIcons
                              name={showAnimalSettings ? "chevron-up" : "chevron-down"}
                              size={24}
                              color={colors.textDim}
                            />
                          </Pressable>

                          {showAnimalSettings && (
                            <View style={themed($settingsBody)}>
                              <View>
                                <Text preset="formLabel" style={themed($fieldHeading)}>
                                  BREED
                                </Text>
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => setAnimalSettingTarget("breed")}
                                  style={themed($settingButton)}
                                >
                                  <View style={themed($flex)}>
                                    <Text size="xs" weight="semiBold">
                                      {breedOverride ?? "Keep spreadsheet values"}
                                    </Text>
                                    <Text size="xxs" style={themed($muted)}>
                                      {breedOverride
                                        ? "This replaces the breed on every imported animal."
                                        : "Each animal keeps the breed in its spreadsheet row."}
                                    </Text>
                                  </View>
                                  <MaterialCommunityIcons
                                    name="chevron-down"
                                    size={22}
                                    color={colors.textDim}
                                  />
                                </Pressable>
                              </View>

                              <View>
                                <Text preset="formLabel" style={themed($fieldHeading)}>
                                  SEX
                                </Text>
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => setAnimalSettingTarget("sex")}
                                  style={themed($settingButton)}
                                >
                                  <View style={themed($flex)}>
                                    <Text size="xs" weight="semiBold">
                                      {sexOverride
                                        ? SEX_LABELS[defaultSpecies][sexOverride]
                                        : "Keep spreadsheet value / infer from sheet"}
                                    </Text>
                                    <Text size="xxs" style={themed($muted)}>
                                      {sexOverride
                                        ? "This replaces the sex on every imported animal."
                                        : "For example, blank sex values on a Cows sheet become Cow."}
                                    </Text>
                                  </View>
                                  <MaterialCommunityIcons
                                    name="chevron-down"
                                    size={22}
                                    color={colors.textDim}
                                  />
                                </Pressable>
                              </View>

                              <View>
                                <Text preset="formLabel" style={themed($fieldHeading)}>
                                  TAGS FOR EVERY ANIMAL
                                </Text>
                                <Text size="xxs" style={themed($muted)}>
                                  Add management tags such as Breeding Stock, Purchased Herd or
                                  Quarantine.
                                </Text>
                                <View style={themed($tagEntryRow)}>
                                  <TextField
                                    accessibilityLabel="Tag for imported animals"
                                    value={tagInput}
                                    onChangeText={setTagInput}
                                    onSubmitEditing={addImportTag}
                                    placeholder="Type a tag"
                                    returnKeyType="done"
                                    containerStyle={themed($tagInputContainer)}
                                  />
                                  <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Add import tag"
                                    onPress={addImportTag}
                                    style={themed($tagAddButton)}
                                  >
                                    <Text size="xs" style={themed($selectedChipText)}>
                                      Add
                                    </Text>
                                  </Pressable>
                                </View>
                                {importTags.length > 0 && (
                                  <View style={themed($chips)}>
                                    {importTags.map((tag) => (
                                      <Pressable
                                        key={tag}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Remove ${tag} tag`}
                                        onPress={() =>
                                          setImportTags((current) =>
                                            current.filter((item) => item !== tag),
                                          )
                                        }
                                        style={[themed($chip), themed($selectedChip)]}
                                      >
                                        <Text size="xs" style={themed($selectedChipText)}>
                                          {tag} ×
                                        </Text>
                                      </Pressable>
                                    ))}
                                  </View>
                                )}
                              </View>
                            </View>
                          )}
                        </View>
                      )}

                      <View>
                        <Text preset="subheading">Match your columns</Text>
                        <Text size="xs" style={themed($muted)}>
                          We matched familiar headings automatically. Tap any row to change it.
                        </Text>
                      </View>

                      <View style={themed($mappingCard)}>
                        {fields.map((field, index) => {
                          const headerIndex = mapping[field.key]
                          const header =
                            headerIndex === null || headerIndex === undefined
                              ? "Not mapped"
                              : sheet.headers[headerIndex]
                          return (
                            <Pressable
                              key={field.key}
                              onPress={() => setMappingTarget(field.key)}
                              style={[
                                themed($mappingRow),
                                index < fields.length - 1 && themed($rowSeparator),
                              ]}
                            >
                              <View style={themed($flex)}>
                                <Text size="xs" weight="semiBold">
                                  {field.label}
                                  {field.required ? " *" : ""}
                                </Text>
                                <Text
                                  size="xxs"
                                  style={[
                                    themed($muted),
                                    field.required &&
                                      mapping[field.key] == null &&
                                      themed($errorText),
                                  ]}
                                >
                                  {header}
                                </Text>
                              </View>
                              <MaterialCommunityIcons
                                name="chevron-down"
                                size={22}
                                color={colors.textDim}
                              />
                            </Pressable>
                          )
                        })}
                      </View>

                      <Button
                        preset="filled"
                        text={
                          isReviewing ? "Checking records…" : `Review ${sheet.rows.length} rows`
                        }
                        disabled={isReviewing}
                        onPress={reviewFile}
                      />
                    </>
                  )}

                  {stage === "preview" && (
                    <>
                      <View>
                        <Text preset="subheading">Review before importing</Text>
                        <Text size="xs" style={themed($muted)}>
                          Rows with errors will be skipped. Warning rows can still be imported.
                        </Text>
                      </View>

                      {importType === "animals" &&
                        (breedOverride || sexOverride || importTags.length > 0) && (
                          <View style={themed($appliedSettings)}>
                            <MaterialCommunityIcons
                              name="tune-variant"
                              size={20}
                              color={colors.tint}
                            />
                            <View style={themed($flex)}>
                              <Text size="xs" weight="semiBold">
                                Applied to every ready animal
                              </Text>
                              <Text size="xxs" style={themed($muted)}>
                                {[
                                  breedOverride ? `Breed: ${breedOverride}` : "",
                                  sexOverride
                                    ? `Sex: ${SEX_LABELS[defaultSpecies][sexOverride]}`
                                    : "",
                                  importTags.length > 0 ? `Tags: ${importTags.join(", ")}` : "",
                                ]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </Text>
                            </View>
                          </View>
                        )}

                      <View style={themed($summaryRow)}>
                        <View style={themed($summaryCard)}>
                          <Text preset="heading" size="xl" style={themed($readyNumber)}>
                            {readyRows.length}
                          </Text>
                          <Text size="xxs" style={themed($muted)}>
                            Ready
                          </Text>
                        </View>
                        <View style={themed($summaryCard)}>
                          <Text preset="heading" size="xl" style={themed($warningNumber)}>
                            {warningRows.length}
                          </Text>
                          <Text size="xxs" style={themed($muted)}>
                            Warnings
                          </Text>
                        </View>
                        <View style={themed($summaryCard)}>
                          <Text preset="heading" size="xl" style={themed($blockedNumber)}>
                            {blockedRows.length}
                          </Text>
                          <Text size="xxs" style={themed($muted)}>
                            Skipped
                          </Text>
                        </View>
                      </View>

                      <View style={themed($previewList)}>
                        {previewRows.slice(0, 150).map((row, index) => {
                          const hasError = row.issues.some((item) => item.severity === "error")
                          const hasWarning = row.issues.some((item) => item.severity === "warning")
                          return (
                            <View
                              key={`${row.rowNumber}-${index}`}
                              style={[
                                themed($previewRow),
                                index < Math.min(previewRows.length, 150) - 1 &&
                                  themed($rowSeparator),
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={
                                  hasError
                                    ? "close-circle"
                                    : hasWarning
                                      ? "alert-circle"
                                      : "check-circle"
                                }
                                size={22}
                                color={
                                  hasError
                                    ? colors.error
                                    : hasWarning
                                      ? colors.palette.accent500
                                      : colors.tint
                                }
                              />
                              <View style={themed($flex)}>
                                <Text size="xs" weight="semiBold">
                                  Row {row.rowNumber} • {row.sourceLabel}
                                </Text>
                                <Text size="xxs" style={themed($muted)}>
                                  {row.detail}
                                </Text>
                                {row.issues.map((item, issueIndex) => (
                                  <Text
                                    key={`${item.code}-${issueIndex}`}
                                    size="xxs"
                                    style={
                                      item.severity === "error"
                                        ? themed($errorText)
                                        : themed($warningText)
                                    }
                                  >
                                    {item.message}
                                  </Text>
                                ))}
                              </View>
                            </View>
                          )
                        })}
                      </View>

                      {previewRows.length > 150 && (
                        <Text size="xs" style={themed($muted)}>
                          Showing the first 150 rows. All {previewRows.length} rows were validated
                          and will follow the summary above.
                        </Text>
                      )}

                      <Button
                        preset="filled"
                        text={
                          isImporting
                            ? "Importing…"
                            : `Import ${readyRows.length} ready ${readyRows.length === 1 ? "row" : "rows"}`
                        }
                        disabled={isImporting || readyRows.length === 0}
                        onPress={importReadyRows}
                      />
                      <Button
                        preset="default"
                        text="Change column matches"
                        disabled={isImporting}
                        onPress={() => setStage("mapping")}
                      />
                    </>
                  )}
                </>
              )}
            </>
          )}

          {(isReading || isReviewing || isImporting) && (
            <View style={themed($busyOverlay)}>
              <ActivityIndicator size="small" color={colors.tint} />
            </View>
          )}
        </View>
      </Screen>

      <Modal
        visible={Boolean(mappingTarget && sheet)}
        transparent
        animationType="fade"
        onRequestClose={() => setMappingTarget(null)}
      >
        <Pressable style={themed($modalBackdrop)} onPress={() => setMappingTarget(null)}>
          <Pressable style={themed($modalCard)} onPress={() => undefined}>
            <Text preset="subheading">
              {mappingField ? `Column for ${mappingField.label}` : "Choose column"}
            </Text>
            <Pressable
              style={themed($modalOption)}
              onPress={() => {
                if (mappingTarget) {
                  setMapping((current) => ({ ...current, [mappingTarget]: null }))
                }
                setMappingTarget(null)
              }}
            >
              <Text size="xs" style={themed($muted)}>
                Not mapped
              </Text>
            </Pressable>
            <ScrollView>
              {sheet?.headers.map((header, index) => (
                <Pressable
                  key={`${header}-${index}`}
                  style={themed($modalOption)}
                  onPress={() => {
                    if (mappingTarget) {
                      setMapping((current) => ({ ...current, [mappingTarget]: index }))
                    }
                    setMappingTarget(null)
                  }}
                >
                  <Text size="xs">{header}</Text>
                  {mappingTarget && mapping[mappingTarget] === index && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.tint} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={Boolean(animalSettingTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setAnimalSettingTarget(null)}
      >
        <Pressable style={themed($modalBackdrop)} onPress={() => setAnimalSettingTarget(null)}>
          <Pressable style={themed($modalCard)} onPress={() => undefined}>
            <Text preset="subheading">
              {animalSettingTarget === "breed" ? "Breed for this import" : "Sex for this import"}
            </Text>
            <Text size="xxs" style={themed($modalHelp)}>
              This setting applies to every ready animal in this import.
            </Text>

            <ScrollView>
              {animalSettingTarget === "breed" && (
                <View style={themed($customBreedBox)}>
                  <TextField
                    label="Custom breed or cross"
                    value={customBreedInput}
                    onChangeText={setCustomBreedInput}
                    placeholder="e.g. Nguni × farm composite"
                    autoCapitalize="words"
                  />
                  <Button
                    text="Use custom breed"
                    preset="reversed"
                    disabled={!customBreedInput.trim()}
                    onPress={() => {
                      const customBreed = customBreedInput.trim()
                      if (!customBreed) return
                      setBreedOverride(customBreed)
                      setCustomBreedInput("")
                      setAnimalSettingTarget(null)
                    }}
                  />
                </View>
              )}

              <Pressable
                style={themed($modalOption)}
                onPress={() => {
                  if (animalSettingTarget === "breed") setBreedOverride(null)
                  if (animalSettingTarget === "sex") setSexOverride(null)
                  setAnimalSettingTarget(null)
                }}
              >
                <Text size="xs">
                  {animalSettingTarget === "breed"
                    ? "Keep spreadsheet values"
                    : "Keep spreadsheet value / infer from sheet"}
                </Text>
                {((animalSettingTarget === "breed" && !breedOverride) ||
                  (animalSettingTarget === "sex" && !sexOverride)) && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.tint} />
                )}
              </Pressable>

              {animalSettingTarget === "breed"
                ? breedOptions.map((breed) => (
                    <Pressable
                      key={breed}
                      style={themed($modalOption)}
                      onPress={() => {
                        setBreedOverride(breed)
                        setAnimalSettingTarget(null)
                      }}
                    >
                      <Text size="xs">{breed}</Text>
                      {breedOverride === breed && (
                        <MaterialCommunityIcons name="check" size={20} color={colors.tint} />
                      )}
                    </Pressable>
                  ))
                : (["female", "male", "castrated", "unknown"] as AnimalSex[]).map((sex) => (
                    <Pressable
                      key={sex}
                      style={themed($modalOption)}
                      onPress={() => {
                        setSexOverride(sex)
                        setAnimalSettingTarget(null)
                      }}
                    >
                      <Text size="xs">{SEX_LABELS[defaultSpecies][sex]}</Text>
                      {sexOverride === sex && (
                        <MaterialCommunityIcons name="check" size={20} color={colors.tint} />
                      )}
                    </Pressable>
                  ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  flexGrow: 1,
})

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  paddingBottom: spacing.xxl,
  gap: spacing.md,
})

const $privacyNote: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  backgroundColor: colors.palette.primary100,
  borderRadius: 12,
  padding: spacing.md,
})

const $privacyText: ThemedStyle<TextStyle> = () => ({
  flex: 1,
})

const $guideCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderRadius: bentoRadii.card,
  overflow: "hidden",
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $guideHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
})

const $guideBody: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderTopWidth: 1,
  borderTopColor: colors.separator,
})

const $settingsHeaderIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 34,
  height: 34,
  borderRadius: 17,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.primary100,
})

const $settingsBody: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  gap: spacing.md,
  padding: spacing.md,
  borderTopWidth: 1,
  borderTopColor: colors.separator,
})

const $settingButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: colors.separator,
  backgroundColor: colors.background,
})

const $tagEntryRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginTop: spacing.xs,
  marginBottom: spacing.sm,
})

const $tagInputContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $tagAddButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  minHeight: 44,
  justifyContent: "center",
  paddingHorizontal: spacing.md,
  borderRadius: 10,
  backgroundColor: colors.tint,
})

const $matchingCallout: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
  padding: spacing.md,
  backgroundColor: colors.palette.primary100,
})

const $guideField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: 3,
  padding: spacing.md,
})

const $guideFieldHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $requirementBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
  borderRadius: 8,
  backgroundColor: colors.palette.primary100,
})

const $optionalBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral300,
})

const $requirementText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $typeBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $typeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $exampleText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $dateHint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  padding: spacing.md,
  paddingTop: 0,
})

const $pickerCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  gap: spacing.md,
  padding: spacing.xl,
  borderRadius: bentoRadii.card,
  borderWidth: 1,
  borderStyle: "dashed",
  borderColor: colors.border,
  backgroundColor: colors.palette.neutral100,
})

const $centerMuted: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
})

const $fullButton: ThemedStyle<ViewStyle> = () => ({
  alignSelf: "stretch",
})

const $linkButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  padding: spacing.xs,
})

const $linkText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $fileCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $flex: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $muted: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $fieldHeading: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  letterSpacing: 1,
  marginBottom: spacing.xs,
})

const $chips: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $chip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  borderRadius: 16,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $selectedChip: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  borderColor: colors.tint,
})

const $selectedChipText: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
})

const $mappingCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderRadius: bentoRadii.card,
  overflow: "hidden",
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $mappingRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.md,
})

const $rowSeparator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $summaryRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $appliedSettings: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
  padding: spacing.md,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.separator,
  backgroundColor: colors.palette.primary100,
})

const $summaryCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  alignItems: "center",
  padding: spacing.md,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $readyNumber: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $warningNumber: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.accent500,
})

const $blockedNumber: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const $previewList: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderRadius: 12,
  overflow: "hidden",
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $previewRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
  padding: spacing.md,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const $warningText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.accent500,
})

const $completeCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  gap: spacing.md,
  padding: spacing.xl,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $completeIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 68,
  height: 68,
  borderRadius: 34,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.tint,
})

const $busyOverlay: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
})

const $modalBackdrop: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  justifyContent: "center",
  padding: spacing.lg,
  backgroundColor: colors.palette.overlay50,
})

const $modalCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  maxHeight: "82%",
  padding: spacing.md,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.neutral100,
})

const $modalHelp: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xs,
  marginBottom: spacing.sm,
})

const $customBreedBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  gap: spacing.sm,
  padding: spacing.sm,
  marginBottom: spacing.sm,
  borderRadius: 12,
  backgroundColor: colors.background,
})

const $modalOption: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  minHeight: 46,
  paddingVertical: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})
