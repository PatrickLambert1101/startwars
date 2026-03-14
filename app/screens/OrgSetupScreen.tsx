import { FC, useCallback, useState, useEffect } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle, Image, ImageStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { Screen, Text, TextField, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import { useSync } from "@/hooks/useSync"
import type { LivestockType } from "@/db/models/Organization"
import { loadString, saveString } from "@/utils/storage"

const herdLogo = require("../../assets/images/herd-logo.png")

type LivestockOption = {
  type: LivestockType
  label: string
  icon: string
  emoji: string
  desc: string
}

// Livestock options - labels and descriptions will be translated in component

type HerdSize = "small" | "medium" | "large" | "xlarge"
type Purpose = "breeding" | "fattening" | "dairy" | "mixed" | "game"

// Herd sizes and purposes - labels will be translated in component

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
  const { t } = useTranslation()
  const { themed, theme: { colors } } = useAppTheme()
  const { createOrganization } = useDatabase()
  const { user } = useAuth()
  const { sync } = useSync()

  const [step, setStep] = useState(1)
  const [userName, setUserName] = useState("")
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [location, setLocation] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<LivestockType[]>([])
  const [defaultBreeds, setDefaultBreeds] = useState<Partial<Record<LivestockType, string>>>({})
  const [herdSize, setHerdSize] = useState<HerdSize | null>(null)
  const [purpose, setPurpose] = useState<Purpose | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load saved user name from storage on mount
  useEffect(() => {
    const loadUserName = async () => {
      const savedName = await loadString("user_display_name")
      if (savedName) {
        setUserName(savedName)
        setShowNamePrompt(false)
      } else {
        setShowNamePrompt(true)
      }
    }
    loadUserName()
  }, [])

  const toggleType = useCallback((type: LivestockType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }, [])

  const handleNextFromStep1 = useCallback(async () => {
    const name = orgName.trim()
    const displayName = userName.trim()
    if (!displayName) {
      Alert.alert(t("common.required"), t("orgSetupScreen.step1.alerts.nameRequired"))
      return
    }
    if (!name) {
      Alert.alert(t("common.required"), t("orgSetupScreen.step1.alerts.farmRequired"))
      return
    }
    // Save user name to storage for future use
    await saveString("user_display_name", displayName)
    setStep(2)
  }, [userName, orgName, t])

  const handleNextFromStep2 = useCallback(() => {
    if (selectedTypes.length === 0) {
      Alert.alert(t("common.required"), t("orgSetupScreen.step2.alert"))
      return
    }
    // Check if any selected types need breed selection
    const needsBreedSelection = selectedTypes.some(type =>
      BREED_OPTIONS[type] && BREED_OPTIONS[type].length > 1
    )
    setStep(needsBreedSelection ? 3 : 4)
  }, [selectedTypes, t])

  const handleSkipBreedSelection = useCallback(() => {
    // Optional step - can skip without selection
    setStep(4)
  }, [])

  const handleNextFromStep4 = useCallback(async () => {
    if (!herdSize) {
      Alert.alert(t("common.required"), t("orgSetupScreen.step4.alert"))
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
        userDisplayName: userName.trim(),
      })

      // Auto-sync to Supabase so the membership syncs
      console.log("[OrgSetup] Auto-syncing new organization...")
      await sync()
      console.log("[OrgSetup] Sync complete")

      setStep(5)
    } catch (error) {
      console.error("[OrgSetup] Error:", error)
      Alert.alert(t("errors.somethingWentWrong"), t("errors.tryAgain"))
    }
    setIsSubmitting(false)
  }, [orgName, location, selectedTypes, herdSize, defaultBreeds, createOrganization, sync, user, userName, t])

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

  // Translated options
  const livestockOptions: LivestockOption[] = [
    { type: "cattle", label: t("orgSetupScreen.step2.livestock.cattle.label"), icon: "cow", emoji: "🐄", desc: t("orgSetupScreen.step2.livestock.cattle.desc") },
    { type: "buffalo", label: t("orgSetupScreen.step2.livestock.buffalo.label"), icon: "buffalo", emoji: "🐃", desc: t("orgSetupScreen.step2.livestock.buffalo.desc") },
    { type: "horses", label: t("orgSetupScreen.step2.livestock.horses.label"), icon: "horse-variant", emoji: "🐴", desc: t("orgSetupScreen.step2.livestock.horses.desc") },
    { type: "sheep", label: t("orgSetupScreen.step2.livestock.sheep.label"), icon: "sheep", emoji: "🐑", desc: t("orgSetupScreen.step2.livestock.sheep.desc") },
    { type: "goats", label: t("orgSetupScreen.step2.livestock.goats.label"), icon: "goat", emoji: "🐐", desc: t("orgSetupScreen.step2.livestock.goats.desc") },
    { type: "game", label: t("orgSetupScreen.step2.livestock.game.label"), icon: "elephant", emoji: "🦌", desc: t("orgSetupScreen.step2.livestock.game.desc") },
    { type: "pigs", label: t("orgSetupScreen.step2.livestock.pigs.label"), icon: "pig", emoji: "🐷", desc: t("orgSetupScreen.step2.livestock.pigs.desc") },
    { type: "poultry", label: t("orgSetupScreen.step2.livestock.poultry.label"), icon: "bird", emoji: "🐔", desc: t("orgSetupScreen.step2.livestock.poultry.desc") },
  ]

  const herdSizes: { key: HerdSize; label: string; desc: string }[] = [
    { key: "small", label: t("orgSetupScreen.step4.herdSizes.small.label"), desc: t("orgSetupScreen.step4.herdSizes.small.desc") },
    { key: "medium", label: t("orgSetupScreen.step4.herdSizes.medium.label"), desc: t("orgSetupScreen.step4.herdSizes.medium.desc") },
    { key: "large", label: t("orgSetupScreen.step4.herdSizes.large.label"), desc: t("orgSetupScreen.step4.herdSizes.large.desc") },
    { key: "xlarge", label: t("orgSetupScreen.step4.herdSizes.xlarge.label"), desc: t("orgSetupScreen.step4.herdSizes.xlarge.desc") },
  ]

  const purposeOptions: { key: Purpose; label: string; icon: string }[] = [
    { key: "breeding", label: t("orgSetupScreen.step4.purposes.breeding"), icon: "cow" },
    { key: "fattening", label: t("orgSetupScreen.step4.purposes.fattening"), icon: "food-steak" },
    { key: "dairy", label: t("orgSetupScreen.step4.purposes.dairy"), icon: "cup" },
    { key: "mixed", label: t("orgSetupScreen.step4.purposes.mixed"), icon: "grass" },
    { key: "game", label: t("orgSetupScreen.step4.purposes.game"), icon: "elephant" },
  ]

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top", "bottom"]}>
      {/* Header */}
      <View style={themed($hero)}>
        <Image source={herdLogo} style={[themed($logoImage), { tintColor: colors.tint }]} resizeMode="contain" />
        <Text text={t("orgSetupScreen.title")} preset="heading" style={themed($appName)} />
        <Text
          text={step <= 4 ? t("orgSetupScreen.subtitle") : t("orgSetupScreen.allSet")}
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
          <Text text={t("orgSetupScreen.step1.title")} preset="bold" size="lg" />
          <Text
            text={t("orgSetupScreen.step1.description")}
            size="sm"
            style={themed($cardDesc)}
          />

          {showNamePrompt && (
            <TextField
              label={t("orgSetupScreen.step1.yourNameLabel")}
              value={userName}
              onChangeText={setUserName}
              placeholder={t("orgSetupScreen.step1.yourNamePlaceholder")}
              autoFocus
            />
          )}

          <TextField
            label={t("orgSetupScreen.step1.farmNameLabel")}
            value={orgName}
            onChangeText={setOrgName}
            placeholder={t("orgSetupScreen.step1.farmNamePlaceholder")}
            autoFocus={!showNamePrompt}
          />

          <TextField
            label={t("orgSetupScreen.step1.locationLabel")}
            value={location}
            onChangeText={setLocation}
            placeholder={t("orgSetupScreen.step1.locationPlaceholder")}
          />

          {user?.email ? (
            <View style={themed($ownerBadge)}>
              <Text text={t("orgSetupScreen.step1.ownerBadge")} size="xxs" preset="bold" style={themed($ownerBadgeText)} />
              <Text text={user.email} size="xs" style={themed($dimText)} numberOfLines={1} />
            </View>
          ) : null}

          <Button
            text={t("common.next")}
            preset="reversed"
            style={themed($nextButton)}
            onPress={handleNextFromStep1}
          />
        </View>
      )}

      {/* ─── STEP 2: Livestock Types ─── */}
      {step === 2 && (
        <View style={themed($card)}>
          <Text text={t("orgSetupScreen.step2.title")} preset="bold" size="lg" />
          <Text
            text={t("orgSetupScreen.step2.description")}
            size="sm"
            style={themed($cardDesc)}
          />

          <View style={themed($typesGrid)}>
            {livestockOptions.map((opt) => {
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
                      <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>

          <View style={themed($buttonRow)}>
            <Button text={t("common.back")} preset="default" onPress={() => setStep(1)} style={themed($backButton)} />
            <Button
              text={t("orgSetupScreen.step2.nextButton", { count: selectedTypes.length })}
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
          <Text text={t("orgSetupScreen.step3.title")} preset="bold" size="lg" />
          <Text
            text={t("orgSetupScreen.step3.description")}
            size="sm"
            style={themed($cardDesc)}
          />

          {selectedTypes.map((livestockType) => {
            const breeds = BREED_OPTIONS[livestockType]
            if (!breeds || breeds.length <= 1) return null

            const livestockLabel = livestockOptions.find((opt) => opt.type === livestockType)?.label || livestockType
            const selectedBreed = defaultBreeds[livestockType]

            return (
              <View key={livestockType} style={{ gap: 4 }}>
                <Text text={t("orgSetupScreen.step3.breedLabel", { livestock: livestockLabel })} preset="formLabel" />
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
            <Button text={t("common.back")} preset="default" onPress={() => setStep(2)} style={themed($backButton)} />
            <Button
              text={t("common.next")}
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
          <Text text={t("orgSetupScreen.step4.title")} preset="bold" size="lg" />
          <Text
            text={t("orgSetupScreen.step4.description")}
            size="sm"
            style={themed($cardDesc)}
          />

          <Text text={t("orgSetupScreen.step4.herdSizeLabel")} preset="formLabel" />
          <View style={themed($sizeGrid)}>
            {herdSizes.map((s) => (
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

          <Text text={t("orgSetupScreen.step4.purposeLabel")} preset="formLabel" />
          <View style={themed($purposeGrid)}>
            {purposeOptions.map((p) => (
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
            <Button text={t("common.back")} preset="default" onPress={() => setStep(3)} style={themed($backButton)} />
            <Button
              text={isSubmitting ? t("orgSetupScreen.step4.creating") : t("orgSetupScreen.step4.createButton")}
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
          <View style={{ alignSelf: "center", marginBottom: 16 }}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#10B981" />
          </View>
          <Text text={t("orgSetupScreen.step5.title", { farmName: orgName.trim() })} preset="bold" size="lg" style={{ textAlign: "center" }} />
          <Text
            text={t("orgSetupScreen.step5.subtitle")}
            size="sm"
            style={[themed($cardDesc), { textAlign: "center" }]}
          />

          <Pressable onPress={handleGoToAddAnimals} style={themed($getStartedCard)}>
            <View style={themed($getStartedIcon)}>
              <MaterialCommunityIcons name="cow" size={28} color="#4A8C3F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text text={t("orgSetupScreen.step5.options.addAnimals.title")} preset="bold" />
              <Text text={t("orgSetupScreen.step5.options.addAnimals.description")} size="xs" style={themed($dimText)} />
            </View>
          </Pressable>

          <Pressable onPress={handleGoToDashboard} style={themed($getStartedCard)}>
            <View style={themed($getStartedIcon)}>
              <Text text="🏠" style={{ fontSize: 28 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text text={t("orgSetupScreen.step5.options.explore.title")} preset="bold" />
              <Text text={t("orgSetupScreen.step5.options.explore.description")} size="xs" style={themed($dimText)} />
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
