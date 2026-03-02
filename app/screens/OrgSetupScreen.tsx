import { FC, useCallback, useState } from "react"
import { Alert, Pressable, ScrollView, View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, TextField, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import { HerdTrackrLogo, PastureIcon } from "@/components/icons"
import type { LivestockType } from "@/db/models/Organization"

type LivestockOption = {
  type: LivestockType
  label: string
  emoji: string
  desc: string
}

const LIVESTOCK_OPTIONS: LivestockOption[] = [
  { type: "cattle", label: "Cattle", emoji: "🐄", desc: "Nguni, Bonsmara, Brahman, Angus..." },
  { type: "buffalo", label: "Buffalo", emoji: "🦬", desc: "Cape buffalo, water buffalo" },
  { type: "horses", label: "Horses", emoji: "🐴", desc: "Boerperd, Nooitgedachter, Thoroughbred..." },
  { type: "sheep", label: "Sheep", emoji: "🐑", desc: "Dorper, Merino, Damara, Dohne..." },
  { type: "goats", label: "Goats", emoji: "🐐", desc: "Boer, Angora, Kalahari Red, Savanna..." },
  { type: "game", label: "Game", emoji: "🦌", desc: "Springbok, Impala, Kudu, Eland..." },
  { type: "pigs", label: "Pigs", emoji: "🐷", desc: "Kolbroek, Windsnyer, Large White..." },
  { type: "poultry", label: "Poultry", emoji: "🐔", desc: "Boschveld, Potch Koekoek, Venda..." },
]

export const OrgSetupScreen: FC<AppStackScreenProps<"OrgSetup">> = ({ navigation }) => {
  const { themed, theme: { colors } } = useAppTheme()
  const { createOrganization } = useDatabase()
  const { user } = useAuth()

  const [step, setStep] = useState<1 | 2>(1)
  const [orgName, setOrgName] = useState("")
  const [location, setLocation] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<LivestockType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleType = useCallback((type: LivestockType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }, [])

  const handleNext = useCallback(() => {
    const name = orgName.trim()
    if (!name) {
      Alert.alert("Required", "Give your farm or ranch a name")
      return
    }
    setStep(2)
  }, [orgName])

  const handleCreate = useCallback(async () => {
    if (selectedTypes.length === 0) {
      Alert.alert("Select at least one", "Choose the types of animals you manage")
      return
    }

    setIsSubmitting(true)
    try {
      await createOrganization({
        name: orgName.trim(),
        livestockTypes: selectedTypes,
        location: location.trim() || undefined,
      })
      navigation.replace("Main", { screen: "Dashboard" })
    } catch {
      Alert.alert("Error", "Failed to create organization. Please try again.")
    }
    setIsSubmitting(false)
  }, [orgName, location, selectedTypes, createOrganization, navigation])

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top", "bottom"]}>
      {/* Header */}
      <View style={themed($hero)}>
        <HerdTrackrLogo size={80} color={colors.tint} accentColor={colors.tint} />
        <Text text="HerdTrackr" preset="heading" style={themed($appName)} />
        <Text text="Set up your operation" size="sm" style={themed($subtitle)} />
      </View>

      {/* Step indicator */}
      <View style={themed($stepRow)}>
        <View style={[themed($stepDot), step >= 1 && themed($stepDotActive)]} />
        <View style={themed($stepLine)} />
        <View style={[themed($stepDot), step >= 2 && themed($stepDotActive)]} />
      </View>

      {step === 1 ? (
        /* Step 1: Farm details */
        <View style={themed($card)}>
          <Text text="Your Farm" preset="bold" size="lg" />
          <Text
            text="Tell us about your operation. This creates a shared workspace for your team."
            size="sm"
            style={themed($cardDesc)}
          />

          <TextField
            label="Farm / Ranch Name *"
            value={orgName}
            onChangeText={setOrgName}
            placeholder="e.g. Sunrise Livestock, Bosveld Game Farm"
            autoFocus
          />

          <TextField
            label="Location (optional)"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Limpopo, Free State, KZN"
          />

          {user?.email ? (
            <View style={themed($ownerBadge)}>
              <Text text="Owner" size="xxs" preset="bold" style={themed($ownerBadgeText)} />
              <Text text={user.email} size="xs" style={themed($dimText)} />
            </View>
          ) : null}

          <Button
            text="Next — Choose Your Animals"
            preset="reversed"
            style={themed($nextButton)}
            onPress={handleNext}
          />
        </View>
      ) : (
        /* Step 2: Livestock types */
        <View style={themed($card)}>
          <Text text="What do you farm?" preset="bold" size="lg" />
          <Text
            text="Select all the types of animals you manage. This customises breeds, terminology, and forms for your operation."
            size="sm"
            style={themed($cardDesc)}
          />

          <View style={themed($typesGrid)}>
            {LIVESTOCK_OPTIONS.map((opt) => {
              const isSelected = selectedTypes.includes(opt.type)
              return (
                <Pressable
                  key={opt.type}
                  onPress={() => toggleType(opt.type)}
                  style={[
                    themed($typeCard),
                    isSelected && themed($typeCardSelected),
                  ]}
                >
                  <Text text={opt.emoji} style={themed($typeEmoji)} />
                  <Text
                    text={opt.label}
                    preset="bold"
                    size="sm"
                    style={isSelected ? themed($typeTextSelected) : undefined}
                  />
                  <Text text={opt.desc} size="xxs" style={themed($dimText)} numberOfLines={1} />
                  {isSelected && (
                    <View style={themed($checkBadge)}>
                      <Text text="✓" size="xs" style={themed($checkText)} />
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>

          <View style={themed($buttonRow)}>
            <Button
              text="Back"
              preset="default"
              onPress={() => setStep(1)}
              style={themed($backButton)}
            />
            <Button
              text={isSubmitting ? "Creating..." : `Let's Go (${selectedTypes.length} selected)`}
              preset="reversed"
              style={themed($createButton)}
              onPress={handleCreate}
            />
          </View>
        </View>
      )}

      {/* Pasture illustration */}
      <View style={themed($pastureContainer)}>
        <PastureIcon size={280} color={colors.tint} />
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $hero: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
  marginBottom: spacing.md,
  alignItems: "center",
})

const $appName: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $stepRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.lg,
  gap: 0,
})

const $stepDot: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: colors.palette.neutral300,
})

const $stepDotActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
})

const $stepLine: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 40,
  height: 2,
  backgroundColor: colors.palette.neutral300,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 20,
  padding: spacing.lg,
  gap: spacing.sm,
  marginBottom: spacing.md,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
})

const $cardDesc: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  lineHeight: 20,
})

const $ownerBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  backgroundColor: colors.tint + "12",
  borderRadius: 8,
  padding: spacing.xs,
  paddingHorizontal: spacing.sm,
})

const $ownerBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $nextButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $typesGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
  marginTop: spacing.xs,
})

const $typeCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "47%",
  backgroundColor: colors.palette.neutral200,
  borderRadius: 14,
  padding: spacing.sm,
  borderWidth: 2,
  borderColor: "transparent",
  position: "relative",
})

const $typeCardSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.tint,
  backgroundColor: colors.tint + "08",
})

const $typeEmoji: ThemedStyle<TextStyle> = () => ({
  fontSize: 28,
  marginBottom: 2,
})

const $typeTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $checkBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: 8,
  right: 8,
  width: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: colors.tint,
  alignItems: "center",
  justifyContent: "center",
})

const $checkText: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
})

const $buttonRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginTop: spacing.xs,
})

const $backButton: ThemedStyle<ViewStyle> = () => ({
  minWidth: 70,
})

const $createButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $pastureContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginTop: spacing.sm,
})
