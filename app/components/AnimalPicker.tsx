import { FC, useState, useMemo } from "react"
import { View, FlatList, Pressable, ViewStyle, TextStyle, Modal } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Text, TextField, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useAnimals } from "@/hooks/useAnimals"
import { Animal, AnimalSex } from "@/db/models/Animal"

interface AnimalPickerProps {
  visible: boolean
  onClose: () => void
  onSelect: (animal: Animal | null) => void
  currentAnimalId?: string // Exclude this animal from the list
  filterSex?: AnimalSex | AnimalSex[] // Filter by sex
  title?: string
  allowClear?: boolean
}

export const AnimalPicker: FC<AnimalPickerProps> = ({
  visible,
  onClose,
  onSelect,
  currentAnimalId,
  filterSex,
  title = "Select Animal",
  allowClear = true,
}) => {
  const { themed, theme: { colors } } = useAppTheme()
  const { animals } = useAnimals()
  const [search, setSearch] = useState("")

  // Filter animals
  const filteredAnimals = useMemo(() => {
    let filtered = animals.filter((a) => a.id !== currentAnimalId && a.status === "active")

    // Filter by sex if provided
    if (filterSex) {
      const sexes = Array.isArray(filterSex) ? filterSex : [filterSex]
      filtered = filtered.filter((a) => sexes.includes(a.sex))
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter((a) =>
        a.visualTag.toLowerCase().includes(q) ||
        a.rfidTag.toLowerCase().includes(q) ||
        (a.name && a.name.toLowerCase().includes(q)) ||
        a.breed.toLowerCase().includes(q)
      )
    }

    return filtered.sort((a, b) => a.displayName.localeCompare(b.displayName))
  }, [animals, currentAnimalId, filterSex, search])

  const handleSelect = (animal: Animal) => {
    onSelect(animal)
    setSearch("")
    onClose()
  }

  const handleClear = () => {
    onSelect(null)
    setSearch("")
    onClose()
  }

  const renderAnimal = ({ item }: { item: Animal }) => (
    <Pressable
      style={themed($animalItem)}
      onPress={() => handleSelect(item)}
    >
      <View style={themed($animalInfo)}>
        <Text text={item.displayName} preset="bold" />
        <Text
          text={`${item.breed} | ${item.sexLabel}`}
          size="xs"
          style={themed($dimText)}
        />
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textDim} />
    </Pressable>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={themed($container)}>
        <View style={themed($header)}>
          <Text text={title} preset="heading" />
          <Pressable onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder="Search by tag, name, or breed..."
          LeftAccessory={() => (
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textDim} />
          )}
          containerStyle={themed($searchContainer)}
        />

        {allowClear && (
          <Button
            text="Clear Selection"
            preset="default"
            onPress={handleClear}
            style={themed($clearButton)}
          />
        )}

        <FlatList
          data={filteredAnimals}
          renderItem={renderAnimal}
          keyExtractor={(item) => item.id}
          contentContainerStyle={themed($listContent)}
          ListEmptyComponent={
            <View style={themed($emptyState)}>
              <MaterialCommunityIcons name="cow" size={48} color={colors.palette.neutral300} />
              <Text text="No animals found" style={themed($dimText)} />
            </View>
          }
        />
      </View>
    </Modal>
  )
}

// ────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: spacing.md,
  paddingTop: spacing.xl,
})

const $searchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  marginBottom: spacing.sm,
})

const $clearButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginHorizontal: spacing.md,
  marginBottom: spacing.sm,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})

const $animalItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: spacing.md,
  marginBottom: spacing.xs,
  backgroundColor: colors.background,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.border,
})

const $animalInfo: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  gap: spacing.xxs,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.xxl,
  gap: spacing.sm,
})
