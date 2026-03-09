import React, { useState, useMemo, useEffect } from "react"
import { View, ViewStyle, TextStyle, FlatList, Pressable, Alert, ScrollView } from "react-native"
import { Screen, Text, Button, Icon } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { colors } from "@/theme/colors"
import { AppStackScreenProps } from "@/navigators"
import { useProtocols, useProtocolActions } from "@/hooks/useProtocols"
import { TreatmentProtocol, ProtocolType } from "@/db/models"

interface TreatmentProtocolsScreenProps extends AppStackScreenProps<"TreatmentProtocols"> {}

type FilterOption = "all" | ProtocolType

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "vaccination", label: "Vaccination" },
  { value: "treatment", label: "Treatment" },
  { value: "deworming", label: "Deworming" },
  { value: "other", label: "Other" },
]

export function TreatmentProtocolsScreen({ navigation }: TreatmentProtocolsScreenProps) {
  const { protocols, isLoading } = useProtocols()
  const { toggleProtocolActive, deleteProtocol, seedDefaultProtocols } = useProtocolActions()
  const { themed } = useAppTheme()
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all")
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    if (!isLoading && protocols.length === 0) {
      handleSeedDefaults()
    }
  }, [isLoading])

  const filteredProtocols = useMemo(() => {
    if (activeFilter === "all") return protocols
    return protocols.filter((p) => p.protocolType === activeFilter)
  }, [protocols, activeFilter])

  const filterCounts = useMemo(() => {
    const counts: Record<FilterOption, number> = {
      all: protocols.length,
      vaccination: 0,
      treatment: 0,
      deworming: 0,
      other: 0,
    }
    for (const p of protocols) {
      if (p.protocolType in counts) {
        counts[p.protocolType as ProtocolType]++
      }
    }
    return counts
  }, [protocols])

  const handleCreateProtocol = () => {
    navigation.navigate("ProtocolForm")
  }

  const handleEditProtocol = (protocolId: string) => {
    navigation.navigate("ProtocolForm", { protocolId })
  }

  const handleViewProtocol = (protocolId: string) => {
    navigation.navigate("ProtocolDetail", { protocolId })
  }

  const handleToggleActive = async (protocolId: string) => {
    try {
      await toggleProtocolActive(protocolId)
    } catch (error) {
      console.error("Failed to toggle protocol:", error)
    }
  }

  const handleDeleteProtocol = async (protocolId: string) => {
    try {
      await deleteProtocol(protocolId)
    } catch (error) {
      console.error("Failed to delete protocol:", error)
    }
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    try {
      const count = await seedDefaultProtocols()
      if (count > 0) {
        Alert.alert("Protocols Added", `${count} standard SA cattle protocols have been loaded.`)
      }
    } catch (error) {
      console.error("Failed to seed protocols:", error)
    } finally {
      setSeeding(false)
    }
  }

  const renderFilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={themed($filterScroll)}
      contentContainerStyle={themed($filterRow)}
    >
      {FILTER_OPTIONS.map((option) => {
        const isActive = activeFilter === option.value
        const count = filterCounts[option.value]
        if (option.value !== "all" && count === 0) return null
        return (
          <Pressable
            key={option.value}
            style={[themed($filterChip), isActive && themed($filterChipActive)]}
            onPress={() => setActiveFilter(option.value)}
          >
            <Text style={[themed($filterChipText), isActive && themed($filterChipTextActive)]}>
              {option.label}
            </Text>
            <View style={[themed($filterCount), isActive && themed($filterCountActive)]}>
              <Text style={[themed($filterCountText), isActive && themed($filterCountTextActive)]}>
                {count}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </ScrollView>
  )

  const renderProtocol = ({ item }: { item: TreatmentProtocol }) => (
    <Pressable style={themed($protocolCard)} onPress={() => handleViewProtocol(item.id)}>
      <View style={themed($protocolHeader)}>
        <View style={themed($protocolInfo)}>
          <View style={themed($protocolTitleRow)}>
            <Text style={themed($protocolName)}>{item.name}</Text>
            {!item.isActive && (
              <View style={themed($inactiveBadge)}>
                <Text style={themed($inactiveBadgeText)}>Inactive</Text>
              </View>
            )}
          </View>
          {item.protocolType && (
            <View style={[themed($typeBadge), themed($typeBadgeColor(item.protocolType))]}>
              <Text style={themed($typeBadgeText)}>{item.protocolType}</Text>
            </View>
          )}
        </View>
        <View style={themed($protocolActions)}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              handleToggleActive(item.id)
            }}
            style={[themed($toggleButton), item.isActive && themed($toggleButtonActive)]}
          >
            <Icon icon={item.isActive ? "check" : "x"} size={18} color={item.isActive ? "#4A8C3F" : "#999"} />
          </Pressable>
          <Pressable onPress={() => handleEditProtocol(item.id)} style={themed($editButton)}>
            <Icon icon="settings" size={20} />
          </Pressable>
        </View>
      </View>

      <View style={themed($protocolDetails)}>
        <View style={themed($detailRow)}>
          <Icon icon="medical" size={16} color={colors.palette.primary500} />
          <Text style={themed($detailText)}>{item.productName}</Text>
        </View>
        <View style={themed($detailRow)}>
          <Icon icon="settings" size={16} color={colors.palette.primary500} />
          <Text style={themed($detailText)}>{item.dosage}</Text>
        </View>
        {item.withdrawalDays != null && item.withdrawalDays > 0 && (
          <View style={themed($detailRow)}>
            <Icon icon="bell" size={16} color={colors.palette.accent500} />
            <Text style={themed($detailText)}>Withdrawal: {item.withdrawalDays} days</Text>
          </View>
        )}
        <View style={themed($detailRow)}>
          <Icon icon="community" size={16} color={colors.palette.primary500} />
          <Text style={themed($detailText)}>
            {item.targetSpecies.charAt(0).toUpperCase() + item.targetSpecies.slice(1)}
          </Text>
        </View>
      </View>
    </Pressable>
  )

  const renderEmpty = () => (
    <View style={themed($emptyState)}>
      <Icon icon="medical" size={64} color={colors.palette.neutral300} />
      <Text style={themed($emptyTitle)}>No Treatment Protocols</Text>
      <Text style={themed($emptyText)}>
        {activeFilter !== "all"
          ? `No ${activeFilter} protocols found. Try a different filter or create one.`
          : "Create your first protocol to get started"}
      </Text>
      {activeFilter !== "all" ? (
        <Button
          text="Show All"
          onPress={() => setActiveFilter("all")}
          style={themed($emptyButton)}
        />
      ) : (
        <View style={themed($emptyActions)}>
          <Button text="Load SA Defaults" onPress={handleSeedDefaults} disabled={seeding} style={themed($emptyButton)} />
          <Button text="Create Protocol" onPress={handleCreateProtocol} style={themed($emptyButton)} />
        </View>
      )}
    </View>
  )

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <Icon icon="back" size={24} />
        </Pressable>
        <Text preset="heading" text="Treatment Protocols" style={themed($headerTitle)} />
        <Button text="+ New" onPress={handleCreateProtocol} style={themed($createButton)} />
      </View>

      {protocols.length > 0 && renderFilterChips()}

      {filteredProtocols.length > 0 ? (
        <>
          <Text
            text={`${filteredProtocols.length} protocol${filteredProtocols.length !== 1 ? "s" : ""}${activeFilter !== "all" ? ` (${activeFilter})` : ""}`}
            size="xs"
            style={themed($countText)}
          />
          <FlatList
            data={filteredProtocols}
            renderItem={renderProtocol}
            keyExtractor={(item) => item.id}
            contentContainerStyle={themed($listContent)}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        !isLoading && renderEmpty()
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

const $createButton: ThemedStyle<ViewStyle> = () => ({
  minHeight: 36,
  paddingVertical: 6,
  paddingHorizontal: 16,
})

const $filterScroll: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 0,
  marginBottom: spacing.sm,
})

const $filterRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  paddingRight: spacing.md,
})

const $filterChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: 20,
  borderWidth: 1.5,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
})

const $filterChipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $filterChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  fontWeight: "500",
  color: colors.palette.neutral600,
})

const $filterChipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
  fontWeight: "600",
})

const $filterCount: ThemedStyle<ViewStyle> = ({ colors }) => ({
  minWidth: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: colors.palette.neutral200,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 4,
})

const $filterCountActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
})

const $filterCountText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 11,
  fontWeight: "700",
  color: colors.palette.neutral500,
})

const $filterCountTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
})

const $countText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.sm,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

const $protocolCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
})

const $protocolHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: spacing.sm,
})

const $protocolInfo: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $protocolTitleRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.xs,
})

const $protocolName: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 20,
  fontWeight: "700",
  color: colors.text,
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

const $protocolActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $toggleButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.palette.neutral200,
  alignItems: "center",
  justifyContent: "center",
  padding: spacing.xs,
})

const $toggleButtonActive: ThemedStyle<ViewStyle> = () => ({
  backgroundColor: "#E2EDDF",
})

const TYPE_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  vaccination: { bg: "#E2EDDF", text: "#36712D" },
  treatment: { bg: "#FFF3DB", text: "#96660A" },
  deworming: { bg: "#E0E8F0", text: "#3A5A7C" },
  other: { bg: "#F0E8F0", text: "#6A4A6A" },
}

const $typeBadge: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 6,
  marginTop: spacing.xs,
  alignSelf: "flex-start",
})

const $typeBadgeColor =
  (type: string): ThemedStyle<ViewStyle> =>
  () => ({
    backgroundColor: TYPE_BADGE_COLORS[type]?.bg ?? "#F0F0F0",
  })

const $typeBadgeText: ThemedStyle<TextStyle> = () => ({
  fontSize: 12,
  textTransform: "capitalize",
  fontWeight: "600",
})

const $editButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.xs,
  borderRadius: 8,
  backgroundColor: colors.palette.neutral200,
})

const $detailRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $protocolDetails: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xs,
  marginTop: spacing.sm,
})

const $detailText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 15,
  color: colors.text,
  lineHeight: 22,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  alignItems: "center",
})

const $emptyTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 18,
  fontWeight: "600",
  color: colors.text,
  marginTop: spacing.md,
  marginBottom: spacing.xs,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 15,
  color: colors.textDim,
  marginBottom: spacing.lg,
  textAlign: "center",
  paddingHorizontal: spacing.lg,
})

const $emptyActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
  alignItems: "center",
})

const $emptyButton: ThemedStyle<ViewStyle> = () => ({
  minWidth: 180,
})
