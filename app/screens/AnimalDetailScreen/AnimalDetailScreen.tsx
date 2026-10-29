import {
  type ComponentProps,
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { format, formatDistanceStrict } from "date-fns"
import { useTranslation } from "react-i18next"

import { Screen, Text, Button, TagInput, AnimalPicker, ScanTagButton } from "@/components"
import { BentoAnimalProfile } from "@/components/BentoAnimalProfile"
import { PhotoGallery } from "@/components/PhotoGallery"
import { WeightChart } from "@/components/WeightChart"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { useAnimal, useAnimalActions } from "@/hooks/useAnimals"
import { useOffspring } from "@/hooks/useOffspring"
import { useHealthRecords, useWeightRecords, useBreedingRecords } from "@/hooks/useRecords"
import { useRfidReader } from "@/hooks/useRfidReader"
import { useScheduledVaccinations } from "@/hooks/useVaccinationSchedules"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { bentoColors, bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { formatTraits } from "@/types/GeneticTraits"
import { getVaccinationHistory } from "@/utils/vaccinationHistory"

type Tab = "overview" | "health" | "vaccinations" | "weight" | "breeding"

export const AnimalDetailScreen: FC<AppStackScreenProps<"AnimalDetail">> = ({
  route,
  navigation,
}) => {
  const { t } = useTranslation()
  const { themed, theme } = useAppTheme()
  const c = bentoColors(theme.isDark)
  const { animalId } = route.params
  const { animal, isLoading } = useAnimal(animalId)
  const { deleteAnimal, updateAnimal } = useAnimalActions()
  const { scannedTag, startScanning, stopScanning, initialize, isInitialized, hasRfidHardware } =
    useRfidReader()
  // Only apply an inbound EPC when the farmer explicitly asked to re-scan, so a
  // stray trigger pull elsewhere can't silently retag the animal they're viewing.
  const [isRescanningRfid, setIsRescanningRfid] = useState(false)
  const { records: healthRecords } = useHealthRecords(animalId)
  const { records: weightRecords } = useWeightRecords(animalId)
  const { records: breedingRecords } = useBreedingRecords(animalId)
  const { vaccinations } = useScheduledVaccinations(animalId)
  const { offspring, stats: offspringStats, isLoading: offspringLoading } = useOffspring(animalId)

  // Same bring-up as the add/edit form: the reader is inert until initialised.
  useEffect(() => {
    if (hasRfidHardware && !isInitialized) {
      initialize()
    }
  }, [hasRfidHardware, isInitialized, initialize])

  const handleRescanRfid = useCallback(() => {
    setIsRescanningRfid(true)
    startScanning()
  }, [startScanning])

  const handleCancelRescanRfid = useCallback(() => {
    setIsRescanningRfid(false)
    stopScanning()
  }, [stopScanning])

  // Persist an EPC that arrived while a re-scan was in flight.
  useEffect(() => {
    if (!isRescanningRfid || !scannedTag?.epc) return
    const epc = scannedTag.epc
    setIsRescanningRfid(false)
    stopScanning()
    if (epc === animal?.rfidTag) return // already this tag; nothing to write
    updateAnimal(animalId, { rfidTag: epc }).catch((err) => {
      console.error("[AnimalDetail] Failed to save re-scanned RFID tag:", err)
      Alert.alert(t("common.error"), t("animalDetailScreen.rescan.saveFailed"))
    })
  }, [isRescanningRfid, scannedTag, animal?.rfidTag, animalId, updateAnimal, stopScanning, t])

  const handleVisualTagScanned = useCallback(
    (tagNumber: string) => {
      if (!tagNumber || tagNumber === animal?.visualTag) return
      updateAnimal(animalId, { visualTag: tagNumber }).catch((err) => {
        console.error("[AnimalDetail] Failed to save re-scanned visual tag:", err)
        Alert.alert(t("common.error"), t("animalDetailScreen.rescan.saveFailed"))
      })
    },
    [animal?.visualTag, animalId, updateAnimal, t],
  )

  // Stop the reader if we leave mid-scan, so it isn't left powered on.
  useEffect(() => {
    return () => {
      if (isRescanningRfid) stopScanning()
    }
  }, [isRescanningRfid, stopScanning])

  // Debug logging
  if (__DEV__) {
    if (animal) {
      console.log("[AnimalDetail] Animal data:", {
        visualTag: animal.visualTag,
        dateOfBirth: animal.dateOfBirth,
        dateOfBirthType: typeof animal.dateOfBirth,
        rawDateOfBirth: (animal as any)._raw?.date_of_birth,
        rawDateOfBirthType: typeof (animal as any)._raw?.date_of_birth,
      })
    }
    if (vaccinations.length > 0) {
      console.log(
        "[AnimalDetail] Vaccinations:",
        vaccinations.map((v) => ({
          id: v.id,
          hasSchedule: !!v.schedule,
          scheduleName: v.schedule?.name,
          hasAnimal: !!v.animal,
        })),
      )
    }
  }
  const [activeTab, setActiveTab] = useState<Tab>(route.params.initialTab ?? "overview")
  const [tags, setTags] = useState<string[]>(animal?.tagsList || [])
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [sireName, setSireName] = useState<string | null>(null)
  const [damName, setDamName] = useState<string | null>(null)
  const [showSirePicker, setShowSirePicker] = useState(false)
  const [showDamPicker, setShowDamPicker] = useState(false)
  const [showOffspringPicker, setShowOffspringPicker] = useState(false)

  // Load parent names
  useEffect(() => {
    const loadParents = async () => {
      if (animal?.sireId) {
        try {
          const sire = await database.get<Animal>("animals").find(animal.sireId)
          setSireName(sire.displayName)
        } catch (error) {
          console.log("[AnimalDetail] Sire not found:", error)
        }
      }
      if (animal?.damId) {
        try {
          const dam = await database.get<Animal>("animals").find(animal.damId)
          setDamName(dam.displayName)
        } catch (error) {
          console.log("[AnimalDetail] Dam not found:", error)
        }
      }
    }
    loadParents()
  }, [animal?.sireId, animal?.damId])

  const handleEdit = useCallback(() => {
    navigation.navigate("AnimalForm", { mode: "edit", animalId })
  }, [navigation, animalId])

  const handleTagsChange = useCallback(
    async (newTags: string[]) => {
      setTags(newTags)
      if (animal) {
        await database.write(async () => {
          await animal.update((a: any) => {
            a.tags = newTags.length > 0 ? JSON.stringify(newTags) : null
          })
        })
      }
    },
    [animal],
  )

  const handleSaveTags = useCallback(() => {
    setIsEditingTags(false)
  }, [])

  const handleDelete = useCallback(async () => {
    await deleteAnimal(animalId)
    navigation.goBack()
  }, [deleteAnimal, animalId, navigation])

  const handleSetSire = useCallback(
    async (sire: Animal | null) => {
      if (animal) {
        await database.write(async () => {
          await animal.update((a: any) => {
            a.sireId = sire?.id || null
            if (sire) {
              a.externalSireReference = null
              a.externalSireBreed = null
            }
          })
        })
        setSireName(sire?.displayName || null)
      }
    },
    [animal],
  )

  const handleSetDam = useCallback(
    async (dam: Animal | null) => {
      if (animal) {
        await database.write(async () => {
          await animal.update((a: any) => {
            a.damId = dam?.id || null
            if (dam) {
              a.externalDamReference = null
              a.externalDamBreed = null
            }
          })
        })
        setDamName(dam?.displayName || null)
      }
    },
    [animal],
  )

  const handleAddOffspring = useCallback(
    async (child: Animal | null) => {
      if (!child || !animal) return

      try {
        // Set this animal as the parent based on sex
        await database.write(async () => {
          await child.update((c: any) => {
            if (animal.sex === "male") {
              c.sireId = animal.id
              c.externalSireReference = null
              c.externalSireBreed = null
            } else if (animal.sex === "female") {
              c.damId = animal.id
              c.externalDamReference = null
              c.externalDamBreed = null
            }
          })
        })

        // Close the picker
        setShowOffspringPicker(false)

        // Offspring list will auto-update via useOffspring hook
        console.log(`[AnimalDetail] Added offspring: ${child.displayName}`)
      } catch (error) {
        console.error("[AnimalDetail] Failed to add offspring:", error)
      }
    },
    [animal],
  )

  if (isLoading || !animal) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]}>
        <View style={themed($centered)}>
          <Text
            text={isLoading ? t("animalDetailScreen.loading") : t("animalDetailScreen.notFound")}
          />
        </View>
      </Screen>
    )
  }

  const formatDate = (d: Date | null) => {
    if (__DEV__) {
      console.log("[AnimalDetail] formatDate called with:", {
        value: d,
        type: typeof d,
        isDate: d instanceof Date,
        timestamp: d ? d.getTime() : null,
      })
    }
    return d ? format(d, "dd MMM yyyy") : t("animalDetailScreen.overview.noValue")
  }
  const formatExternalParent = (reference: string | null, breed: string | null) =>
    [reference, breed ? `(${breed})` : null].filter(Boolean).join(" ")
  const externalSireLabel = formatExternalParent(
    animal.externalSireReference,
    animal.externalSireBreed,
  )
  const externalDamLabel = formatExternalParent(
    animal.externalDamReference,
    animal.externalDamBreed,
  )
  const nonVaccinationHealthRecords = healthRecords.filter(
    (record) => record.recordType !== "vaccination",
  )
  const linkedVaccinationRecordIds = new Set(
    vaccinations
      .map((vaccination) => vaccination.healthRecordId)
      .filter((recordId): recordId is string => Boolean(recordId)),
  )
  const standaloneVaccinationRecords = healthRecords.filter(
    (record) => record.recordType === "vaccination" && !linkedVaccinationRecordIds.has(record.id),
  )
  const ageLabel = animal.dateOfBirth
    ? formatDistanceStrict(animal.dateOfBirth, new Date(), { roundingMethod: "floor" })
    : t("animalDetailScreen.overview.noValue")
  const latestWeightLabel = weightRecords[0]
    ? `${weightRecords[0].weightKg} kg`
    : t("animalDetailScreen.overview.noValue")
  const statusColor =
    animal.status === "deceased"
      ? theme.colors.error
      : animal.status === "sold"
        ? theme.colors.palette.secondary500
        : animal.status === "transferred"
          ? theme.colors.palette.accent500
          : theme.colors.tint
  const profileHistory = animal.vaccinationHistory ? getVaccinationHistory(animal) : "unknown"
  const tabCounts: Partial<Record<Tab, number>> = {
    health: nonVaccinationHealthRecords.length,
    vaccinations: vaccinations.length + standaloneVaccinationRecords.length,
    weight: weightRecords.length,
    breeding: breedingRecords.length,
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($headerRow)}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={themed($headerIconButton)}
          accessibilityRole="button"
          accessibilityLabel={t("animalDetailScreen.backButton")}
        >
          <MaterialCommunityIcons name="arrow-left" size={23} color={theme.colors.text} />
        </Pressable>
        <Text text="Animal profile" preset="bold" size="sm" style={themed($headerTitle)} />
        <Pressable
          onPress={handleEdit}
          style={themed($editProfileButton)}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="pencil" size={17} color={theme.colors.tint} />
          <Text
            text={t("animalDetailScreen.editButton")}
            preset="bold"
            size="xs"
            style={themed($editProfileText)}
          />
        </Pressable>
      </View>

      <BentoAnimalProfile
        name={animal.displayName}
        eyebrow={animal.name && animal.visualTag ? `TAG ${animal.visualTag}` : "ANIMAL PROFILE"}
        subtitle={`${animal.breed} · ${animal.sexLabel}`}
        status={animal.status.charAt(0).toUpperCase() + animal.status.slice(1)}
        statusColor={statusColor}
        weight={latestWeightLabel}
        age={ageLabel}
        offspring={offspringLoading ? "—" : String(offspringStats.total)}
        onWeightHistory={() => setActiveTab("weight")}
        onWeigh={() => navigation.navigate("WeightRecordForm", { animalId })}
        onHealth={() => navigation.navigate("HealthRecordForm", { animalId })}
      />

      <View style={themed($tabRow)}>
        {(["overview", "health", "vaccinations", "weight", "breeding"] as Tab[]).map((tab) => {
          const icons = {
            overview: "information-outline",
            health: "medical-bag",
            vaccinations: "needle",
            weight: "scale",
            breeding: "heart",
          } as const
          const selected = activeTab === tab
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="tab"
              accessibilityLabel={t(`animalDetailScreen.tabs.${tab}`)}
              accessibilityState={{ selected }}
              testID={`animal-tab-${tab}`}
              style={themed(selected ? $tabActive : $tab)}
            >
              <View style={themed($tabIconRow)}>
                <MaterialCommunityIcons
                  accessible={false}
                  name={icons[tab]}
                  size={19}
                  color={selected ? c.onForest : c.muted}
                />
                {tabCounts[tab] !== undefined && tabCounts[tab]! > 0 ? (
                  <Text
                    text={String(tabCounts[tab])}
                    size="xxs"
                    style={{ color: selected ? c.lime : c.muted }}
                  />
                ) : null}
              </View>
              <Text
                preset="formLabel"
                text={t(`animalDetailScreen.tabs.${tab}`)}
                style={themed(selected ? $tabTextActive : $tabText)}
                numberOfLines={2}
              />
            </Pressable>
          )
        })}
      </View>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <View style={themed($section)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("uxFixes.reviewHistoryAction")}
            onPress={() => setActiveTab("vaccinations")}
            style={[
              themed($historySummary),
              { backgroundColor: profileHistory === "current" ? c.sage : c.peach },
            ]}
          >
            <MaterialCommunityIcons accessible={false} name="needle" size={23} color={c.ink} />
            <View style={themed($historySummaryCopy)}>
              <Text text={t("uxFixes.historyLabel")} size="xs" style={{ color: c.muted }} />
              <Text
                text={t(
                  `uxFixes.${profileHistory === "current" ? "historyCurrent" : profileHistory === "needs_review" ? "historyReview" : "historyUnknown"}`,
                )}
                preset="bold"
                style={{ color: c.ink }}
              />
              {!animal.vaccinationHistory && (
                <Text text={t("uxFixes.historyLegacyHelp")} size="xxs" style={{ color: c.muted }} />
              )}
            </View>
            <MaterialCommunityIcons
              accessible={false}
              name="chevron-right"
              size={22}
              color={c.ink}
            />
          </Pressable>
          <PhotoGallery photosJson={animal.photos} />
          <View style={themed($overviewCard)}>
            <View style={themed($overviewCardHeader)}>
              <View style={themed($sectionIcon)}>
                <MaterialCommunityIcons
                  name="card-account-details-outline"
                  size={18}
                  color={theme.colors.tint}
                />
              </View>
              <View>
                <Text preset="bold" text="Identification" />
                <Text text="Tags and registration details" size="xs" style={themed($dimText)} />
              </View>
            </View>

            <View style={themed($infoGrid)}>
              <InfoTile
                icon="radio-tower"
                label={t("animalDetailScreen.overview.rfidTag")}
                value={
                  isRescanningRfid
                    ? t("animalDetailScreen.rescan.scanning")
                    : animal.rfidTag || t("animalDetailScreen.overview.noValue")
                }
                iconColor={theme.colors.tint}
                themed={themed}
                action={
                  isRescanningRfid ? (
                    <Pressable
                      onPress={handleCancelRescanRfid}
                      style={themed($tileAction)}
                      accessibilityRole="button"
                    >
                      <MaterialCommunityIcons name="close" size={18} color={theme.colors.textDim} />
                    </Pressable>
                  ) : hasRfidHardware ? (
                    <Pressable
                      onPress={handleRescanRfid}
                      style={themed($tileAction)}
                      accessibilityRole="button"
                      accessibilityLabel={t("animalDetailScreen.rescan.rfidLabel")}
                    >
                      <MaterialCommunityIcons name="refresh" size={18} color={theme.colors.tint} />
                    </Pressable>
                  ) : undefined
                }
              />
              <InfoTile
                icon="tag-outline"
                label={t("animalDetailScreen.overview.visualTag")}
                value={animal.visualTag || t("animalDetailScreen.overview.noValue")}
                iconColor={theme.colors.tint}
                themed={themed}
                action={
                  <ScanTagButton
                    compact
                    onTagScanned={handleVisualTagScanned}
                    style={themed($rescanScanButton)}
                  />
                }
              />
              <InfoTile
                icon="calendar-outline"
                label={t("animalDetailScreen.overview.dateOfBirth")}
                value={formatDate(animal.dateOfBirth)}
                iconColor={theme.colors.tint}
                themed={themed}
              />
              <InfoTile
                icon="certificate-outline"
                label={t("animalDetailScreen.overview.registrationNumber")}
                value={animal.registrationNumber || t("animalDetailScreen.overview.noValue")}
                iconColor={theme.colors.tint}
                themed={themed}
              />
              {animal.sourceName ? (
                <InfoTile
                  icon="barn"
                  label="Source farm / breeder"
                  value={animal.sourceName}
                  iconColor={theme.colors.tint}
                  themed={themed}
                  wide
                />
              ) : null}
            </View>
          </View>

          {/* Lineage Summary (Read-only, edit in Breeding tab) */}
          {(animal.sireId ||
            animal.damId ||
            externalSireLabel ||
            externalDamLabel ||
            offspringStats.total > 0) && (
            <View style={themed($lineageSection)}>
              <View style={themed($overviewCardHeader)}>
                <View style={themed($sectionIcon)}>
                  <MaterialCommunityIcons name="family-tree" size={18} color={theme.colors.tint} />
                </View>
                <View>
                  <Text preset="bold" text="Lineage" />
                  <Text text="Parents and offspring" size="xs" style={themed($dimText)} />
                </View>
              </View>

              {(animal.sireId || externalSireLabel) && (
                <DetailRow
                  label="Sire"
                  value={animal.sireId ? sireName || "Loading..." : externalSireLabel}
                  themed={themed}
                />
              )}

              {(animal.damId || externalDamLabel) && (
                <DetailRow
                  label="Dam"
                  value={animal.damId ? damName || "Loading..." : externalDamLabel}
                  themed={themed}
                />
              )}

              {offspringStats.total > 0 && (
                <DetailRow
                  label="Offspring"
                  value={`${offspringStats.total} (${offspringStats.alive} active)`}
                  themed={themed}
                />
              )}

              <Text
                text="→ Edit parents in Breeding tab"
                size="xs"
                style={[themed($dimText), { fontStyle: "italic", marginTop: 8 }]}
              />
            </View>
          )}

          {/* Genetic Traits */}
          {animal.traits && formatTraits(animal.traits).length > 0 && (
            <View style={themed($traitsSection)}>
              <View style={themed($overviewCardHeader)}>
                <View style={themed($sectionIcon)}>
                  <MaterialCommunityIcons name="dna" size={18} color={theme.colors.tint} />
                </View>
                <Text preset="bold" text="Genetic traits" />
              </View>
              <View style={themed($traitsGrid)}>
                {formatTraits(animal.traits).map((trait, index) => (
                  <View key={index} style={themed($traitChip)}>
                    <MaterialCommunityIcons name="dna" size={14} color={theme.colors.tint} />
                    <Text text={trait} size="xs" style={{ marginLeft: 4 }} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {animal.notes ? (
            <View style={themed($overviewCard)}>
              <View style={themed($overviewCardHeader)}>
                <View style={themed($sectionIcon)}>
                  <MaterialCommunityIcons
                    name="note-text-outline"
                    size={18}
                    color={theme.colors.tint}
                  />
                </View>
                <Text preset="bold" text={t("animalDetailScreen.overview.notes")} />
              </View>
              <Text text={animal.notes} size="sm" style={themed($notesText)} />
            </View>
          ) : null}

          <View style={themed($tagsSection)}>
            <View style={themed($tagsSectionHeader)}>
              <View style={themed($overviewCardHeader)}>
                <View style={themed($sectionIcon)}>
                  <MaterialCommunityIcons
                    name="tag-multiple-outline"
                    size={18}
                    color={theme.colors.tint}
                  />
                </View>
                <Text text="Tags" preset="bold" />
              </View>
              {!isEditingTags && (
                <Pressable onPress={() => setIsEditingTags(true)} style={themed($editTagsButton)}>
                  <MaterialCommunityIcons name="pencil" size={16} color={theme.colors.tint} />
                  <Text text="Edit" size="xs" style={{ color: theme.colors.tint, marginLeft: 4 }} />
                </Pressable>
              )}
            </View>
            {isEditingTags ? (
              <>
                <TagInput tags={tags} onTagsChange={handleTagsChange} placeholder="Add tags..." />
                <Button
                  text="Done"
                  preset="filled"
                  onPress={handleSaveTags}
                  style={themed($saveTagsButton)}
                />
              </>
            ) : (
              <View style={themed($tagsDisplay)}>
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <View key={tag} style={themed($tagChip)}>
                      <Text size="xs" text={tag} style={themed($tagChipText)} />
                    </View>
                  ))
                ) : (
                  <Text text="No tags" size="sm" style={themed($dimText)} />
                )}
              </View>
            )}
          </View>

          <Button
            text={t("animalDetailScreen.deleteButton")}
            preset="default"
            textStyle={themed($deleteText)}
            style={themed($deleteButton)}
            onPress={handleDelete}
          />
        </View>
      )}

      {activeTab === "vaccinations" && (
        <View style={themed($section)}>
          <Text preset="formLabel" text={t("uxFixes.historyLabel")} />
          <Text
            text={t(
              `uxFixes.${profileHistory === "current" ? "historyCurrent" : profileHistory === "needs_review" ? "historyReview" : "historyUnknown"}`,
            )}
          />
          {!animal.vaccinationHistory && <Text text={t("uxFixes.historyLegacyHelp")} size="xs" />}
          <Button
            text={t("uxFixes.reviewHistoryAction")}
            onPress={() => navigation.navigate("AnimalForm", { mode: "edit", animalId })}
          />
          {/* Vaccinations Section */}
          <Text preset="subheading" text="Vaccination Schedule" style={themed($sectionTitle)} />
          {vaccinations.length === 0 ? (
            <View style={themed($emptyState)}>
              <MaterialCommunityIcons
                name="needle"
                size={48}
                color={theme.colors.palette.neutral300}
              />
              <Text text="No vaccinations scheduled" style={themed($emptyText)} />
              <Text
                text="Vaccinations are automatically scheduled based on age and active schedules"
                size="xs"
                style={themed($dimText)}
              />
            </View>
          ) : (
            <>
              {vaccinations.map((v) => {
                const getUrgencyColor = () => {
                  if (v.urgencyLevel === "critical" || v.urgencyLevel === "overdue")
                    return theme.colors.error
                  if (v.urgencyLevel === "soon") return theme.colors.palette.accent500
                  return theme.colors.textDim
                }

                const getStatusBadgeColor = () => {
                  if (v.status === "administered") return theme.colors.palette.primary100
                  if (v.status === "skipped") return theme.colors.palette.neutral200
                  return theme.colors.palette.accent100
                }

                return (
                  <View
                    key={v.id}
                    style={[themed($vaccinationCard), { borderLeftColor: getUrgencyColor() }]}
                  >
                    <View style={themed($recordHeader)}>
                      <View style={themed($vaccinationHeaderLeft)}>
                        <MaterialCommunityIcons name="needle" size={20} color={getUrgencyColor()} />
                        <Text
                          preset="bold"
                          text={v.schedule?.name || "Unknown Vaccination"}
                          style={{ marginLeft: 8, flex: 1 }}
                          numberOfLines={2}
                        />
                      </View>
                      <View
                        style={[
                          themed($vaccinationBadge),
                          { backgroundColor: getStatusBadgeColor() },
                        ]}
                      >
                        <Text text={v.status} size="xxs" style={themed($vaccinationBadgeText)} />
                      </View>
                    </View>

                    {v.schedule?.protocol && (
                      <Text
                        text={v.schedule.protocol.productName}
                        size="sm"
                        style={themed($dimText)}
                      />
                    )}

                    <View style={themed($vaccinationDetails)}>
                      <View style={themed($vaccinationDetailRow)}>
                        <MaterialCommunityIcons
                          name="calendar"
                          size={14}
                          color={theme.colors.textDim}
                        />
                        <Text
                          text={`Due: ${formatDate(v.dueDate)}`}
                          size="xs"
                          style={themed($vaccinationDetailText)}
                        />
                      </View>

                      {v.status === "pending" && v.daysUntilDue !== undefined && (
                        <View style={themed($vaccinationDetailRow)}>
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={14}
                            color={getUrgencyColor()}
                          />
                          <Text
                            text={
                              v.daysUntilDue < 0
                                ? `${Math.abs(v.daysUntilDue)} days overdue`
                                : `${v.daysUntilDue} days until due`
                            }
                            size="xs"
                            style={[themed($vaccinationDetailText), { color: getUrgencyColor() }]}
                          />
                        </View>
                      )}

                      {v.administeredDate && (
                        <View style={themed($vaccinationDetailRow)}>
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={14}
                            color={theme.colors.palette.primary500}
                          />
                          <Text
                            text={`Administered: ${formatDate(v.administeredDate)}`}
                            size="xs"
                            style={themed($vaccinationDetailText)}
                          />
                        </View>
                      )}

                      <View style={themed($vaccinationDetailRow)}>
                        <MaterialCommunityIcons
                          name="needle"
                          size={14}
                          color={theme.colors.textDim}
                        />
                        <Text
                          text={`Dose ${v.doseNumber}${v.schedule?.boosterCount ? ` of ${v.schedule.boosterCount}` : ""}`}
                          size="xs"
                          style={themed($vaccinationDetailText)}
                        />
                      </View>
                    </View>

                    {v.status === "pending" && (
                      <Button
                        text="Administer Vaccination"
                        preset="filled"
                        style={themed($administerButton)}
                        onPress={() =>
                          navigation.navigate("Main", {
                            screen: "Chute",
                            params: {
                              mode: "single",
                              animalId,
                              protocolId: v.schedule?.protocol?.id,
                              vaccinationId: v.id,
                              requestId: Date.now(),
                            },
                          })
                        }
                      />
                    )}
                  </View>
                )
              })}
            </>
          )}

          {standaloneVaccinationRecords.length > 0 && (
            <>
              <Text
                preset="subheading"
                text="Other Vaccination Records"
                style={[themed($sectionTitle), { marginTop: 16 }]}
              />
              {standaloneVaccinationRecords.map((record) => (
                <View key={record.id} style={themed($recordCard)}>
                  <View style={themed($recordHeader)}>
                    <Text preset="bold" text={record.description || "Vaccination"} />
                    <Text size="xs" text={formatDate(record.recordDate)} style={themed($dimText)} />
                  </View>
                  {record.productName ? (
                    <Text
                      text={t("animalDetailScreen.health.product", {
                        product: record.productName,
                      })}
                      size="xs"
                      style={themed($dimText)}
                    />
                  ) : null}
                  <PhotoGallery photosJson={record.photos} />
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {activeTab === "health" && (
        <View style={themed($section)}>
          <Button
            text={t("animalDetailScreen.health.addButton")}
            preset="filled"
            style={themed($addRecordButton)}
            onPress={() => navigation.navigate("HealthRecordForm", { animalId })}
          />
          <Text preset="subheading" text="Health Records" style={themed($sectionTitle)} />
          {nonVaccinationHealthRecords.length === 0 ? (
            <Text text={t("animalDetailScreen.health.empty")} style={themed($dimText)} />
          ) : (
            nonVaccinationHealthRecords.map((r) => (
              <View key={r.id} style={themed($recordCard)}>
                <View style={themed($recordHeader)}>
                  <Text preset="bold" text={formatRecordType(r.recordType)} />
                  <Text size="xs" text={formatDate(r.recordDate)} style={themed($dimText)} />
                </View>
                <Text text={r.description} size="sm" />
                {r.productName ? (
                  <Text
                    text={t("animalDetailScreen.health.product", { product: r.productName })}
                    size="xs"
                    style={themed($dimText)}
                  />
                ) : null}
                <PhotoGallery photosJson={r.photos} />
                {r.createdByName ? (
                  <Text
                    text={t("animalDetailScreen.health.recordedBy", {
                      name: r.createdByName.split("@")[0],
                    })}
                    size="xxs"
                    style={themed($createdByText)}
                  />
                ) : null}
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === "weight" && (
        <View style={themed($section)}>
          <Button
            text={t("animalDetailScreen.weight.addButton")}
            preset="filled"
            style={themed($addRecordButton)}
            onPress={() => navigation.navigate("WeightRecordForm", { animalId })}
          />
          {weightRecords.length >= 2 && <WeightChart records={weightRecords} />}
          {weightRecords.length === 0 ? (
            <Text text={t("animalDetailScreen.weight.empty")} style={themed($dimText)} />
          ) : (
            weightRecords.map((r) => (
              <View key={r.id} style={themed($recordCard)}>
                <View style={themed($recordHeader)}>
                  <Text
                    preset="bold"
                    text={t("animalDetailScreen.weight.weightValue", { weight: r.weightKg })}
                  />
                  <Text size="xs" text={formatDate(r.recordDate)} style={themed($dimText)} />
                </View>
                {r.conditionScore ? (
                  <Text
                    text={t("animalDetailScreen.weight.condition", { score: r.conditionScore })}
                    size="sm"
                  />
                ) : null}
                <PhotoGallery photosJson={r.photos} />
                {r.createdByName ? (
                  <Text
                    text={t("animalDetailScreen.weight.recordedBy", {
                      name: r.createdByName.split("@")[0],
                    })}
                    size="xxs"
                    style={themed($createdByText)}
                  />
                ) : null}
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === "breeding" && (
        <View style={themed($section)}>
          {/* Parents (Lineage) Section */}
          <View style={themed($lineageSection)}>
            <Text preset="subheading" text="Parents" style={themed($sectionTitle)} />

            {/* Sire */}
            <View style={themed($lineageRow)}>
              <MaterialCommunityIcons name="gender-male" size={18} color={theme.colors.tint} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text text="Sire" size="xs" style={themed($dimText)} />
                {animal.sireId ? (
                  <Pressable
                    onPress={async () => {
                      try {
                        const sire = await database.get<Animal>("animals").find(animal.sireId!)
                        navigation.navigate("AnimalDetail", { animalId: sire.id })
                      } catch (error) {
                        console.error("Failed to navigate to sire:", error)
                      }
                    }}
                  >
                    <Text
                      text={sireName || "Loading..."}
                      preset="bold"
                      style={{ textDecorationLine: "underline" }}
                    />
                  </Pressable>
                ) : externalSireLabel ? (
                  <>
                    <Text text={externalSireLabel} preset="bold" />
                    <Text text="External parent" size="xxs" style={themed($dimText)} />
                  </>
                ) : (
                  <Text text="Not set" style={themed($dimText)} />
                )}
                <View style={themed($parentActions)}>
                  <Pressable
                    onPress={() =>
                      navigation.navigate("AnimalForm", {
                        mode: "create",
                        linkAsParentOf: animalId,
                        parentRole: "sire",
                      })
                    }
                    style={themed($parentAction)}
                  >
                    <MaterialCommunityIcons name="plus" size={15} color={theme.colors.tint} />
                    <Text text="Add new" size="xs" style={themed($parentActionText)} />
                  </Pressable>
                  <Pressable onPress={() => setShowSirePicker(true)} style={themed($parentAction)}>
                    <MaterialCommunityIcons name="link" size={15} color={theme.colors.tint} />
                    <Text text="Link existing" size="xs" style={themed($parentActionText)} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Dam */}
            <View style={themed($lineageRow)}>
              <MaterialCommunityIcons
                name="gender-female"
                size={18}
                color={theme.colors.palette.accent500}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text text="Dam" size="xs" style={themed($dimText)} />
                {animal.damId ? (
                  <Pressable
                    onPress={async () => {
                      try {
                        const dam = await database.get<Animal>("animals").find(animal.damId!)
                        navigation.navigate("AnimalDetail", { animalId: dam.id })
                      } catch (error) {
                        console.error("Failed to navigate to dam:", error)
                      }
                    }}
                  >
                    <Text
                      text={damName || "Loading..."}
                      preset="bold"
                      style={{ textDecorationLine: "underline" }}
                    />
                  </Pressable>
                ) : externalDamLabel ? (
                  <>
                    <Text text={externalDamLabel} preset="bold" />
                    <Text text="External parent" size="xxs" style={themed($dimText)} />
                  </>
                ) : (
                  <Text text="Not set" style={themed($dimText)} />
                )}
                <View style={themed($parentActions)}>
                  <Pressable
                    onPress={() =>
                      navigation.navigate("AnimalForm", {
                        mode: "create",
                        linkAsParentOf: animalId,
                        parentRole: "dam",
                      })
                    }
                    style={themed($parentAction)}
                  >
                    <MaterialCommunityIcons name="plus" size={15} color={theme.colors.tint} />
                    <Text text="Add new" size="xs" style={themed($parentActionText)} />
                  </Pressable>
                  <Pressable onPress={() => setShowDamPicker(true)} style={themed($parentAction)}>
                    <MaterialCommunityIcons name="link" size={15} color={theme.colors.tint} />
                    <Text text="Link existing" size="xs" style={themed($parentActionText)} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Offspring Section */}
          <View style={themed($offspringSection)}>
            <View style={themed($sectionHeader)}>
              <Text preset="subheading" text="Offspring" style={themed($sectionTitle)} />
              <Pressable onPress={() => setShowOffspringPicker(true)} style={themed($addButton)}>
                <MaterialCommunityIcons name="link" size={20} color={theme.colors.tint} />
                <Text
                  text="Link Existing"
                  size="sm"
                  style={{ color: theme.colors.tint, marginLeft: 4 }}
                />
              </Pressable>
            </View>

            {offspringStats.total > 0 && (
              <>
                {/* Stats Card */}
                <View style={themed($offspringStatsCard)}>
                  <View style={themed($statsRow)}>
                    <View style={themed($statItem)}>
                      <Text
                        text={offspringStats.total.toString()}
                        preset="heading"
                        style={{ color: theme.colors.tint }}
                      />
                      <Text text="Total" size="xs" style={themed($dimText)} />
                    </View>
                    <View style={themed($statItem)}>
                      <Text
                        text={offspringStats.alive.toString()}
                        preset="heading"
                        style={{ color: theme.colors.palette.primary500 }}
                      />
                      <Text text="Active" size="xs" style={themed($dimText)} />
                    </View>
                    <View style={themed($statItem)}>
                      <Text text={offspringStats.male.toString()} preset="heading" />
                      <Text text="Male" size="xs" style={themed($dimText)} />
                    </View>
                    <View style={themed($statItem)}>
                      <Text text={offspringStats.female.toString()} preset="heading" />
                      <Text text="Female" size="xs" style={themed($dimText)} />
                    </View>
                  </View>
                </View>

                {/* Offspring List (first 5) */}
                <View style={themed($offspringList)}>
                  {offspring.slice(0, 5).map((child) => (
                    <Pressable
                      key={child.id}
                      onPress={() => navigation.navigate("AnimalDetail", { animalId: child.id })}
                      style={themed($offspringRow)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text text={child.displayName} preset="bold" />
                        <Text
                          text={`${child.breed} | ${child.sexLabel}`}
                          size="xs"
                          style={themed($dimText)}
                        />
                      </View>
                      <View style={[$statusBadge, { backgroundColor: theme.colors.tint + "22" }]}>
                        <Text text={child.status} size="xxs" style={{ color: theme.colors.tint }} />
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={theme.colors.textDim}
                      />
                    </Pressable>
                  ))}

                  {offspring.length > 5 && (
                    <Text
                      text={`+ ${offspring.length - 5} more offspring`}
                      size="sm"
                      style={themed($dimText)}
                    />
                  )}
                </View>
              </>
            )}

            {offspringStats.total === 0 && (
              <View style={themed($helpText)}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={16}
                  color={theme.colors.textDim}
                />
                <Text
                  text="No offspring yet. Use 'Link Existing' to connect existing animals, or add a breeding record below to track pregnancies."
                  size="xs"
                  style={[themed($dimText), { flex: 1, marginLeft: 8 }]}
                />
              </View>
            )}
          </View>

          {/* Breeding Records */}
          <View style={themed($breedingRecordsSection)}>
            <Text preset="subheading" text="Breeding Records" style={themed($sectionTitle)} />
            <Text
              text="Track breeding events, pregnancies, and births. When a calf is born, you can link it to create the parent-child relationship."
              size="xs"
              style={[themed($dimText), { marginBottom: 12, fontStyle: "italic" }]}
            />
            <Button
              text={t("animalDetailScreen.breeding.addButton")}
              preset="filled"
              style={themed($addRecordButton)}
              onPress={() => navigation.navigate("BreedingRecordForm", { animalId })}
            />
          </View>
          {breedingRecords.length === 0 ? (
            <Text text={t("animalDetailScreen.breeding.empty")} style={themed($dimText)} />
          ) : (
            breedingRecords.map((r) => (
              <View key={r.id} style={themed($recordCard)}>
                <View style={themed($recordHeader)}>
                  <Text preset="bold" text={r.method} />
                  <Text size="xs" text={r.outcome} style={themed($dimText)} />
                </View>
                <Text
                  text={t("animalDetailScreen.breeding.bred", { date: formatDate(r.breedingDate) })}
                  size="sm"
                />
                {r.expectedCalvingDate ? (
                  <Text
                    text={t("animalDetailScreen.breeding.expectedCalving", {
                      date: formatDate(r.expectedCalvingDate),
                    })}
                    size="xs"
                    style={themed($dimText)}
                  />
                ) : null}
                <PhotoGallery photosJson={r.photos} />
                {r.createdByName ? (
                  <Text
                    text={t("animalDetailScreen.breeding.recordedBy", {
                      name: r.createdByName.split("@")[0],
                    })}
                    size="xxs"
                    style={themed($createdByText)}
                  />
                ) : null}
              </View>
            ))
          )}
        </View>
      )}

      {/* Animal Pickers */}
      <AnimalPicker
        visible={showSirePicker}
        onClose={() => setShowSirePicker(false)}
        onSelect={handleSetSire}
        currentAnimalId={animalId}
        filterSex="male"
        title="Select Sire"
        allowClear={true}
      />

      <AnimalPicker
        visible={showDamPicker}
        onClose={() => setShowDamPicker(false)}
        onSelect={handleSetDam}
        currentAnimalId={animalId}
        filterSex="female"
        title="Select Dam"
        allowClear={true}
      />

      <AnimalPicker
        visible={showOffspringPicker}
        onClose={() => setShowOffspringPicker(false)}
        onSelect={handleAddOffspring}
        currentAnimalId={animalId}
        title={`Add Offspring${animal?.sex === "male" ? " (as Sire)" : animal?.sex === "female" ? " (as Dam)" : ""}`}
        allowClear={false}
      />
    </Screen>
  )
}

function InfoTile({
  action,
  icon,
  iconColor,
  label,
  themed,
  value,
  wide = false,
}: {
  action?: ReactNode
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"]
  iconColor: string
  label: string
  themed: (style: ThemedStyle<any>) => any
  value: string
  wide?: boolean
}) {
  return (
    <View style={[themed($infoTile), wide && themed($infoTileWide)]}>
      <View style={themed($infoTileLabelRow)}>
        <MaterialCommunityIcons name={icon} size={15} color={iconColor} />
        <Text text={label} size="xxs" numberOfLines={1} style={themed($detailLabel)} />
      </View>
      <View style={themed($infoTileValueRow)}>
        <Text
          text={value}
          preset="bold"
          size="sm"
          numberOfLines={2}
          style={themed($infoTileValue)}
        />
        {action}
      </View>
    </View>
  )
}

function formatRecordType(recordType: string) {
  return recordType.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

// Simple detail row component
function DetailRow({
  label,
  value,
  themed,
}: {
  label: string
  value: string
  themed: (style: ThemedStyle<any>) => any
}) {
  return (
    <View style={themed($detailRow)}>
      <Text text={label} size="sm" style={themed($detailLabel)} />
      <Text text={value} size="sm" />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.xxl,
})

const $centered: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
})

const $headerRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginTop: spacing.xxs,
  marginBottom: spacing.sm,
  gap: spacing.xs,
})

const $headerIconButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 44,
  height: 44,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 22,
  backgroundColor: colors.palette.neutral100,
})

const $headerTitle: ThemedStyle<TextStyle> = () => ({
  flex: 1,
  textAlign: "center",
  flexShrink: 1,
})

const $editProfileButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.xxs,
  minHeight: 44,
  paddingHorizontal: spacing.sm,
  borderRadius: 20,
  borderWidth: 0,
  backgroundColor: colors.palette.primary100,
})

const $editProfileText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $statusBadge: ViewStyle = {
  borderRadius: 10,
  paddingHorizontal: 8,
  paddingVertical: 3,
}

const $tabRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: 5,
  marginBottom: spacing.md,
})
const $tabIconRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  gap: 4,
  alignItems: "center",
  justifyContent: "center",
})
const $tab: ThemedStyle<ViewStyle> = ({ isDark }) => ({
  flex: 1,
  minWidth: 0,
  minHeight: 68,
  borderRadius: 18,
  paddingVertical: 10,
  paddingHorizontal: 3,
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  backgroundColor: bentoColors(isDark).surface,
})
const $tabActive: ThemedStyle<ViewStyle> = (theme) => ({
  ...$tab(theme),
  backgroundColor: bentoColors(theme.isDark).forest,
})
const $tabText: ThemedStyle<TextStyle> = ({ isDark }) => ({
  color: bentoColors(isDark).muted,
  fontSize: 10,
  lineHeight: 13,
  textAlign: "center",
})
const $tabTextActive: ThemedStyle<TextStyle> = (theme) => ({
  ...$tabText(theme),
  color: bentoColors(theme.isDark).onForest,
})
const $historySummary: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  borderRadius: bentoRadii.card,
  padding: spacing.md,
})
const $historySummaryCopy: ThemedStyle<ViewStyle> = () => ({ flex: 1, gap: 3 })

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
})

const $detailRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: spacing.md,
  paddingVertical: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $detailLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $overviewCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.md,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.neutral100,
  gap: spacing.sm,
})

const $overviewCardHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $sectionIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 34,
  height: 34,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.primary100,
})

const $infoGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $infoTile: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexGrow: 1,
  flexBasis: "47%",
  minHeight: 76,
  padding: spacing.sm,
  borderRadius: 12,
  backgroundColor: colors.background,
  justifyContent: "space-between",
  gap: spacing.xs,
})

const $infoTileWide: ThemedStyle<ViewStyle> = () => ({
  flexBasis: "100%",
})

const $infoTileLabelRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
})

const $infoTileValueRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: spacing.xxs,
})

const $infoTileValue: ThemedStyle<TextStyle> = () => ({
  flex: 1,
})

const $tileAction: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.neutral100,
})

const $notesText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  lineHeight: 21,
})

const $rescanScanButton: ThemedStyle<ViewStyle> = () => ({
  width: 32,
  height: 32,
})

const $recordCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: bentoRadii.card,
  padding: spacing.md,
  gap: spacing.xs,
})

const $recordHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $addRecordButton: ThemedStyle<ViewStyle> = () => ({
  alignSelf: "flex-start",
})

const $deleteButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.lg,
  borderColor: colors.error,
  opacity: 0.82,
})

const $deleteText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const $createdByText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xxs,
  fontStyle: "italic",
})

const $emptyState: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  padding: spacing.xl,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.neutral100,
})

const $emptyText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  marginBottom: spacing.xs,
})

const $vaccinationCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: bentoRadii.card,
  padding: spacing.md,
  borderLeftWidth: 3,
  borderTopWidth: 1,
  borderRightWidth: 1,
  borderBottomWidth: 1,
  borderTopColor: colors.border,
  borderRightColor: colors.border,
  borderBottomColor: colors.border,
})

const $vaccinationHeaderLeft: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
})

const $vaccinationBadge: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 10,
})

const $vaccinationBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "600",
})

const $vaccinationDetails: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  gap: spacing.xs,
})

const $vaccinationDetailRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
})

const $vaccinationDetailText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $administerButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

const $tagsSection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.md,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.neutral100,
})

const $tagsSectionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.xs,
})

const $editTagsButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
})

const $tagsDisplay: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $tagChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: bentoRadii.button,
  borderWidth: 1,
  borderColor: colors.palette.primary300,
})

const $tagChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $saveTagsButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  alignSelf: "flex-start",
})

const $lineageSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.md,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.neutral100,
  gap: spacing.xs,
})

const $lineageRow: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.sm,
  backgroundColor: colors.background,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.border,
})

const $parentActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  marginTop: spacing.sm,
})

const $parentAction: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
  borderWidth: 1,
  borderColor: colors.tint,
  borderRadius: 16,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  backgroundColor: colors.background,
})

const $parentActionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $traitsSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.md,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.neutral100,
})

const $traitsGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  marginTop: spacing.xs,
})

const $traitChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.background,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: bentoRadii.button,
  borderWidth: 1,
  borderColor: colors.border,
})

const $offspringStatsCard: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: bentoRadii.card,
  padding: spacing.md,
  marginBottom: spacing.md,
})

const $statsRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-around",
})

const $statItem: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
})

const $offspringSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.lg,
})

const $sectionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
})

const $addButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.xs,
})

const $helpText: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  padding: spacing.sm,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  marginTop: spacing.sm,
})

const $breedingRecordsSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $offspringList: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
  marginBottom: spacing.lg,
})

const $offspringRow: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.sm,
  backgroundColor: colors.background,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.border,
  gap: spacing.sm,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
  marginBottom: spacing.xxs,
})
