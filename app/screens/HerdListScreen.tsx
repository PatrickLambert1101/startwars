import { FC, useCallback, useState } from "react"
import { FlatList, Pressable, View, ViewStyle, TextStyle, Image, ImageStyle } from "react-native"

import { Screen, Text, Button, EmptyState, TextField } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { MainTabScreenProps } from "@/navigators/navigationTypes"
import { useAnimals } from "@/hooks/useAnimals"
import { Animal } from "@/db/models/Animal"
import { STATUS_COLORS } from "@/theme/colors"
import { parsePhotos } from "@/types/Photo"

export const HerdListScreen: FC<MainTabScreenProps<"HerdList">> = ({ navigation }) => {
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
              <Text size="xs" text={`RFID: ${item.rfidTag}`} style={themed($dimText)} />
              <Text size="xs" text={`${item.breed} | ${item.sex}`} style={themed($dimText)} />
            </View>
          </View>
        </View>
      </Pressable>
    )
  }, [themed, theme, handleAnimalPress])

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($header)}>
        <Text preset="heading" text="Herd" />
        <Button text="+ Add" preset="filled" onPress={handleAddAnimal} style={themed($addButton)} />
      </View>

      {animals.length > 0 && (
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder="Search by tag, name, or breed..."
          containerStyle={themed($searchField)}
        />
      )}

      {animals.length > 0 ? (
        <>
          <Text
            text={`${filtered.length} animal${filtered.length !== 1 ? "s" : ""}`}
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
        <EmptyState
          heading={isLoading ? "Loading..." : "No animals yet"}
          content="Tap '+ Add' to register your first animal, or scan an RFID tag in Chute mode."
          button={isLoading ? undefined : "Add First Animal"}
          buttonOnPress={handleAddAnimal}
          imageSource={null}
          style={themed($emptyState)}
          headingStyle={themed($emptyHeading)}
          contentStyle={themed($emptyContent)}
        />
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

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  marginTop: spacing.md,
  alignItems: "flex-start",
})

const $emptyHeading: ThemedStyle<TextStyle> = () => ({
  textAlign: "left",
  paddingHorizontal: 0,
})

const $emptyContent: ThemedStyle<TextStyle> = () => ({
  textAlign: "left",
  paddingHorizontal: 0,
})
