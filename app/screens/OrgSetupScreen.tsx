import { FC, useCallback, useState } from "react"
import { Alert, View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, TextField, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import { HerdTrackrLogo, PastureIcon } from "@/components/icons"

export const OrgSetupScreen: FC<AppStackScreenProps<"OrgSetup">> = ({ navigation }) => {
  const { themed, theme: { colors } } = useAppTheme()
  const { createOrganization } = useDatabase()
  const { user } = useAuth()

  const [orgName, setOrgName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = useCallback(async () => {
    const name = orgName.trim()
    if (!name) {
      Alert.alert("Required", "Organization name is required")
      return
    }

    setIsSubmitting(true)
    try {
      await createOrganization(name)
      navigation.replace("Main", { screen: "Dashboard" })
    } catch {
      Alert.alert("Error", "Failed to create organization")
    }
    setIsSubmitting(false)
  }, [orgName, createOrganization, navigation])

  return (
    <Screen preset="auto" contentContainerStyle={themed($container)} safeAreaEdges={["top", "bottom"]}>
      <View style={themed($hero)}>
        <HerdTrackrLogo size={90} color={colors.tint} accentColor={colors.tint} />
        <Text text="HerdTrackr" preset="heading" style={themed($appName)} />
        <Text text="Set up your operation" preset="subheading" style={themed($subtitle)} />
      </View>

      <View style={themed($card)}>
        <Text text="Create your organization" preset="bold" size="lg" style={themed($cardTitle)} />
        <Text
          text="An organization holds all your cattle data. Everyone on your team will share this workspace."
          size="sm"
          style={themed($cardDesc)}
        />

        <TextField
          label="Ranch / Farm Name"
          value={orgName}
          onChangeText={setOrgName}
          placeholder="e.g. Sunrise Cattle Co."
          autoFocus
        />

        {user?.email ? (
          <Text
            text={`You're signed in as ${user.email}. You'll be the owner of this organization.`}
            size="xs"
            style={themed($ownerNote)}
          />
        ) : null}

        <Button
          text={isSubmitting ? "Creating..." : "Create Organization"}
          preset="reversed"
          style={themed($createButton)}
          onPress={handleCreate}
        />
      </View>

      <View style={themed($infoSection)}>
        <Text preset="formLabel" text="WHAT HAPPENS NEXT" style={themed($infoLabel)} />
        <InfoItem number="1" text="Add your animals with RFID and visual tags" themed={themed} />
        <InfoItem number="2" text="Use Chute mode for fast processing days" themed={themed} />
        <InfoItem number="3" text="Track health, weight, and breeding records" themed={themed} />
        <InfoItem number="4" text="Sync across devices when you have internet" themed={themed} />
      </View>

      <View style={themed($pastureContainer)}>
        <PastureIcon size={280} color={colors.tint} />
      </View>
    </Screen>
  )
}

function InfoItem({ number, text, themed }: { number: string; text: string; themed: any }) {
  return (
    <View style={themed($infoItem)}>
      <View style={themed($infoBadge)}>
        <Text text={number} preset="bold" size="xs" style={themed($infoBadgeText)} />
      </View>
      <Text text={text} size="sm" style={themed($infoText)} />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $hero: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xxl,
  marginBottom: spacing.xl,
  alignItems: "center",
})

const $appName: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $subtitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  gap: spacing.sm,
  marginBottom: spacing.xl,
})

const $cardTitle: ThemedStyle<TextStyle> = () => ({})

const $cardDesc: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $ownerNote: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xs,
})

const $createButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

const $infoSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
})

const $infoLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  letterSpacing: 1,
  marginBottom: spacing.xs,
})

const $infoItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $infoBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: colors.tint,
  alignItems: "center",
  justifyContent: "center",
})

const $infoBadgeText: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
})

const $infoText: ThemedStyle<TextStyle> = () => ({
  flex: 1,
})

const $pastureContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginTop: spacing.xl,
})
