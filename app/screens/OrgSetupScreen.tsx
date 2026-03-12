import { FC, useCallback, useState } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle, Image, ImageStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { Screen, Text, TextField, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import { useSync } from "@/hooks/useSync"
import type { LivestockType } from "@/db/models/Organization"

const herdLogo = require("../../assets/images/herd-logo.png")

type LivestockOption = {
  type: LivestockType
  label: string
  icon: string
  desc: string
}

const LIVESTOCK_OPTIONS: LivestockOption[] = [
  { type: "cattle", label: "Cattle", icon: "cow", desc: "Nguni, Bonsmara, Brahman, Angus..." },
  { type: "buffalo", label: "Buffalo", icon: "buffalo", desc: "Cape buffalo, water buffalo" },
  { type: "horses", label: "Horses", icon: "horse-variant", desc: "Boerperd, Nooitgedachter, Thoroughbred..." },
  { type: "sheep", label: "Sheep", icon: "sheep", desc: "Dorper, Merino, Damara, Dohne..." },
  { type: "goats", label: "Goats", icon: "goat", desc: "Boer, Angora, Kalahari Red, Savanna..." },
  { type: "game", label: "Game", icon: "deer", desc: "Springbok, Impala, Kudu, Eland..." },
]

type HerdSize = "small" | "medium" | "large" | "xlarge"
type Purpose = "breeding" | "fattening" | "dairy" | "mixed" | "game"

const HERD_SIZES: { key: HerdSize; label: string; desc: string }[] = [
  { key: "small", label: "1 – 50", desc: "Smallholding / starter herd" },
  { key: "medium", label: "50 – 200", desc: "Medium operation" },
  { key: "large", label: "200 – 500", desc: "Large commercial" },
  { key: "xlarge", label: "500+", desc: "Enterprise scale" },
]

const PURPOSE_OPTIONS: { key: Purpose; label: string; icon: string }[] = [
  { key: "breeding", label: "Breeding / Stud", icon: "cow" },
  { key: "fattening", label: "Fattening / Feedlot", icon: "food-steak" },
  { key: "dairy", label: "Dairy", icon: "cup" },
  { key: "mixed", label: "Mixed Farming", icon: "grass" },
  { key: "game", label: "Game Farming", icon: "deer" },
]

// Breed options for each livestock type
const BREED_OPTIONS: Record<LivestockType, string[]> = {
  cattle: ["Nguni", "Angus", "Hereford", "Brahman", "Bonsmara", "Simmentaler", "Charolais", "Limousin", "Other"],
  sheep: ["Dorper", "Merino", "Damara", "Dohne Merino", "South African Mutton Merino", "Ile de France", "Other"],
  goats: ["Boer", "Angora", "Kalahari Red", "Savanna", "Indigenous", "Other"],
  horses: ["Thoroughbred", "Quarter Horse", "Arabian", "Boerperd", "Nooitgedachter", "Paint", "Appaloosa", "Other"],
  buffalo: ["Cape Buffalo", "Water Buffalo", "Other"],
  game: ["Mixed Game", "Not Applicable"],
}

const TOTAL_STEPS = 5

export const OrgSetupScreen: FC<AppStackScreenProps<"OrgSetup">> = ({ navigation }) => {
  const { themed, theme: { colors } } = useAppTheme()
  const { createOrganization } = useDatabase()
  const { user } = useAuth()
  const { sync } = useSync()

  const [step, setStep] = useState(1)
  const [orgName, setOrgName] = useState("")
  const [location, setLocation] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<LivestockType[]>([])
  const [defaultBreeds, setDefaultBreeds] = useState<Partial<Record<LivestockType, string>>>({})
  const [herdSize, setHerdSize] = useState<HerdSize | null>(null)
  const [purpose, setPurpose] = useState<Purpose | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleType = useCallback((type: LivestockType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }, [])

  const handleNextFromStep1 = useCallback(() => {
    const name = orgName.trim()
    if (!name) {
      Alert.alert("Required", "Give your farm or ranch a name")
      return
    }
    setStep(2)
  }, [orgName])

  const handleNextFromStep2 = useCallback(() => {
    if (selectedTypes.length === 0) {
      Alert.alert("Select at least one", "Choose the types of animals you manage")
      return
    }
    // Check if any selected types need breed selection
    const needsBreedSelection = selectedTypes.some(type =>
      BREED_OPTIONS[type] && BREED_OPTIONS[type].length > 1
    )
    setStep(needsBreedSelection ? 3 : 4)
  }, [selectedTypes])

  const handleSkipBreedSelection = useCallback(() => {
    // Optional step - can skip without selection
    setStep(4)
  }, [])

  const handleNextFromStep4 = useCallback(async () => {
    if (!herdSize) {
      Alert.alert("Required", "Select your approximate herd size")
      return
    }

    setIsSubmitting(true)
    try {
      await createOrganization({
        name: orgName.trim(),
        livestockTypes: selectedTypes,
        location: location.trim() || undefined,
        defaultBreeds: defaultBreeds,
        userIdForAdmin: user?.id,
        userEmailForAdmin: user?.email || undefined,
      })

      // Auto-sync to Supabase so the membership syncs
      console.log("[OrgSetup] Auto-syncing new organization...")
      await sync()
      console.log("[OrgSetup] Sync complete")

      setStep(5)
    } catch (error) {
      console.error("[OrgSetup] Error:", error)
      Alert.alert("Error", "Failed to create organization. Please try again.")
    }
    setIsSubmitting(false)
  }, [orgName, location, selectedTypes, herdSize, defaultBreeds, createOrganization, sync, user])

  const handleGoToDashboard = useCallback(() => {
    navigation.replace("Main", { screen: "Dashboard" })
  }, [navigation])

  const handleGoToAddAnimals = useCallback(() => {
    navigation.replace("Main", { screen: "HerdList" })
    setTimeout(() => navigation.navigate("AnimalForm", { mode: "create" }), 100)
  }, [navigation])

  const handleGoToChute = useCallback(() => {
    navigation.replace("Main", { screen: "Chute" })
  }, [navigation])

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top", "bottom"]}>
      {/* Header */}
      <View style={themed($hero)}>
        <Image source={herdLogo} style={[themed($logoImage), { tintColor: colors.tint }]} resizeMode="contain" />
        <Text text="HerdTrackr" preset="heading" style={themed($appName)} />
        <Text
          text={step <= 4 ? "Set up your operation" : "You're all set!"}
          size="sm"
          style={themed($subtitle)}
        />
      </View>

      {/* Step indicator */}
      <View style={themed($stepRow)}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={[themed($stepDot), step > i && themed($stepDotActive)]} />
            {i < TOTAL_STEPS - 1 && <View style={[themed($stepLine), step > i + 1 && themed($stepLineActive)]} />}
          </View>
        ))}
      </View>

      {/* ─── STEP 1: Farm Details ─── */}
      {step === 1 && (
        <View style={themed($card)}>
          <Text text="Your Farm" preset="bold" size="lg" />
          <Text
            text="Tell us about your operation. This creates your workspace."
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
              <Text text={user.email} size="xs" style={themed($dimText)} numberOfLines={1} />
            </View>
          ) : null}

          <Button
            text="Next"
            preset="reversed"
            style={themed($nextButton)}
            onPress={handleNextFromStep1}
          />
        </View>
      )}

      {/* ─── STEP 2: Livestock Types ─── */}
      {step === 2 && (
        <View style={themed($card)}>
          <Text text="What do you farm?" preset="bold" size="lg" />
          <Text
            text="Select all the types of animals you manage."
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
                  <MaterialCommunityIcons name={opt.icon as any} size={32} color={isSelected ? "#FFF" : "#4A8C3F"} />
                  <Text
                    text={opt.label}
                    preset="bold"
                    size="sm"
                    style={isSelected ? themed($typeTextSelected) : undefined}
                  />
                  <Text text={opt.desc} size="xxs" style={themed($dimText)} numberOfLines={1} />
                  {isSelected && (
                    <View style={themed($checkBadge)}>
                      <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>

          <View style={themed($buttonRow)}>
            <Button text="Back" preset="default" onPress={() => setStep(1)} style={themed($backButton)} />
            <Button
              text={`Next (${selectedTypes.length} selected)`}
              preset="reversed"
              style={themed($flexButton)}
              onPress={handleNextFromStep2}
            />
          </View>
        </View>
      )}

      {/* ─── STEP 3: Default Breeds (Optional) ─── */}
      {step === 3 && (
        <View style={themed($card)}>
          <Text text="Set default breeds" preset="bold" size="lg" />
          <Text
            text="Choose your most common breeds. You can always change these later."
            size="sm"
            style={themed($cardDesc)}
          />

          {selectedTypes.map((livestockType) => {
            const breeds = BREED_OPTIONS[livestockType]
            if (!breeds || breeds.length <= 1) return null

            const livestockLabel = LIVESTOCK_OPTIONS.find((opt) => opt.type === livestockType)?.label || livestockType
            const selectedBreed = defaultBreeds[livestockType]

            return (
              <View key={livestockType} style={{ gap: 4 }}>
                <Text text={`${livestockLabel} breed`} preset="formLabel" />
                <View style={themed($breedGrid)}>
                  {breeds.map((breed) => (
                    <Pressable
                      key={breed}
                      onPress={() => setDefaultBreeds(prev => ({
                        ...prev,
                        [livestockType]: prev[livestockType] === breed ? undefined : breed
                      }))}
                      style={[
                        themed($breedCard),
                        selectedBreed === breed && themed($breedCardSelected),
                      ]}
                    >
                      <Text
                        text={breed}
                        size="xs"
                        preset="bold"
                        style={selectedBreed === breed ? themed($selectedText) : undefined}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            )
          })}

          <View style={themed($buttonRow)}>
            <Button text="Back" preset="default" onPress={() => setStep(2)} style={themed($backButton)} />
            <Button
              text="Next"
              preset="reversed"
              style={themed($flexButton)}
              onPress={handleSkipBreedSelection}
            />
          </View>
        </View>
      )}

      {/* ─── STEP 4: Herd Profile ─── */}
      {step === 4 && (
        <View style={themed($card)}>
          <Text text="Tell us about your herd" preset="bold" size="lg" />
          <Text
            text="This helps us tailor the experience for your operation."
            size="sm"
            style={themed($cardDesc)}
          />

          <Text text="Approximate herd size" preset="formLabel" />
          <View style={themed($sizeGrid)}>
            {HERD_SIZES.map((s) => (
              <Pressable
                key={s.key}
                onPress={() => setHerdSize(s.key)}
                style={[
                  themed($sizeCard),
                  herdSize === s.key && themed($sizeCardSelected),
                ]}
              >
                <Text
                  text={s.label}
                  preset="bold"
                  style={herdSize === s.key ? themed($selectedText) : undefined}
                />
                <Text text={s.desc} size="xxs" style={herdSize === s.key ? themed($selectedTextDim) : themed($dimText)} />
              </Pressable>
            ))}
          </View>

          <Text text="Primary purpose (optional)" preset="formLabel" />
          <View style={themed($purposeGrid)}>
            {PURPOSE_OPTIONS.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => setPurpose(purpose === p.key ? null : p.key)}
                style={[
                  themed($purposeCard),
                  purpose === p.key && themed($purposeCardSelected),
                ]}
              >
                <MaterialCommunityIcons name={p.icon as any} size={22} color={purpose === p.key ? "#FFF" : "#4A8C3F"} />
                <Text
                  text={p.label}
                  size="xs"
                  preset="bold"
                  style={[
                    purpose === p.key ? themed($selectedText) : undefined,
                    { flex: 1, flexWrap: "wrap" }
                  ]}
                  numberOfLines={2}
                />
              </Pressable>
            ))}
          </View>

          <View style={themed($buttonRow)}>
            <Button text="Back" preset="default" onPress={() => setStep(3)} style={themed($backButton)} />
            <Button
              text={isSubmitting ? "Creating & Syncing..." : "Create Farm"}
              preset="reversed"
              style={themed($flexButton)}
              onPress={handleNextFromStep4}
              disabled={isSubmitting}
            />
          </View>
        </View>
      )}

      {/* ─── STEP 5: Get Started ─── */}
      {step === 5 && (
        <View style={themed($card)}>
          <View style={themed($successIcon)}>
            <MaterialCommunityIcons name="check-circle" size={60} color="#10B981" />
          </View>
          <Text text={`${orgName.trim()} is ready!`} preset="bold" size="lg" style={{ textAlign: "center" }} />
          <Text
            text="What would you like to do first?"
            size="sm"
            style={[themed($cardDesc), { textAlign: "center" }]}
          />

          <Pressable onPress={handleGoToAddAnimals} style={themed($getStartedCard)}>
            <View style={themed($getStartedIcon)}>
              <MaterialCommunityIcons name="cow" size={28} color="#4A8C3F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text text="Add my first animals" preset="bold" />
              <Text text="Register your herd one by one or import from a list" size="xs" style={themed($dimText)} />
            </View>
          </Pressable>

          <Pressable onPress={handleGoToDashboard} style={themed($getStartedCard)}>
            <View style={themed($getStartedIcon)}>
              <Text text="🏠" style={{ fontSize: 28 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text text="Explore the app" preset="bold" />
              <Text text="Take a look around and see what HerdTrackr can do" size="xs" style={themed($dimText)} />
            </View>
          </Pressable>
        </View>
      )}
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
  width: 30,
  height: 2,
  backgroundColor: colors.palette.neutral300,
})

const $stepLineActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
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
  backgroundColor: colors.tint + "12",
  borderRadius: 8,
  padding: spacing.xs,
  paddingHorizontal: spacing.sm,
  gap: spacing.xxs,
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

const $flexButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

// Step 3: Herd size
const $sizeGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $sizeCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "48%",
  backgroundColor: colors.palette.neutral200,
  borderRadius: 12,
  padding: spacing.sm,
  borderWidth: 2,
  borderColor: "transparent",
  alignItems: "center",
})

const $sizeCardSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.tint,
  backgroundColor: colors.tint + "12",
})

const $selectedText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $selectedTextDim: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint + "88",
})

// Step 3: Purpose
const $purposeGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $purposeCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "48%",
  backgroundColor: colors.palette.neutral200,
  borderRadius: 12,
  padding: spacing.sm,
  borderWidth: 2,
  borderColor: "transparent",
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  minHeight: 50,
})

const $purposeCardSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.tint,
  backgroundColor: colors.tint + "12",
})

// Step 4: Get started
const $successIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: colors.tint,
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center",
})

const $successCheck: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontSize: 28,
  fontWeight: "bold",
})

const $getStartedCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
  backgroundColor: colors.palette.neutral200,
  borderRadius: 14,
  padding: spacing.md,
})

const $getStartedIcon: ThemedStyle<ViewStyle> = () => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
})

const $logoImage: ThemedStyle<ImageStyle> = () => ({
  width: 64,
  height: 64,
})

// Step 3: Breed selection
const $breedGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $breedCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderRadius: 8,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  borderWidth: 2,
  borderColor: "transparent",
})

const $breedCardSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.tint,
  backgroundColor: colors.tint + "12",
})
