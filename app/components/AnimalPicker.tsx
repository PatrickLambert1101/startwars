import { FC, useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"

import { Text, TextField, Button } from "@/components"
import { Animal, AnimalSex } from "@/db/models/Animal"
import { useAnimals } from "@/hooks/useAnimals"
import { useRfidReader } from "@/hooks/useRfidReader"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { registerScanCallback } from "@/screens/TagScannerScreen/TagScannerScreen"
import { bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface AnimalPickerProps {
  visible: boolean
  onClose: () => void
  onSelect: (animal: Animal | null) => void
  currentAnimalId?: string // Exclude this animal from the list
  filterSex?: AnimalSex | AnimalSex[] // Filter by sex
  title?: string
  allowClear?: boolean
}

export const AnimalPicker: FC<AnimalPickerProps> = (props) => {
  // Only mount RFID listeners while the picker is open. Several screens keep
  // dormant pickers rendered, while the handheld reader is shared hardware.
  if (!props.visible) return null

  return <VisibleAnimalPicker {...props} />
}

const VisibleAnimalPicker: FC<AnimalPickerProps> = ({
  visible,
  onClose,
  onSelect,
  currentAnimalId,
  filterSex,
  title = "Select Animal",
  allowClear = true,
}) => {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const { animals } = useAnimals()
  const [search, setSearch] = useState("")
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false)
  const navigation = useNavigation<AppStackScreenProps<"TagScanner">["navigation"]>()
  const {
    hasRfidHardware,
    isInitialized: isRfidInitialized,
    isScanning: isRfidScanning,
    scannedTag,
    initialize: initializeRfid,
    clearScannedTag,
  } = useRfidReader()

  useEffect(() => {
    if (hasRfidHardware && !isRfidInitialized) initializeRfid()
  }, [hasRfidHardware, initializeRfid, isRfidInitialized])

  useEffect(() => {
    if (isRfidScanning) setSearch("")
  }, [isRfidScanning])

  // Re-show the picker when the camera scanner is cancelled without a result.
  useEffect(() => {
    return navigation.addListener("focus", () => setCameraScannerOpen(false))
  }, [navigation])

  const handleCameraScan = useCallback(() => {
    setCameraScannerOpen(true)
    const callbackId = registerScanCallback((tagNumber) => {
      setSearch(tagNumber)
      setCameraScannerOpen(false)
    })

    // Give the native Modal a frame to close before presenting the scanner.
    requestAnimationFrame(() => navigation.navigate("TagScanner", { callbackId }))
  }, [navigation])

  // Apply the picker's eligibility rules before search. RFID scans use this
  // same set, so a trigger pull cannot bypass sex/status/current-animal rules.
  const selectableAnimals = useMemo(() => {
    let filtered = animals.filter((a) => a.id !== currentAnimalId && a.status === "active")

    if (filterSex) {
      const sexes = Array.isArray(filterSex) ? filterSex : [filterSex]
      filtered = filtered.filter((a) => sexes.includes(a.sex))
    }

    return filtered
  }, [animals, currentAnimalId, filterSex])

  const filteredAnimals = useMemo(() => {
    let filtered = selectableAnimals

    if (search) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.visualTag?.toLowerCase().includes(q) ||
          a.rfidTag?.toLowerCase().includes(q) ||
          (a.name && a.name.toLowerCase().includes(q)) ||
          a.breed?.toLowerCase().includes(q),
      )
    }

    return [...filtered].sort((a, b) => a.displayName.localeCompare(b.displayName))
  }, [search, selectableAnimals])

  const handleSelect = useCallback(
    (animal: Animal) => {
      onSelect(animal)
      setSearch("")
      onClose()
    },
    [onClose, onSelect],
  )

  // Hardware RFID is an exact identity scan, not a fuzzy search. Select the
  // matching cow immediately; only fall back to showing the EPC in search when
  // there is no eligible match for this picker.
  useEffect(() => {
    if (!scannedTag?.epc) return

    const epc = scannedTag.epc.trim().toLowerCase()
    if (!epc) {
      clearScannedTag()
      return
    }
    const matchingAnimal = selectableAnimals.find(
      (animal) => animal.rfidTag?.trim().toLowerCase() === epc,
    )

    clearScannedTag()
    if (matchingAnimal) {
      handleSelect(matchingAnimal)
    } else {
      setSearch(scannedTag.epc)
    }
  }, [clearScannedTag, handleSelect, scannedTag, selectableAnimals])

  const handleClear = () => {
    onSelect(null)
    setSearch("")
    onClose()
  }

  const renderAnimal = ({ item }: { item: Animal }) => {
    const tag = item.visualTag || item.rfidTag
    const secondaryTag = tag && tag !== item.displayName ? tag : ""
    return (
      <Pressable
        style={themed($animalItem)}
        onPress={() => handleSelect(item)}
        accessibilityRole="button"
        accessibilityLabel={[item.displayName, secondaryTag, item.breed, item.sexLabel]
          .filter(Boolean)
          .join(", ")}
      >
        <View style={themed($animalInfo)}>
          <Text text={item.displayName} preset="bold" />
          {secondaryTag ? <Text text={secondaryTag} size="sm" /> : null}
          <Text text={`${item.breed} | ${item.sexLabel}`} size="xs" style={themed($dimText)} />
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textDim} />
      </Pressable>
    )
  }

  return (
    <Modal
      visible={visible && !cameraScannerOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={themed($container)}>
        <View style={themed($header)}>
          <Text text={title} preset="heading" numberOfLines={2} style={themed($headerTitle)} />
          <Pressable
            onPress={onClose}
            style={themed($closeButton)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close animal picker"
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder="Search by tag, name, or breed..."
          LeftAccessory={({ style }) => (
            <View style={style as ViewStyle}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textDim} />
            </View>
          )}
          containerStyle={themed($searchContainer)}
        />

        {hasRfidHardware ? (
          <View style={themed($rfidScanBar)}>
            {isRfidScanning ? (
              <>
                <ActivityIndicator size="small" color={colors.tint} />
                <Text text="Scanning for RFID…" size="sm" style={themed($rfidScanText)} />
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="access-point" size={21} color={colors.tint} />
                <Text
                  text="Pull the trigger to scan an RFID"
                  size="sm"
                  style={themed($rfidScanText)}
                />
              </>
            )}
          </View>
        ) : (
          <Pressable
            onPress={handleCameraScan}
            style={themed($cameraScanButton)}
            accessibilityRole="button"
            accessibilityLabel="Scan cow with camera"
          >
            <MaterialCommunityIcons
              name="camera-outline"
              size={21}
              color={colors.palette.neutral100}
            />
            <Text text="Scan cow with camera" size="sm" style={themed($cameraScanButtonText)} />
          </Pressable>
        )}

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
  gap: spacing.sm,
  padding: spacing.md,
  paddingTop: spacing.xl,
})

const $headerTitle: ThemedStyle<TextStyle> = () => ({
  flex: 1,
  flexShrink: 1,
})

const $closeButton: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  flexShrink: 0,
  height: 40,
  justifyContent: "center",
  width: 40,
})

const $searchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  marginBottom: spacing.sm,
})

const $rfidScanBar: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  backgroundColor: colors.palette.primary100,
  borderColor: colors.tint,
  borderRadius: 10,
  borderWidth: 1,
  flexDirection: "row",
  gap: spacing.sm,
  justifyContent: "center",
  marginBottom: spacing.sm,
  marginHorizontal: spacing.md,
  minHeight: 48,
  paddingHorizontal: spacing.md,
})

const $rfidScanText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $cameraScanButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  backgroundColor: colors.palette.primary500,
  borderRadius: bentoRadii.button,
  flexDirection: "row",
  gap: spacing.xs,
  justifyContent: "center",
  marginBottom: spacing.sm,
  marginHorizontal: spacing.md,
  minHeight: 52,
  paddingHorizontal: spacing.md,
})

const $cameraScanButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "700",
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
