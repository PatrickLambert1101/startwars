import React, { useState } from "react"
import { View, ViewStyle, TextStyle, Pressable, ScrollView } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Screen, Text, TextField, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { AppStackScreenProps } from "@/navigators"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import { LivestockType } from "@/db/models/Organization"

const LIVESTOCK_OPTIONS: { type: LivestockType; label: string; icon: string }[] = [
  { type: "cattle", label: "Cattle", icon: "cow" },
  { type: "buffalo", label: "Buffalo", icon: "buffalo" },
  { type: "sheep", label: "Sheep", icon: "sheep" },
  { type: "goat", label: "Goats", icon: "goat" },
  { type: "horse", label: "Horses", icon: "horse-variant" },
  { type: "pig", label: "Pigs", icon: "pig" },
  { type: "game", label: "Game", icon: "deer" },
]

interface OrgSetupScreenProps extends AppStackScreenProps<"OrgSetup"> {}

export function OrgSetupScreen({ navigation }: OrgSetupScreenProps) {
  const { themed } = useAppTheme()
  const { createOrganization } = useDatabase()
  const { user } = useAuth()

  const [farmName, setFarmName] = useState("")
  const [location, setLocation] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<LivestockType[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [errors, setErrors] = useState<{ farmName?: string; types?: string }>({})

  const toggleLivestockType = (type: LivestockType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
    if (errors.types) {
      setErrors((prev) => ({ ...prev, types: undefined }))
    }
  }

  const handleCreate = async () => {
    const newErrors: { farmName?: string; types?: string } = {}

    if (!farmName.trim()) {
      newErrors.farmName = "Farm name is required"
    }

    if (selectedTypes.length === 0) {
      newErrors.types = "Select at least one livestock type"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsCreating(true)

    try {
      await createOrganization({
        name: farmName.trim(),
        livestockTypes: selectedTypes,
        location: location.trim() || undefined,
        userIdForAdmin: user?.id,
        userEmailForAdmin: user?.email,
        userDisplayName: user?.user_metadata?.display_name || user?.user_metadata?.full_name || null,
      })

      // Navigate to main app
      navigation.replace("Main")
    } catch (error) {
      console.error("Failed to create organization:", error)
      setErrors({ farmName: "Failed to create farm. Please try again." })
      setIsCreating(false)
    }
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={themed($container)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={themed($scrollContent)}>
        <View style={themed($header)}>
          <MaterialCommunityIcons name="grass" size={48} color="#4A8C3F" />
          <Text preset="heading" style={themed($title)}>Set up your farm</Text>
          <Text style={themed($subtitle)}>
            Let's get started with some basic information
          </Text>
        </View>

        <View style={themed($form)}>
          <TextField
            label="Farm Name"
            value={farmName}
            onChangeText={(text) => {
              setFarmName(text)
              if (errors.farmName) {
                setErrors((prev) => ({ ...prev, farmName: undefined }))
              }
            }}
            placeholder="e.g., Sunrise Ranch"
            helper={errors.farmName}
            status={errors.farmName ? "error" : undefined}
            containerStyle={themed($field)}
          />

          <TextField
            label="Location (Optional)"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Western Cape, South Africa"
            containerStyle={themed($field)}
          />

          <View style={themed($livestockSection)}>
            <Text style={themed($sectionLabel)}>What livestock do you manage?</Text>
            <Text style={themed($sectionHelper)}>Select all that apply</Text>

            <View style={themed($livestockGrid)}>
              {LIVESTOCK_OPTIONS.map((option) => {
                const isSelected = selectedTypes.includes(option.type)
                return (
                  <Pressable
                    key={option.type}
                    style={[themed($livestockCard), isSelected && themed($livestockCardSelected)]}
                    onPress={() => toggleLivestockType(option.type)}
                  >
                    <MaterialCommunityIcons name={option.icon as any} size={32} color={isSelected ? "#FFF" : "#4A8C3F"} />
                    <Text style={[themed($livestockLabel), isSelected && themed($livestockLabelSelected)]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <View style={themed($checkmark)}>
                        <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                      </View>
                    )}
                  </Pressable>
                )
              })}
            </View>

            {errors.types && (
              <Text style={themed($errorText)}>{errors.types}</Text>
            )}
          </View>
        </View>

        <Button
          text={isCreating ? "Creating..." : "Create Farm"}
          preset="filled"
          onPress={handleCreate}
          disabled={isCreating}
          style={themed($createButton)}
        />

        <Text style={themed($footerText)}>
          You'll be set as the farm admin and can invite team members later.
        </Text>
      </ScrollView>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $scrollContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xl,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginBottom: spacing.xl,
})

const $logo: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 64,
  marginBottom: spacing.sm,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.palette.neutral600,
  textAlign: "center",
})

const $form: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
  marginBottom: spacing.lg,
})

const $field: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $livestockSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $sectionLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.xxs,
})

const $sectionHelper: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.palette.neutral600,
  marginBottom: spacing.md,
})

const $livestockGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
})

const $livestockCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "48%",
  aspectRatio: 1.5,
  backgroundColor: colors.background,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: colors.palette.neutral300,
  padding: spacing.sm,
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
})

const $livestockCardSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $livestockIcon: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 32,
  marginBottom: spacing.xxs,
})

const $livestockLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "500",
  color: colors.palette.neutral700,
  textAlign: "center",
})

const $livestockLabelSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
  fontWeight: "600",
})

const $checkmark: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: 4,
  right: 4,
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: colors.palette.primary500,
  alignItems: "center",
  justifyContent: "center",
})

const $checkmarkText: ThemedStyle<TextStyle> = () => ({
  color: "white",
  fontSize: 12,
  fontWeight: "bold",
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 13,
  color: colors.palette.angry500,
  marginTop: spacing.xs,
})

const $createButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $footerText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  color: colors.palette.neutral500,
  textAlign: "center",
  lineHeight: 18,
})
