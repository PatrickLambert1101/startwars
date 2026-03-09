import React from "react"
import { View, ViewStyle, TextStyle, ScrollView, Pressable } from "react-native"
import { Screen, Text, Button, Icon } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { spacing } from "@/theme/spacing"
import { colors } from "@/theme/colors"
import { AppStackScreenProps } from "@/navigators"
import { useProtocol, useProtocolStats, useProtocolActions } from "@/hooks/useProtocols"

interface ProtocolDetailScreenProps extends AppStackScreenProps<"ProtocolDetail"> {}

export function ProtocolDetailScreen({ navigation, route }: ProtocolDetailScreenProps) {
  const { protocolId } = route.params
  const { protocol, isLoading } = useProtocol(protocolId)
  const stats = useProtocolStats(protocolId)
  const { toggleProtocolActive, duplicateProtocol } = useProtocolActions()
  const { themed } = useAppTheme()

  const handleEdit = () => {
    navigation.navigate("ProtocolForm", { protocolId })
  }

  const handleToggleActive = async () => {
    if (!protocol) return
    try {
      await toggleProtocolActive(protocolId)
    } catch (error) {
      console.error("Failed to toggle protocol:", error)
    }
  }

  const handleDuplicate = async () => {
    try {
      const newProtocol = await duplicateProtocol(protocolId)
      navigation.replace("ProtocolForm", { protocolId: newProtocol.id })
    } catch (error) {
      console.error("Failed to duplicate protocol:", error)
    }
  }

  if (isLoading || !protocol) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <Icon icon="back" size={24} />
        </Pressable>
        <Text>Loading...</Text>
      </Screen>
    )
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Never"
    return date.toLocaleDateString()
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <Icon icon="back" size={24} />
        </Pressable>
        <View style={themed($titleRow)}>
          <Text preset="heading" text={protocol.name} style={themed($title)} />
          {!protocol.isActive && (
            <View style={themed($inactiveBadge)}>
              <Text style={themed($inactiveBadgeText)}>Inactive</Text>
            </View>
          )}
        </View>
        <Pressable onPress={handleEdit} style={themed($editButton)}>
          <Icon icon="settings" size={24} />
        </Pressable>
      </View>

      <ScrollView style={themed($content)} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={themed($statsRow)}>
          <View style={themed($statCard)}>
            <Text style={themed($statValue)}>{stats.totalApplied}</Text>
            <Text style={themed($statLabel)}>Total Applied</Text>
          </View>
          <View style={themed($statCard)}>
            <Text style={themed($statValue)}>{stats.appliedToday}</Text>
            <Text style={themed($statLabel)}>Today</Text>
          </View>
          <View style={themed($statCard)}>
            <Text style={themed($statValue)}>{formatDate(stats.lastApplied)}</Text>
            <Text style={themed($statLabel)}>Last Applied</Text>
          </View>
        </View>

        {/* Protocol Details */}
        <View style={themed($section)}>
          <Text style={themed($sectionTitle)}>Protocol Details</Text>

          <View style={themed($detailRow)}>
            <Text style={themed($detailLabel)}>Type</Text>
            <Text style={themed($detailValue)}>
              {protocol.protocolType.charAt(0).toUpperCase() + protocol.protocolType.slice(1)}
            </Text>
          </View>

          {protocol.description && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Description</Text>
              <Text style={themed($detailValue)}>{protocol.description}</Text>
            </View>
          )}

          <View style={themed($detailRow)}>
            <Text style={themed($detailLabel)}>Product</Text>
            <Text style={themed($detailValue)}>{protocol.productName}</Text>
          </View>

          <View style={themed($detailRow)}>
            <Text style={themed($detailLabel)}>Dosage</Text>
            <Text style={themed($detailValue)}>{protocol.dosage}</Text>
          </View>

          {protocol.administrationMethod && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Administration</Text>
              <Text style={themed($detailValue)}>{protocol.administrationMethod}</Text>
            </View>
          )}

          {protocol.withdrawalDays !== null && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Withdrawal Period</Text>
              <Text style={themed($detailValue)}>{protocol.withdrawalDays} days</Text>
            </View>
          )}
        </View>

        {/* Target Criteria */}
        <View style={themed($section)}>
          <Text style={themed($sectionTitle)}>Target Criteria</Text>

          <View style={themed($detailRow)}>
            <Text style={themed($detailLabel)}>Species</Text>
            <Text style={themed($detailValue)}>
              {protocol.targetSpecies.charAt(0).toUpperCase() + protocol.targetSpecies.slice(1)}
            </Text>
          </View>

          {(protocol.targetAgeMin !== null || protocol.targetAgeMax !== null) && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Age Range</Text>
              <Text style={themed($detailValue)}>
                {protocol.targetAgeMin !== null ? `${protocol.targetAgeMin} months` : "Any"} -{" "}
                {protocol.targetAgeMax !== null ? `${protocol.targetAgeMax} months` : "Any"}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={themed($actionsSection)}>
          <Button
            text={protocol.isActive ? "Deactivate Protocol" : "Activate Protocol"}
            preset={protocol.isActive ? "default" : "filled"}
            onPress={handleToggleActive}
            style={themed($actionButton)}
          />
          <Button
            text="Duplicate Protocol"
            preset="default"
            onPress={handleDuplicate}
            style={themed($actionButton)}
          />
        </View>
      </ScrollView>
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

const $titleRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $title: ThemedStyle<TextStyle> = () => ({
  flex: 1,
})

const $inactiveBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral400,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 4,
})

const $inactiveBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontSize: 12,
  fontWeight: "600",
})

const $editButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.xs,
  borderRadius: 8,
  backgroundColor: colors.palette.neutral200,
})

const $content: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $statsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginBottom: spacing.lg,
})

const $statCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $statValue: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 24,
  fontWeight: "700",
  color: colors.palette.primary500,
  marginBottom: spacing.xxs,
})

const $statLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.neutral600,
  textAlign: "center",
})

const $section: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.md,
})

const $detailRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  paddingVertical: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
  marginBottom: spacing.xs,
})

const $detailLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.palette.neutral600,
  flex: 1,
})

const $detailValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.text,
  flex: 2,
  textAlign: "right",
})

const $actionsSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
  marginTop: spacing.lg,
  marginBottom: spacing.xxxl,
})

const $actionButton: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})
