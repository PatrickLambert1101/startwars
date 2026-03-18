import { FC, useCallback, useState, useEffect } from "react"
import { Pressable, View, ViewStyle, TextStyle } from "react-native"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"

import { Screen, Text, Button, TagInput, AnimalPicker } from "@/components"
import { WeightChart } from "@/components/WeightChart"
import { PhotoGallery } from "@/components/PhotoGallery"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAnimal, useAnimalActions } from "@/hooks/useAnimals"
import { useHealthRecords, useWeightRecords, useBreedingRecords } from "@/hooks/useRecords"
import { useScheduledVaccinations } from "@/hooks/useVaccinationSchedules"
import { useOffspring } from "@/hooks/useOffspring"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { formatTraits } from "@/types/GeneticTraits"

type Tab = "overview" | "health" | "weight" | "breeding"

export const AnimalDetailScreen: FC<AppStackScreenProps<"AnimalDetail">> = ({ route, navigation }) => {
  const { t } = useTranslation()
  const { themed, theme } = useAppTheme()
  const { animalId } = route.params
  const { animal, isLoading } = useAnimal(animalId)
  const { deleteAnimal } = useAnimalActions()
  const { records: healthRecords } = useHealthRecords(animalId)
  const { records: weightRecords } = useWeightRecords(animalId)
  const { records: breedingRecords } = useBreedingRecords(animalId)
  const { vaccinations } = useScheduledVaccinations(animalId)
  const { offspring, stats: offspringStats } = useOffspring(animalId)

  // Debug logging
  if (__DEV__ && vaccinations.length > 0) {
    console.log("[AnimalDetail] Vaccinations:", vaccinations.map(v => ({
      id: v.id,
      hasSchedule: !!v.schedule,
      scheduleName: v.schedule?.name,
      hasAnimal: !!v.animal,
    })))
  }
  const [activeTab, setActiveTab] = useState<Tab>("overview")
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

  const handleTagsChange = useCallback(async (newTags: string[]) => {
    setTags(newTags)
    if (animal) {
      await database.write(async () => {
        await animal.update((a: any) => {
          a.tags = newTags.length > 0 ? JSON.stringify(newTags) : null
        })
      })
    }
  }, [animal])

  const handleSaveTags = useCallback(() => {
    setIsEditingTags(false)
  }, [])

  const handleDelete = useCallback(async () => {
    await deleteAnimal(animalId)
    navigation.goBack()
  }, [deleteAnimal, animalId, navigation])

  const handleSetSire = useCallback(async (sire: Animal | null) => {
    if (animal) {
      await database.write(async () => {
        await animal.update((a: any) => {
          a.sireId = sire?.id || null
        })
      })
      setSireName(sire?.displayName || null)
    }
  }, [animal])

  const handleSetDam = useCallback(async (dam: Animal | null) => {
    if (animal) {
      await database.write(async () => {
        await animal.update((a: any) => {
          a.damId = dam?.id || null
        })
      })
      setDamName(dam?.displayName || null)
    }
  }, [animal])

  const handleAddOffspring = useCallback(async (child: Animal | null) => {
    if (!child || !animal) return

    try {
      // Set this animal as the parent based on sex
      await database.write(async () => {
        await child.update((c: any) => {
          if (animal.sex === "male") {
            c.sireId = animal.id
          } else if (animal.sex === "female") {
            c.damId = animal.id
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
  }, [animal])

  if (isLoading || !animal) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]}>
        <View style={themed($centered)}>
          <Text text={isLoading ? t("animalDetailScreen.loading") : t("animalDetailScreen.notFound")} />
        </View>
      </Screen>
    )
  }

  const formatDate = (d: Date | null) => d ? format(d, "dd MMM yyyy") : t("animalDetailScreen.overview.noValue")

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($headerRow)}>
        <Button text={t("animalDetailScreen.backButton")} preset="default" onPress={() => navigation.goBack()} />
        <Button text={t("animalDetailScreen.editButton")} preset="default" onPress={handleEdit} />
      </View>

      <Text preset="heading" text={animal.displayName} style={themed($heading)} />
      <View style={themed($metaRow)}>
        <View style={[$statusBadge, { backgroundColor: theme.colors.tint + "22" }]}>
          <Text text={animal.status} size="xxs" style={{ color: theme.colors.tint }} />
        </View>
        <Text text={`${animal.breed} | ${animal.sex}`} size="sm" style={themed($dimText)} />
      </View>

      {/* Tabs */}
      <View style={themed($tabRow)}>
        {(["overview", "health", "weight", "breeding"] as Tab[]).map((tab) => {
          const getTabIcon = () => {
            switch (tab) {
              case "overview": return "information-outline"
              case "health": return "medical-bag"
              case "weight": return "scale"
              case "breeding": return "heart"
              default: return "circle"
            }
          }
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={themed(activeTab === tab ? $tabActive : $tab)}
            >
              <MaterialCommunityIcons
                name={getTabIcon()}
                size={16}
                color={activeTab === tab ? "#FFFFFF" : theme.colors.text}
              />
              <Text
                preset="formLabel"
                text={t(`animalDetailScreen.tabs.${tab}`)}
                style={activeTab === tab ? themed($tabTextActive) : themed($tabText)}
                numberOfLines={1}
              />
            </Pressable>
          )
        })}
      </View>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <View style={themed($section)}>
          <PhotoGallery photosJson={animal.photos} />
          <DetailRow label={t("animalDetailScreen.overview.rfidTag")} value={animal.rfidTag} themed={themed} />
          <DetailRow label={t("animalDetailScreen.overview.visualTag")} value={animal.visualTag} themed={themed} />
          <DetailRow label={t("animalDetailScreen.overview.dateOfBirth")} value={formatDate(animal.dateOfBirth)} themed={themed} />
          <DetailRow label={t("animalDetailScreen.overview.registrationNumber")} value={animal.registrationNumber || t("animalDetailScreen.overview.noValue")} themed={themed} />

          {/* Lineage Summary (Read-only, edit in Breeding tab) */}
          {(animal.sireId || animal.damId || offspringStats.total > 0) && (
            <View style={themed($lineageSection)}>
              <Text preset="formLabel" text="Lineage" style={themed($sectionLabel)} />

              {animal.sireId && (
                <DetailRow
                  label="Sire"
                  value={sireName || "Loading..."}
                  themed={themed}
                />
              )}

              {animal.damId && (
                <DetailRow
                  label="Dam"
                  value={damName || "Loading..."}
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
              <Text preset="formLabel" text="Genetic Traits" style={themed($sectionLabel)} />
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

          {animal.notes ? <DetailRow label={t("animalDetailScreen.overview.notes")} value={animal.notes} themed={themed} /> : null}

          <View style={themed($tagsSection)}>
            <View style={themed($tagsSectionHeader)}>
              <Text text="Tags" preset="formLabel" style={themed($tagsLabel)} />
              {!isEditingTags && (
                <Pressable onPress={() => setIsEditingTags(true)} style={themed($editTagsButton)}>
                  <MaterialCommunityIcons name="pencil" size={16} color={theme.colors.tint} />
                  <Text text="Edit" size="xs" style={{ color: theme.colors.tint, marginLeft: 4 }} />
                </Pressable>
              )}
            </View>
            {isEditingTags ? (
              <>
                <TagInput
                  tags={tags}
                  onTagsChange={handleTagsChange}
                  placeholder="Add tags..."
                />
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

      {activeTab === "health" && (
        <View style={themed($section)}>
          {/* Vaccinations Section */}
          <Text preset="subheading" text="Vaccination Schedule" style={themed($sectionTitle)} />
          {vaccinations.length === 0 ? (
            <View style={themed($emptyState)}>
              <MaterialCommunityIcons name="needle" size={48} color={theme.colors.palette.neutral300} />
              <Text text="No vaccinations scheduled" style={themed($emptyText)} />
              <Text text="Vaccinations are automatically scheduled based on age and active schedules" size="xs" style={themed($dimText)} />
            </View>
          ) : (
            <>
            {vaccinations.map((v) => {
              const getUrgencyColor = () => {
                if (v.urgencyLevel === "critical" || v.urgencyLevel === "overdue") return theme.colors.error
                if (v.urgencyLevel === "soon") return theme.colors.palette.accent500
                return theme.colors.textDim
              }

              const getStatusBadgeColor = () => {
                if (v.status === "administered") return theme.colors.palette.primary100
                if (v.status === "skipped") return theme.colors.palette.neutral200
                return theme.colors.palette.accent100
              }

              return (
                <View key={v.id} style={[themed($vaccinationCard), { borderLeftColor: getUrgencyColor() }]}>
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
                    <View style={[themed($vaccinationBadge), { backgroundColor: getStatusBadgeColor() }]}>
                      <Text text={v.status} size="xxs" style={themed($vaccinationBadgeText)} />
                    </View>
                  </View>

                  {v.schedule?.protocol && (
                    <Text text={v.schedule.protocol.productName} size="sm" style={themed($dimText)} />
                  )}

                  <View style={themed($vaccinationDetails)}>
                    <View style={themed($vaccinationDetailRow)}>
                      <MaterialCommunityIcons name="calendar" size={14} color={theme.colors.textDim} />
                      <Text text={`Due: ${formatDate(v.dueDate)}`} size="xs" style={themed($vaccinationDetailText)} />
                    </View>

                    {v.status === "pending" && v.daysUntilDue !== undefined && (
                      <View style={themed($vaccinationDetailRow)}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={getUrgencyColor()} />
                        <Text
                          text={v.daysUntilDue < 0 ? `${Math.abs(v.daysUntilDue)} days overdue` : `${v.daysUntilDue} days until due`}
                          size="xs"
                          style={[themed($vaccinationDetailText), { color: getUrgencyColor() }]}
                        />
                      </View>
                    )}

                    {v.administeredDate && (
                      <View style={themed($vaccinationDetailRow)}>
                        <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.palette.primary500} />
                        <Text text={`Administered: ${formatDate(v.administeredDate)}`} size="xs" style={themed($vaccinationDetailText)} />
                      </View>
                    )}

                    <View style={themed($vaccinationDetailRow)}>
                      <MaterialCommunityIcons name="needle" size={14} color={theme.colors.textDim} />
                      <Text text={`Dose ${v.doseNumber}${v.schedule?.boosterCount ? ` of ${v.schedule.boosterCount}` : ""}`} size="xs" style={themed($vaccinationDetailText)} />
                    </View>
                  </View>

                  {v.status === "pending" && (
                    <Button
                      text="Administer Vaccination"
                      preset="filled"
                      style={themed($administerButton)}
                      onPress={() => navigation.navigate("Main", {
                        screen: "Chute",
                        params: {
                          mode: "single",
                          animalId,
                          protocolId: v.schedule?.protocol?.id,
                          vaccinationId: v.id,
                        }
                      })}
                    />
                  )}
                </View>
              )
            })}
            </>
          )}

          {/* Health Records Section */}
          <Text preset="subheading" text="Health Records" style={[themed($sectionTitle), { marginTop: 16 }]} />
          {healthRecords.length === 0 ? (
            <Text text={t("animalDetailScreen.health.empty")} style={themed($dimText)} />
          ) : (
            healthRecords.map((r) => (
              <View key={r.id} style={themed($recordCard)}>
                <View style={themed($recordHeader)}>
                  <Text preset="bold" text={r.recordType} />
                  <Text size="xs" text={formatDate(r.recordDate)} style={themed($dimText)} />
                </View>
                <Text text={r.description} size="sm" />
                {r.productName ? <Text text={t("animalDetailScreen.health.product", { product: r.productName })} size="xs" style={themed($dimText)} /> : null}
                <PhotoGallery photosJson={r.photos} />
                {r.createdByName ? (
                  <Text
                    text={t("animalDetailScreen.health.recordedBy", { name: r.createdByName.split('@')[0] })}
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
                  <Text preset="bold" text={t("animalDetailScreen.weight.weightValue", { weight: r.weightKg })} />
                  <Text size="xs" text={formatDate(r.recordDate)} style={themed($dimText)} />
                </View>
                {r.conditionScore ? <Text text={t("animalDetailScreen.weight.condition", { score: r.conditionScore })} size="sm" /> : null}
                <PhotoGallery photosJson={r.photos} />
                {r.createdByName ? (
                  <Text
                    text={t("animalDetailScreen.weight.recordedBy", { name: r.createdByName.split('@')[0] })}
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
                    <Text text={sireName || "Loading..."} preset="bold" style={{ textDecorationLine: "underline" }} />
                  </Pressable>
                ) : (
                  <Text text="Not set" style={themed($dimText)} />
                )}
              </View>
              <Pressable onPress={() => setShowSirePicker(true)} style={themed($editButton)}>
                <MaterialCommunityIcons name={animal.sireId ? "pencil" : "plus"} size={20} color={theme.colors.tint} />
              </Pressable>
            </View>

            {/* Dam */}
            <View style={themed($lineageRow)}>
              <MaterialCommunityIcons name="gender-female" size={18} color={theme.colors.palette.accent500} />
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
                    <Text text={damName || "Loading..."} preset="bold" style={{ textDecorationLine: "underline" }} />
                  </Pressable>
                ) : (
                  <Text text="Not set" style={themed($dimText)} />
                )}
              </View>
              <Pressable onPress={() => setShowDamPicker(true)} style={themed($editButton)}>
                <MaterialCommunityIcons name={animal.damId ? "pencil" : "plus"} size={20} color={theme.colors.tint} />
              </Pressable>
            </View>
          </View>

          {/* Offspring Section */}
          <View style={themed($offspringSection)}>
            <View style={themed($sectionHeader)}>
              <Text preset="subheading" text="Offspring" style={themed($sectionTitle)} />
              <Pressable onPress={() => setShowOffspringPicker(true)} style={themed($addButton)}>
                <MaterialCommunityIcons name="link" size={20} color={theme.colors.tint} />
                <Text text="Link Existing" size="sm" style={{ color: theme.colors.tint, marginLeft: 4 }} />
              </Pressable>
            </View>

            {offspringStats.total > 0 && (
              <>

              {/* Stats Card */}
              <View style={themed($offspringStatsCard)}>
                <View style={themed($statsRow)}>
                  <View style={themed($statItem)}>
                    <Text text={offspringStats.total.toString()} preset="heading" style={{ color: theme.colors.tint }} />
                    <Text text="Total" size="xs" style={themed($dimText)} />
                  </View>
                  <View style={themed($statItem)}>
                    <Text text={offspringStats.alive.toString()} preset="heading" style={{ color: theme.colors.palette.primary500 }} />
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
                      <Text text={`${child.breed} | ${child.sexLabel}`} size="xs" style={themed($dimText)} />
                    </View>
                    <View style={[$statusBadge, { backgroundColor: theme.colors.tint + "22" }]}>
                      <Text text={child.status} size="xxs" style={{ color: theme.colors.tint }} />
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textDim} />
                  </Pressable>
                ))}

                {offspring.length > 5 && (
                  <Text text={`+ ${offspring.length - 5} more offspring`} size="sm" style={themed($dimText)} />
                )}
              </View>
            </>
            )}

            {offspringStats.total === 0 && (
              <View style={themed($helpText)}>
                <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.textDim} />
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
                <Text text={t("animalDetailScreen.breeding.bred", { date: formatDate(r.breedingDate) })} size="sm" />
                {r.expectedCalvingDate ? (
                  <Text text={t("animalDetailScreen.breeding.expectedCalving", { date: formatDate(r.expectedCalvingDate) })} size="xs" style={themed($dimText)} />
                ) : null}
                <PhotoGallery photosJson={r.photos} />
                {r.createdByName ? (
                  <Text
                    text={t("animalDetailScreen.breeding.recordedBy", { name: r.createdByName.split('@')[0] })}
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

// Simple detail row component
function DetailRow({ label, value, themed }: { label: string; value: string; themed: (style: ThemedStyle<any>) => any }) {
  return (
    <View style={themed($detailRow)}>
      <Text text={label} size="sm" style={themed($detailLabel)} />
      <Text text={value} size="sm" />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingBottom: spacing.lg,
})

const $centered: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
})

const $headerRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: spacing.xs,
  marginBottom: spacing.xs,
  gap: spacing.xs,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $metaRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $statusBadge: ViewStyle = {
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 2,
}

const $tabRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xxs,
  marginBottom: spacing.sm,
  flexWrap: "nowrap",
})

const $tab: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  minWidth: 50,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 6,
  paddingVertical: spacing.xxs,
  paddingHorizontal: 2,
  alignItems: "center",
  justifyContent: "center",
  gap: 1,
})

const $tabActive: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  minWidth: 50,
  backgroundColor: colors.tint,
  borderRadius: 6,
  paddingVertical: spacing.xxs,
  paddingHorizontal: 2,
  alignItems: "center",
  justifyContent: "center",
  gap: 1,
})

const $tabText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 9,
  textAlign: "center",
})

const $tabTextActive: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontSize: 9,
  fontWeight: "600",
  textAlign: "center",
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xs,
})

const $detailRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  paddingVertical: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $detailLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $recordCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.xs,
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

const $deleteButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
})

const $deleteText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const $createdByText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xxs,
  fontStyle: "italic",
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.xxl,
})

const $emptyText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  marginBottom: spacing.xs,
})

const $vaccinationCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.sm,
  marginBottom: spacing.sm,
  borderLeftWidth: 3,
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

const $tagsSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.md,
})

const $tagsSectionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.xs,
})

const $tagsLabel: ThemedStyle<TextStyle> = () => ({
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
  borderRadius: 6,
  borderWidth: 0.5,
  borderColor: colors.palette.primary300,
})

const $tagChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary700,
  fontWeight: "600",
})

const $saveTagsButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  alignSelf: "flex-start",
})

const $lineageSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.md,
  paddingTop: spacing.md,
  borderTopWidth: 1,
  borderTopColor: colors.separator,
  gap: spacing.xs,
})

const $lineageRow: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.sm,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.border,
})

const $editButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $sectionLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $traitsSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.md,
  paddingTop: spacing.md,
  borderTopWidth: 1,
  borderTopColor: colors.separator,
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
  backgroundColor: colors.palette.neutral100,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 6,
  borderWidth: 0.5,
  borderColor: colors.border,
})

const $offspringStatsCard: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: colors.border,
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
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.border,
  gap: spacing.sm,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.sm,
})

