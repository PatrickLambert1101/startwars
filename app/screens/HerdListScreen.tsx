import { FC, useCallback } from "react"
import { View, ViewStyle } from "react-native"

import { Screen, Text, Button, EmptyState } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { MainTabScreenProps } from "@/navigators/navigationTypes"

export const HerdListScreen: FC<MainTabScreenProps<"HerdList">> = ({ navigation }) => {
  const { themed } = useAppTheme()

  const handleAddAnimal = useCallback(() => {
    navigation.navigate("AnimalForm", { mode: "create" })
  }, [navigation])

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($header)}>
        <Text preset="heading" text="Herd" />
        <Button text="+ Add" preset="filled" onPress={handleAddAnimal} style={themed($addButton)} />
      </View>

      <EmptyState
        heading="No animals yet"
        content="Tap '+ Add' to register your first animal, or scan an RFID tag in Chute mode."
        button="Add First Animal"
        buttonOnPress={handleAddAnimal}
        style={themed($emptyState)}
      />
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
  marginBottom: spacing.lg,
})

const $addButton: ThemedStyle<ViewStyle> = () => ({
  minHeight: 36,
  paddingVertical: 6,
  paddingHorizontal: 16,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xxl,
})
