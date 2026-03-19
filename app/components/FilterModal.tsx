import { FC, useState, useCallback, useMemo } from "react"
import { View, ViewStyle, TextStyle, Modal, ScrollView, Pressable } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { Text, Button, TextField } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Animal, BREEDS_BY_SPECIES } from "@/db/models/Animal"

export type SortField = "visualTag" | "dateOfBirth" | "breed" | "sex" | "status"
export type SortDirection = "asc" | "desc"

export interface FilterState {
  breeds: string[]
  sexes: string[]
  statuses: string[]
  ageFrom: number | null
  ageTo: number | null
  tagSearch: string
  parentAnimalId: string | null
  sortBy: SortField
  sortDirection: SortDirection
}

export const DEFAULT_FILTER_STATE: FilterState = {
  breeds: [],
  sexes: [],
  statuses: [],
  ageFrom: null,
  ageTo: null,
  tagSearch: "",
  parentAnimalId: null,
  sortBy: "visualTag",
  sortDirection: "asc",
}

interface FilterModalProps {
  visible: boolean
  onClose: () => void
  onApply: (filters: FilterState) => void
  initialFilters: FilterState
  animals: Animal[]
  currentSpecies?: string
}

export const FilterModal: FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
  animals,
  currentSpecies = "cattle",
}) => {
  const { t } = useTranslation()
  const { themed, theme } = useAppTheme()

  const [filters, setFilters] = useState<FilterState>(initialFilters)

  const availableBreeds = useMemo(() => {
    return BREEDS_BY_SPECIES[currentSpecies] || BREEDS_BY_SPECIES.cattle
  }, [currentSpecies])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.breeds.length > 0 ||
      filters.sexes.length > 0 ||
      filters.statuses.length > 0 ||
      filters.ageFrom !== null ||
      filters.ageTo !== null ||
      filters.tagSearch !== "" ||
      filters.parentAnimalId !== null ||
      filters.sortBy !== "visualTag" ||
      filters.sortDirection !== "asc"
    )
  }, [filters])

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTER_STATE)
  }, [])

  const handleApply = useCallback(() => {
    onApply(filters)
    onClose()
  }, [filters, onApply, onClose])

  const toggleBreed = useCallback((breed: string) => {
    setFilters((prev) => ({
      ...prev,
      breeds: prev.breeds.includes(breed)
        ? prev.breeds.filter((b) => b !== breed)
        : [...prev.breeds, breed],
    }))
  }, [])

  const toggleSex = useCallback((sex: string) => {
    setFilters((prev) => ({
      ...prev,
      sexes: prev.sexes.includes(sex)
        ? prev.sexes.filter((s) => s !== sex)
        : [...prev.sexes, sex],
    }))
  }, [])

  const toggleStatus = useCallback((status: string) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }))
  }, [])

  const toggleSortDirection = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      sortDirection: prev.sortDirection === "asc" ? "desc" : "asc",
    }))
  }, [])

  const SEXES = ["male", "female", "castrated", "unknown"]
  const STATUSES = ["active", "sold", "deceased", "transferred"]
  const SORT_OPTIONS: { value: SortField; label: string; icon: string }[] = [
    { value: "visualTag", label: "Tag Number", icon: "tag" },
    { value: "dateOfBirth", label: "Age", icon: "calendar" },
    { value: "breed", label: "Breed", icon: "sheep" },
    { value: "sex", label: "Sex", icon: "gender-male-female" },
    { value: "status", label: "Status", icon: "information" },
  ]

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={themed($modalOverlay)}>
        <View style={themed($modalContainer)}>
          {/* Header */}
          <View style={themed($modalHeader)}>
            <View style={themed($headerLeft)}>
              <MaterialCommunityIcons name="filter-variant" size={24} color={theme.colors.tint} />
              <Text preset="heading" text="Filter & Sort" size="lg" />
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView style={themed($scrollView)} showsVerticalScrollIndicator={false}>
            {/* Sort Section */}
            <View style={themed($section)}>
              <Text preset="bold" text="Sort By" size="sm" style={themed($sectionTitle)} />
              <View style={themed($sortContainer)}>
                {SORT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setFilters((prev) => ({ ...prev, sortBy: option.value }))}
                    style={[
                      themed($chip),
                      filters.sortBy === option.value && themed($chipActive),
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={option.icon as any}
                      size={16}
                      color={
                        filters.sortBy === option.value
                          ? theme.colors.palette.neutral100
                          : theme.colors.text
                      }
                    />
                    <Text
                      text={option.label}
                      size="xs"
                      style={[
                        themed($chipText),
                        filters.sortBy === option.value && themed($chipTextActive),
                      ]}
                    />
                  </Pressable>
                ))}
              </View>

              {/* Sort Direction Toggle */}
              <Pressable onPress={toggleSortDirection} style={themed($sortDirectionButton)}>
                <MaterialCommunityIcons
                  name={filters.sortDirection === "asc" ? "sort-ascending" : "sort-descending"}
                  size={20}
                  color={theme.colors.tint}
                />
                <Text
                  text={filters.sortDirection === "asc" ? "Ascending" : "Descending"}
                  size="sm"
                  style={themed($sortDirectionText)}
                />
              </Pressable>
            </View>

            {/* Breed Filter */}
            <View style={themed($section)}>
              <Text preset="bold" text="Breed" size="sm" style={themed($sectionTitle)} />
              <View style={themed($chipContainer)}>
                {availableBreeds.map((breed) => (
                  <Pressable
                    key={breed}
                    onPress={() => toggleBreed(breed)}
                    style={[
                      themed($chip),
                      filters.breeds.includes(breed) && themed($chipActive),
                    ]}
                  >
                    <Text
                      text={breed}
                      size="xs"
                      style={[
                        themed($chipText),
                        filters.breeds.includes(breed) && themed($chipTextActive),
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Sex Filter */}
            <View style={themed($section)}>
              <Text preset="bold" text="Sex" size="sm" style={themed($sectionTitle)} />
              <View style={themed($chipContainer)}>
                {SEXES.map((sex) => (
                  <Pressable
                    key={sex}
                    onPress={() => toggleSex(sex)}
                    style={[
                      themed($chip),
                      filters.sexes.includes(sex) && themed($chipActive),
                    ]}
                  >
                    <Text
                      text={sex.charAt(0).toUpperCase() + sex.slice(1)}
                      size="xs"
                      style={[
                        themed($chipText),
                        filters.sexes.includes(sex) && themed($chipTextActive),
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View style={themed($section)}>
              <Text preset="bold" text="Status" size="sm" style={themed($sectionTitle)} />
              <View style={themed($chipContainer)}>
                {STATUSES.map((status) => (
                  <Pressable
                    key={status}
                    onPress={() => toggleStatus(status)}
                    style={[
                      themed($chip),
                      filters.statuses.includes(status) && themed($chipActive),
                    ]}
                  >
                    <Text
                      text={status.charAt(0).toUpperCase() + status.slice(1)}
                      size="xs"
                      style={[
                        themed($chipText),
                        filters.statuses.includes(status) && themed($chipTextActive),
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Age Range Filter */}
            <View style={themed($section)}>
              <Text preset="bold" text="Age Range (months)" size="sm" style={themed($sectionTitle)} />
              <View style={themed($ageRangeContainer)}>
                <TextField
                  value={filters.ageFrom?.toString() || ""}
                  onChangeText={(text) =>
                    setFilters((prev) => ({
                      ...prev,
                      ageFrom: text ? parseInt(text, 10) || null : null,
                    }))
                  }
                  placeholder="From"
                  keyboardType="number-pad"
                  containerStyle={themed($ageField)}
                />
                <Text text="-" size="md" style={themed($ageRangeSeparator)} />
                <TextField
                  value={filters.ageTo?.toString() || ""}
                  onChangeText={(text) =>
                    setFilters((prev) => ({
                      ...prev,
                      ageTo: text ? parseInt(text, 10) || null : null,
                    }))
                  }
                  placeholder="To"
                  keyboardType="number-pad"
                  containerStyle={themed($ageField)}
                />
              </View>
            </View>

            {/* Tag Search */}
            <View style={themed($section)}>
              <Text preset="bold" text="Search Tags" size="sm" style={themed($sectionTitle)} />
              <TextField
                value={filters.tagSearch}
                onChangeText={(text) =>
                  setFilters((prev) => ({ ...prev, tagSearch: text }))
                }
                placeholder="Search in tags..."
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Parent Filter - TODO: Add picker */}
            {/* <View style={themed($section)}>
              <Text preset="bold" text="Filter by Parent" size="sm" style={themed($sectionTitle)} />
              <Text text="Show only children of a specific animal" size="xs" style={themed($helpText)} />
            </View> */}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={themed($modalFooter)}>
            <Button
              text={hasActiveFilters ? "Reset" : "Close"}
              preset="default"
              onPress={hasActiveFilters ? handleReset : onClose}
              style={themed($footerButton)}
            />
            <Button
              text={`Apply${hasActiveFilters ? ` (${countActiveFilters(filters)})` : ""}`}
              preset="filled"
              onPress={handleApply}
              style={themed($footerButton)}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

function countActiveFilters(filters: FilterState): number {
  let count = 0
  if (filters.breeds.length > 0) count++
  if (filters.sexes.length > 0) count++
  if (filters.statuses.length > 0) count++
  if (filters.ageFrom !== null || filters.ageTo !== null) count++
  if (filters.tagSearch !== "") count++
  if (filters.parentAnimalId !== null) count++
  if (filters.sortBy !== "visualTag" || filters.sortDirection !== "asc") count++
  return count
}

// ────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────

const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "flex-end",
})

const $modalContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  maxHeight: "90%",
  paddingTop: spacing.md,
})

const $modalHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  marginBottom: spacing.md,
})

const $headerLeft: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $scrollView: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  maxHeight: 500,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $chipContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $sortContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $chip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 20,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
})

const $chipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  borderColor: colors.tint,
})

const $chipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $chipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "600",
})

const $sortDirectionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  alignSelf: "flex-start",
})

const $sortDirectionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $ageRangeContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $ageField: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $ageRangeSeparator: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $helpText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontStyle: "italic",
})

const $modalFooter: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  borderTopWidth: 1,
  borderTopColor: colors.border,
})

const $footerButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})
