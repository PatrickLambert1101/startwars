import { FC, useCallback, useState } from "react"
import { FlatList, Pressable, View, ViewStyle, TextStyle, Image, ImageStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { Screen, Text, Button, EmptyState, TextField } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { MainTabScreenProps } from "@/navigators/navigationTypes"
import { useAnimals } from "@/hooks/useAnimals"
import { Animal } from "@/db/models/Animal"
import { STATUS_COLORS } from "@/theme/colors"
import { parsePhotos } from "@/types/Photo"

export const HerdListScreen: FC<MainTabScreenProps<"HerdList">> = ({ navigation }) => {
  const { t } = useTranslation()
  const { themed, theme } = useAppTheme()
  const { animals, isLoading } = useAnimals()
  const [search, setSearch] = useState("")

  const handleAddAnimal = useCallback(() => {
    navigation.navigate("AnimalForm", { mode: "create" })
  }, [navigation])

  const handleAnimalPress = useCallback((animal: Animal) => {
    navigation.navigate("AnimalDetail", { animalId: animal.id })
  }, [navigation])

  const filtered = search
    ? animals.filter((a) => {
        const q = search.toLowerCase()
        return (
          a.visualTag.toLowerCase().includes(q) ||
          a.rfidTag.toLowerCase().includes(q) ||
          (a.name && a.name.toLowerCase().includes(q)) ||
          a.breed.toLowerCase().includes(q)
        )
      })
    : animals

  const renderAnimal = useCallback(({ item }: { item: Animal }) => {
    const statusColor = STATUS_COLORS[item.status] || theme.colors.textDim
    const photos = parsePhotos(item.photos)
    const firstPhoto = photos.length > 0 ? photos[0] : null

    return (
      <Pressable onPress={() => handleAnimalPress(item)} style={themed($animalCard)}>
        <View style={themed($animalCardRow)}>
          {firstPhoto && (
            <Image
              source={{ uri: firstPhoto.thumbnailUri || firstPhoto.uri }}
              style={$animalPhoto}
              resizeMode="cover"
            />
          )}
          <View style={themed($animalCardContent)}>
            <View style={themed($animalCardHeader)}>
              <Text preset="bold" text={item.displayName} />
              <View style={[$statusBadge, { backgroundColor: statusColor + "22" }]}>
                <Text text={item.status} size="xxs" style={{ color: statusColor }} />
              </View>
            </View>
            <View style={themed($animalCardBody)}>
              <Text size="xs" text={t("herdListScreen.tag", { tag: item.visualTag })} style={themed($dimText)} />
              <Text size="xs" text={t("herdListScreen.breedAndSex", { breed: item.breed, sex: item.sex })} style={themed($dimText)} />
            </View>
          </View>
        </View>
      </Pressable>
    )
  }, [themed, theme, handleAnimalPress, t])

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($header)}>
        <Text preset="heading" text={t("herdListScreen.title")} />
        <Button text={t("herdListScreen.addButton")} preset="filled" onPress={handleAddAnimal} style={themed($addButton)} />
      </View>

      {animals.length > 0 && (
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder={t("herdListScreen.searchPlaceholder")}
          containerStyle={themed($searchField)}
        />
      )}

      {animals.length > 0 ? (
        <>
          <Text
            text={t(
              filtered.length === 1 ? "herdListScreen.count_one" : "herdListScreen.count_other",
              { count: filtered.length }
            )}
            size="xs"
            style={themed($countText)}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderAnimal}
            contentContainerStyle={themed($listContent)}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <View style={themed($emptyContainer)}>
          <View style={themed($emptyIconContainer)}>
            <MaterialCommunityIcons name="cow" size={50} color={theme.colors.palette.primary500} />
          </View>
          <Text preset="heading" text={isLoading ? t("herdListScreen.empty.loading") : t("herdListScreen.empty.title")} style={themed($emptyHeading)} />
          <Text
            text={t("herdListScreen.empty.description")}
            style={themed($emptyContent)}
          />

          <View style={themed($onboardingCards)}>
            <View style={themed($onboardingCard)}>
              <View style={themed($stepIconContainer)}>
                <MaterialCommunityIcons name="tag-plus-outline" size={20} color={theme.colors.palette.primary500} />
              </View>
              <View style={themed($cardContent)}>
                <Text preset="bold" text={t("herdListScreen.empty.onboarding.step1.title")} style={themed($cardTitle)} />
                <Text text={t("herdListScreen.empty.onboarding.step1.description")} size="xs" style={themed($cardText)} />
              </View>
            </View>

            <View style={themed($onboardingCard)}>
              <View style={themed($stepIconContainer)}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={theme.colors.palette.primary500} />
              </View>
              <View style={themed($cardContent)}>
                <Text preset="bold" text={t("herdListScreen.empty.onboarding.step2.title")} style={themed($cardTitle)} />
                <Text text={t("herdListScreen.empty.onboarding.step2.description")} size="xs" style={themed($cardText)} />
              </View>
            </View>

            <View style={themed($onboardingCard)}>
              <View style={themed($stepIconContainer)}>
                <MaterialCommunityIcons name="file-export-outline" size={20} color={theme.colors.palette.primary500} />
              </View>
              <View style={themed($cardContent)}>
                <Text preset="bold" text={t("herdListScreen.empty.onboarding.step3.title")} style={themed($cardTitle)} />
                <Text text={t("herdListScreen.empty.onboarding.step3.description")} size="xs" style={themed($cardText)} />
              </View>
            </View>
          </View>

          {!isLoading && (
            <Button
              text={t("herdListScreen.empty.button")}
              preset="filled"
              onPress={handleAddAnimal}
              style={themed($emptyButton)}
            />
          )}

          <View style={themed($helpHint)}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={theme.colors.palette.primary700} style={themed($hintIcon)} />
            <Text text={t("herdListScreen.empty.tip")} size="xs" style={themed($hintText)} />
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

const $addButton: ThemedStyle<ViewStyle> = () => ({
  minHeight: 36,
  paddingVertical: 6,
  paddingHorizontal: 16,
})

const $searchField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $countText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.sm,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

const $animalCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
})

const $animalCardRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $animalPhoto: ImageStyle = {
  width: 60,
  height: 60,
  borderRadius: 8,
}

const $animalCardContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $animalCardHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $statusBadge: ViewStyle = {
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 2,
}

const $animalCardBody: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
  gap: 2,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xl,
})

const $emptyIconContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: colors.palette.primary100,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: spacing.md,
})

const $emptyHeading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $emptyContent: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  textAlign: "center",
  color: colors.textDim,
  marginBottom: spacing.lg,
  paddingHorizontal: spacing.md,
  lineHeight: 22,
})

const $onboardingCards: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  gap: spacing.sm,
  marginBottom: spacing.lg,
})

const $onboardingCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
})

const $stepIconContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.palette.primary100,
  justifyContent: "center",
  alignItems: "center",
})

const $cardContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $cardTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xxs,
})

const $cardText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  lineHeight: 18,
})

const $emptyButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minWidth: 200,
  marginBottom: spacing.md,
})

const $helpHint: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  backgroundColor: colors.palette.primary100,
  padding: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: 8,
  marginTop: spacing.sm,
  alignItems: "center",
  gap: spacing.xs,
})

const $hintIcon: ThemedStyle<any> = ({ spacing }) => ({
  marginRight: spacing.xxs,
})

const $hintText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary700,
  flex: 1,
})
