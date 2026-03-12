import React, { useState, useEffect } from "react"
import { View, ViewStyle, TextStyle, ScrollView, Pressable, FlatList, Alert } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Screen, Text, TextField, Button, Icon } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { AppStackScreenProps } from "@/navigators"
import { usePastures, usePastureActions } from "@/hooks/usePastures"
import { database } from "@/db"
import { Animal } from "@/db/models"
import { Q } from "@nozbe/watermelondb"
import { useDatabase } from "@/context/DatabaseContext"

interface MovementFormScreenProps extends AppStackScreenProps<"MovementForm"> {}

type MovementType = "move_in" | "move_out"

export function MovementFormScreen({ navigation, route }: MovementFormScreenProps) {
  const initialPastureId = route.params?.pastureId
  const initialType = route.params?.movementType || "move_in"

  const { themed, theme: { colors } } = useAppTheme()
  const { pastures } = usePastures()
  const { moveAnimalsIn, moveAnimalsOut } = usePastureActions()
  const { currentOrg } = useDatabase()

  const [movementType, setMovementType] = useState<MovementType>(initialType)
  const [selectedPastureId, setSelectedPastureId] = useState<string>(initialPastureId || "")
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([])
  const [selectedAnimals, setSelectedAnimals] = useState<Animal[]>([])
  const [availableAnimals, setAvailableAnimals] = useState<Animal[]>([])
  const [showAnimalPicker, setShowAnimalPicker] = useState(false)
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Load available animals based on movement type
  useEffect(() => {
    if (!currentOrg) return

    const loadAnimals = async () => {
      if (movementType === "move_in") {
        // For move in: show animals not currently in any pasture
        const animals = await database
          .get<Animal>("animals")
          .query(
            Q.where("organization_id", currentOrg.id),
            Q.where("is_deleted", false),
            Q.where("current_pasture_id", null),
            Q.sortBy("visual_tag", Q.asc),
          )
          .fetch()
        setAvailableAnimals(animals)
      } else if (selectedPastureId) {
        // For move out: show animals currently in the selected pasture
        const animals = await database
          .get<Animal>("animals")
          .query(
            Q.where("organization_id", currentOrg.id),
            Q.where("is_deleted", false),
            Q.where("current_pasture_id", selectedPastureId),
            Q.sortBy("visual_tag", Q.asc),
          )
          .fetch()
        setAvailableAnimals(animals)
      }
    }

    loadAnimals()
  }, [currentOrg, movementType, selectedPastureId])

  // Load selected animals data
  useEffect(() => {
    const loadSelectedAnimals = async () => {
      if (selectedAnimalIds.length === 0) {
        setSelectedAnimals([])
        return
      }

      const animals = await database
        .get<Animal>("animals")
        .query(Q.where("id", Q.oneOf(selectedAnimalIds)))
        .fetch()
      setSelectedAnimals(animals)
    }

    loadSelectedAnimals()
  }, [selectedAnimalIds])

  const handleToggleMovementType = (type: MovementType) => {
    setMovementType(type)
    setSelectedAnimalIds([])
    setSelectedAnimals([])
  }

  const handleToggleAnimal = (animalId: string) => {
    setSelectedAnimalIds((prev) =>
      prev.includes(animalId) ? prev.filter((id) => id !== animalId) : [...prev, animalId],
    )
  }

  const handleRemoveAnimal = (animalId: string) => {
    setSelectedAnimalIds((prev) => prev.filter((id) => id !== animalId))
  }

  const handleClearAll = () => {
    setSelectedAnimalIds([])
  }

  const handleScanRFID = () => {
    // TODO: Implement RFID scanning
    Alert.alert("RFID Scanner", "RFID scanning will be implemented in a future update")
  }

  const handleSubmit = async () => {
    if (!selectedPastureId) {
      Alert.alert("Error", "Please select a pasture")
      return
    }

    if (selectedAnimalIds.length === 0) {
      Alert.alert("Error", "Please select at least one animal")
      return
    }

    setIsSaving(true)
    try {
      if (movementType === "move_in") {
        await moveAnimalsIn(selectedPastureId, selectedAnimalIds, notes || undefined)
      } else {
        await moveAnimalsOut(selectedPastureId, selectedAnimalIds, notes || undefined)
      }
      navigation.goBack()
    } catch (error) {
      console.error("Failed to move animals:", error)
      Alert.alert("Error", "Failed to move animals. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const selectedPasture = pastures.find((p) => p.id === selectedPastureId)

  const renderAvailableAnimal = ({ item: animal }: { item: Animal }) => {
    const isSelected = selectedAnimalIds.includes(animal.id)
    return (
      <Pressable
        onPress={() => handleToggleAnimal(animal.id)}
        style={[themed($animalPickerRow), isSelected && themed($animalPickerRowSelected)]}
      >
        <View style={themed($animalPickerInfo)}>
          <Text style={themed($animalPickerTag)}>{animal.visualTag || animal.rfidTag}</Text>
          <Text style={themed($animalPickerDetails)}>
            {animal.breed} • {animal.sexLabel}
          </Text>
        </View>
        {isSelected && <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />}
      </Pressable>
    )
  }

  const renderSelectedAnimal = ({ item: animal }: { item: Animal }) => (
    <View style={themed($selectedAnimalRow)}>
      <View style={themed($selectedAnimalInfo)}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <MaterialCommunityIcons name="check" size={14} color="#10B981" />
          <Text style={themed($selectedAnimalTag)}>{animal.visualTag || animal.rfidTag}</Text>
        </View>
        <Text style={themed($selectedAnimalDetails)}>
          {animal.breed} • {animal.sexLabel}
        </Text>
      </View>
      <Pressable onPress={() => handleRemoveAnimal(animal.id)} style={themed($removeButton)}>
        <Text style={themed($removeButtonText)}>×</Text>
      </Pressable>
    </View>
  )

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <Icon icon="back" size={24} />
        </Pressable>
        <Text preset="heading" text="Move Animals" style={themed($headerTitle)} />
      </View>

      <ScrollView style={themed($form)} showsVerticalScrollIndicator={false}>
        {/* Movement Type */}
        <View style={themed($field)}>
          <Text style={themed($label)}>Movement Type</Text>
          <View style={themed($toggleRow)}>
            <Pressable
              onPress={() => handleToggleMovementType("move_in")}
              style={[themed($toggleButton), movementType === "move_in" && themed($toggleButtonActive)]}
            >
              <Text
                style={[themed($toggleButtonText), movementType === "move_in" && themed($toggleButtonTextActive)]}
              >
                ⬇ Move In
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleToggleMovementType("move_out")}
              style={[themed($toggleButton), movementType === "move_out" && themed($toggleButtonActive)]}
            >
              <Text
                style={[themed($toggleButtonText), movementType === "move_out" && themed($toggleButtonTextActive)]}
              >
                ⬆ Move Out
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Pasture Selector */}
        <View style={themed($field)}>
          <Text style={themed($label)}>Pasture</Text>
          <View style={themed($pickerContainer)}>
            {pastures.map((pasture) => {
              const isSelected = selectedPastureId === pasture.id
              return (
                <Pressable
                  key={pasture.id}
                  onPress={() => setSelectedPastureId(pasture.id)}
                  style={[themed($pastureOption), isSelected && themed($pastureOptionSelected)]}
                >
                  <Text style={[themed($pastureOptionText), isSelected && themed($pastureOptionTextSelected)]}>
                    {pasture.name} ({pasture.code})
                  </Text>
                  {isSelected && <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />}
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Selected Animals */}
        <View style={themed($field)}>
          <Text style={themed($label)}>
            Animals ({selectedAnimalIds.length} selected)
          </Text>

          <View style={themed($actionButtons)}>
            <Button
              text="📷 Scan RFID"
              preset="filled"
              onPress={handleScanRFID}
              style={themed($actionButton)}
            />
            <Button
              text="+ Select Manually"
              preset="default"
              onPress={() => setShowAnimalPicker(true)}
              style={themed($actionButton)}
            />
          </View>

          {selectedAnimals.length > 0 && (
            <View style={themed($selectedAnimalsContainer)}>
              <FlatList
                data={selectedAnimals}
                renderItem={renderSelectedAnimal}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
              <Pressable onPress={handleClearAll} style={themed($clearAllButton)}>
                <Text style={themed($clearAllButtonText)}>Clear All</Text>
              </Pressable>
            </View>
          )}

          {selectedAnimalIds.length === 0 && (
            <View style={themed($emptySelection)}>
              <Text style={themed($emptySelectionText)}>No animals selected</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        <TextField
          label="Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes about this movement"
          multiline
          numberOfLines={3}
          containerStyle={themed($field)}
        />

        {/* Submit Button */}
        <View style={themed($buttonRow)}>
          <Button
            text="Cancel"
            preset="default"
            onPress={() => navigation.goBack()}
            style={themed($cancelButton)}
          />
          <Button
            text={`Move ${selectedAnimalIds.length} Animal${selectedAnimalIds.length !== 1 ? "s" : ""} ${
              movementType === "move_in" ? "In" : "Out"
            }`}
            preset="filled"
            onPress={handleSubmit}
            disabled={isSaving || selectedAnimalIds.length === 0 || !selectedPastureId}
            style={themed($saveButton)}
          />
        </View>
      </ScrollView>

      {/* Animal Picker Modal */}
      {showAnimalPicker && (
        <View style={themed($modalOverlay)}>
          <View style={themed($modalContent)}>
            <View style={themed($modalHeader)}>
              <Text preset="heading" text="Select Animals" />
              <Pressable onPress={() => setShowAnimalPicker(false)} style={themed($modalClose)}>
                <Text style={themed($modalCloseText)}>×</Text>
              </Pressable>
            </View>
            <FlatList
              data={availableAnimals}
              renderItem={renderAvailableAnimal}
              keyExtractor={(item) => item.id}
              style={themed($animalPickerList)}
            />
            <Button
              text={`Done (${selectedAnimalIds.length} selected)`}
              preset="filled"
              onPress={() => setShowAnimalPicker(false)}
              style={themed($modalDoneButton)}
            />
          </View>
        </View>
      )}
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: spacing.md,
  marginBottom: spacing.sm,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
  marginLeft: -spacing.xs,
})

const $headerTitle: ThemedStyle<TextStyle> = () => ({
  flex: 1,
  marginLeft: 0,
})

const $form: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $field: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $label: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.xs,
})

const $toggleRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $toggleButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: 8,
  borderWidth: 1.5,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
  alignItems: "center",
})

const $toggleButtonActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $toggleButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.palette.neutral600,
})

const $toggleButtonTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
})

const $pickerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xs,
})

const $pastureOption: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: spacing.sm,
  borderRadius: 8,
  borderWidth: 1.5,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
})

const $pastureOptionSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $pastureOptionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "500",
  color: colors.palette.neutral600,
})

const $pastureOptionTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
  fontWeight: "600",
})

const $pastureOptionCheck: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  color: colors.palette.primary600,
})

const $actionButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginBottom: spacing.sm,
})

const $actionButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $selectedAnimalsContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.sm,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $selectedAnimalRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.xs,
})

const $selectedAnimalInfo: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $selectedAnimalTag: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.palette.success600,
})

const $selectedAnimalDetails: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.neutral600,
  marginTop: 2,
})

const $removeButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: colors.palette.angry500,
  justifyContent: "center",
  alignItems: "center",
  marginLeft: spacing.xs,
})

const $removeButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  color: "#FFF",
  fontWeight: "700",
  marginTop: -2,
})

const $clearAllButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  alignItems: "center",
  paddingVertical: spacing.xs,
})

const $clearAllButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  fontWeight: "600",
  color: colors.palette.angry500,
})

const $emptySelection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
  alignItems: "center",
})

const $emptySelectionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.palette.neutral600,
})

const $buttonRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.md,
  marginTop: spacing.lg,
  marginBottom: spacing.xxxl,
})

const $cancelButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $saveButton: ThemedStyle<ViewStyle> = () => ({
  flex: 2,
})

// Modal styles
const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
})

const $modalContent: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderRadius: 12,
  width: "100%",
  maxHeight: "80%",
  padding: 20,
})

const $modalHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.md,
})

const $modalClose: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.palette.neutral200,
  justifyContent: "center",
  alignItems: "center",
})

const $modalCloseText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 24,
  color: colors.palette.neutral700,
  fontWeight: "700",
  marginTop: -2,
})

const $animalPickerList: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $animalPickerRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: spacing.sm,
  borderRadius: 8,
  borderWidth: 1.5,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
  marginBottom: spacing.xs,
})

const $animalPickerRowSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $animalPickerInfo: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $animalPickerTag: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.text,
})

const $animalPickerDetails: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.neutral600,
  marginTop: 2,
})

const $animalPickerCheck: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  color: colors.palette.primary600,
  fontWeight: "700",
})

const $modalDoneButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})
