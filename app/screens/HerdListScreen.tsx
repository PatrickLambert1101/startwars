import { FC, useCallback, useState, useEffect, useRef } from "react"
import { FlatList, Pressable, View, ViewStyle, TextStyle, Image, ImageStyle, RefreshControl, Modal, ScrollView, StyleSheet, ActivityIndicator } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import * as Network from "expo-network"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCameraDevice, useCameraPermission } from "react-native-vision-camera"
import { Camera } from "react-native-vision-camera-ocr-plus"
import type { Text as OCRText } from "react-native-vision-camera-ocr-plus"

import { Screen, Text, Button, TextField, AppHeader, FilterModal, DEFAULT_FILTER_STATE } from "@/components"
import type { FilterState } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { MainTabScreenProps } from "@/navigators/navigationTypes"
import { useAnimalsQuery, useComputedAnimalFilters } from "@/hooks/useAnimals"
import { Animal } from "@/db/models/Animal"
import { STATUS_COLORS } from "@/theme/colors"
import { parsePhotos } from "@/types/Photo"
import { syncDatabase } from "@/services/sync_rpc"
import { extractTagNumbers } from "@/hooks/useTagScanner/tagParser"
import { useRfidReader } from "@/hooks/useRfidReader"

const HERD_ONBOARDING_KEY = "herd_list_onboarding_seen"

const PAGE_SIZE = 50

export const HerdListScreen: FC<MainTabScreenProps<"HerdList">> = ({ navigation }) => {
  const { t } = useTranslation()
  const { themed, theme } = useAppTheme()
  const [search, setSearch] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE)
  // DB-level paginated query handles search + breed/sex/status + sort
  const { animals, isLoading, hasMore, loadMore } = useAnimalsQuery(filters, search, PAGE_SIZE)
  const [showScanModal, setShowScanModal] = useState(false)
  const [torch, setTorch] = useState<"off" | "on">("off")

  const cameraRef = useRef<any>(null)
  const device = useCameraDevice("back")
  const { hasPermission, requestPermission } = useCameraPermission()

  const {
    hasRfidHardware,
    isInitialized: isRfidInitialized,
    isScanning: isRfidScanning,
    scannedTag,
    initialize: initializeRfid,
    clearScannedTag,
  } = useRfidReader()

  // Initialize RFID reader once when hardware is present
  useEffect(() => {
    if (hasRfidHardware && !isRfidInitialized) {
      initializeRfid()
    }
  }, [hasRfidHardware, isRfidInitialized, initializeRfid])

  // Check if first time visiting and show onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem(HERD_ONBOARDING_KEY)
        if (!seen) {
          setShowOnboarding(true)
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error)
      }
    }

    checkOnboarding()
  }, [])

  // Check network status
  useEffect(() => {
    const checkNetwork = async () => {
      const networkState = await Network.getNetworkStateAsync()
      setIsOffline(!networkState.isConnected || !networkState.isInternetReachable)
    }

    checkNetwork()
    const interval = setInterval(checkNetwork, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const handleAddAnimal = useCallback(() => {
    navigation.navigate("AnimalForm", { mode: "create" })
  }, [navigation])

  const handleBulkAdd = useCallback(() => {
    navigation.navigate("BulkAnimalAdd")
  }, [navigation])

  const handleAnimalPress = useCallback((animal: Animal) => {
    navigation.navigate("AnimalDetail", { animalId: animal.id })
  }, [navigation])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await syncDatabase()
    } catch (error) {
      console.error("Failed to sync on refresh:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  const handleDismissOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(HERD_ONBOARDING_KEY, "true")
      setShowOnboarding(false)
      setOnboardingStep(0)
    } catch (error) {
      console.error("Failed to save onboarding status:", error)
    }
  }, [])

  const handleNextStep = useCallback(() => {
    if (onboardingStep < 2) {
      setOnboardingStep(onboardingStep + 1)
    } else {
      handleDismissOnboarding()
    }
  }, [onboardingStep, handleDismissOnboarding])

  const handlePrevStep = useCallback(() => {
    if (onboardingStep > 0) {
      setOnboardingStep(onboardingStep - 1)
    }
  }, [onboardingStep])

  const handleOpenFilters = useCallback(() => {
    setShowFilterModal(true)
  }, [])

  const handleCloseFilters = useCallback(() => {
    setShowFilterModal(false)
  }, [])

  const handleApplyFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  const handleOpenScan = useCallback(async () => {
    if (!hasPermission) {
      await requestPermission()
    }
    setShowScanModal(true)
  }, [hasPermission, requestPermission])

  const handleCloseScan = useCallback(() => {
    setShowScanModal(false)
    setTorch("off")
  }, [])

  const handleToggleTorch = useCallback(() => {
    setTorch(prev => prev === "off" ? "on" : "off")
  }, [])

  const handleOCRResult = useCallback((data: OCRText) => {
    if (!data || !data.blocks || data.blocks.length === 0) {
      return
    }

    // Extract tags from OCR results
    const ocrResults = data.blocks.map(block => ({
      text: block.blockText,
      confidence: 0.8,
      boundingBox: block.blockFrame ? {
        x: block.blockFrame.x,
        y: block.blockFrame.y,
        width: block.blockFrame.width,
        height: block.blockFrame.height,
      } : undefined,
    }))

    const tagResults = extractTagNumbers(ocrResults)

    if (tagResults.length > 0) {
      const bestTag = tagResults.sort((a, b) => b.confidence - a.confidence)[0]

      // Update search field and close modal
      setSearch(bestTag.tagNumber)
      setShowScanModal(false)
      setTorch("off")
    }
  }, [])

  // When an RFID tag is scanned, drop the EPC into the search field (which
  // matches rfid_tag). The reader stays ready for the next pull of the trigger.
  useEffect(() => {
    if (scannedTag) {
      setSearch(scannedTag.epc)
      clearScannedTag()
    }
  }, [scannedTag, clearScannedTag])

  // Clear the search box each time a fresh scan begins, so the previous tag's
  // result doesn't linger — including when the new scan finds no match.
  useEffect(() => {
    if (isRfidScanning) {
      setSearch("")
    }
  }, [isRfidScanning])

  // Apply the remaining in-memory/computed filters (age, tag, parent).
  // Cheap filters + sort were already pushed into the DB query above.
  const filtered = useComputedAnimalFilters(animals, filters)

  const handleLoadMore = useCallback(() => {
    if (!hasMore) return
    loadMore()
  }, [hasMore, loadMore])

  // Count active filters (excluding sort, since sort is always set to something)
  const activeFilterCount =
    filters.breeds.length +
    filters.sexes.length +
    filters.statuses.length +
    (filters.ageFrom !== null || filters.ageTo !== null ? 1 : 0) +
    (filters.tagSearch !== "" ? 1 : 0) +
    (filters.parentAnimalId !== null ? 1 : 0)

  const hasActiveFilters = activeFilterCount > 0 ||
    filters.sortBy !== "visualTag" ||
    filters.sortDirection !== "asc"

  // Distinguish "no animals in herd at all" from "no results for current filter/search"
  const isHerdEmpty = animals.length === 0 && !search.trim() && activeFilterCount === 0

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
              <Text preset="bold" text={item.visualTag || item.rfidTag} />
              <View style={[$statusBadge, { backgroundColor: statusColor + "22" }]}>
                <Text text={item.status} size="xxs" style={{ color: statusColor }} />
              </View>
            </View>
            <View style={themed($animalCardBody)}>
              <Text size="xs" text={t("herdListScreen.breedAndSex", { breed: item.breed, sex: item.sex })} style={themed($dimText)} />
              {item.tagsList.length > 0 && (
                <View style={themed($tagsContainer)}>
                  {item.tagsList.slice(0, 2).map((tag) => (
                    <View key={tag} style={themed($tag)}>
                      <Text size="xxs" text={tag} style={themed($tagText)} />
                    </View>
                  ))}
                  {item.tagsList.length > 2 && (
                    <Text size="xxs" text={`+${item.tagsList.length - 2}`} style={themed($dimText)} />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    )
  }, [themed, theme, handleAnimalPress, t])

  const renderFooter = useCallback(() => {
    if (!hasMore) return null

    return (
      <View style={themed($footerContainer)}>
        <Button
          text={t("herdListScreen.loadMore", { defaultValue: "Load more" })}
          preset="default"
          onPress={handleLoadMore}
          style={themed($loadMoreButton)}
        />
      </View>
    )
  }, [hasMore, themed, t, handleLoadMore])

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <AppHeader title={t("herdListScreen.title")} showSettings={true} />

      {/* Offline Indicator */}
      {isOffline && (
        <View style={themed($offlineBanner)}>
          <MaterialCommunityIcons name="wifi-off" size={16} color="#FFF" />
          <Text text="You're offline" size="xs" style={themed($offlineText)} />
        </View>
      )}

      <View style={themed($header)}>
        <View style={themed($headerButtons)}>
          <Pressable onPress={handleOpenScan} style={themed($scanButton)}>
            <MaterialCommunityIcons name="barcode-scan" size={18} color={theme.colors.tint} />
          </Pressable>
          <Pressable onPress={handleOpenFilters} style={themed($filterButton)}>
            <MaterialCommunityIcons name="filter-variant" size={18} color={hasActiveFilters ? theme.colors.palette.primary500 : theme.colors.tint} />
            {hasActiveFilters && (
              <View style={themed($filterBadge)}>
                <Text text={activeFilterCount.toString()} size="xxs" style={themed($filterBadgeText)} />
              </View>
            )}
          </Pressable>
          <Pressable onPress={handleBulkAdd} style={themed($bulkAddButton)}>
            <MaterialCommunityIcons name="lightning-bolt" size={18} color={theme.colors.tint} />
          </Pressable>
          <Button text={t("herdListScreen.addButton")} preset="filled" onPress={handleAddAnimal} style={themed($addButton)} />
        </View>
      </View>

      {!isHerdEmpty && (
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder={t("herdListScreen.searchPlaceholder")}
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={themed($searchField)}
        />
      )}

      {!isHerdEmpty ? (
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
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.tint}
                colors={[theme.colors.tint]}
              />
            }
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={20}
            windowSize={10}
          />
        </>
      ) : (
        <View style={themed($emptyContainer)}>
          {isLoading && (
            <Text preset="heading" text={t("herdListScreen.empty.loading")} style={themed($emptyHeading)} />
          )}
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

      {/* RFID reader — always ready. Pull the trigger to scan a tag into search. */}
      {hasRfidHardware && (
        <View style={themed($rfidBar)}>
          {isRfidScanning ? (
            <>
              <ActivityIndicator size="small" color={theme.colors.tint} />
              <Text
                text={t("herdListScreen.rfidScan.scanning")}
                size="md"
                style={themed($rfidBarScanningText)}
              />
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="access-point" size={22} color={theme.colors.tint} />
              <Text
                text={t("herdListScreen.rfidScan.instruction")}
                size="md"
                style={themed($rfidBarText)}
              />
            </>
          )}
        </View>
      )}

      {/* Onboarding Wizard Modal */}
      <Modal
        visible={showOnboarding}
        transparent
        animationType="fade"
        onRequestClose={handleDismissOnboarding}
      >
        <View style={themed($onboardingOverlay)}>
          <View style={themed($onboardingModal)}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Welcome Header */}
              <View style={themed($onboardingHeader)}>
                <View style={themed($welcomeIconContainer)}>
                  <MaterialCommunityIcons name="hand-wave-outline" size={32} color={theme.colors.palette.primary500} />
                </View>
                <Text preset="heading" text="Welcome to Your Herd!" size="xl" style={themed($onboardingTitle)} />
                <Text text="Let's quickly show you around" size="sm" style={themed($onboardingSubtitle)} />
              </View>

              {/* Step Indicator */}
              <View style={themed($stepIndicator)}>
                {[0, 1, 2].map((step) => (
                  <View
                    key={step}
                    style={[
                      themed($stepDot),
                      step === onboardingStep && themed($stepDotActive)
                    ]}
                  />
                ))}
              </View>

              {/* Step 0: Adding Animals */}
              {onboardingStep === 0 && (
                <View style={themed($stepContent)}>
                  <View style={themed($onboardingStepIcon)}>
                    <MaterialCommunityIcons name="plus-circle" size={48} color={theme.colors.palette.primary500} />
                  </View>
                  <Text preset="bold" text="Add Your First Animal" size="lg" style={themed($stepTitle)} />
                  <Text
                    text="Tap the 'Add Animal' button to register a new animal. You can add details like tags, breed, photos, and more!"
                    size="md"
                    style={themed($stepDescription)}
                  />
                  <View style={themed($tipBox)}>
                    <MaterialCommunityIcons name="lightbulb-on" size={20} color={theme.colors.palette.accent500} />
                    <Text text="Tip: Use the camera icon to scan visual tag numbers automatically!" size="xs" style={themed($tipText)} />
                  </View>
                </View>
              )}

              {/* Step 1: Bulk Add */}
              {onboardingStep === 1 && (
                <View style={themed($stepContent)}>
                  <View style={themed($onboardingStepIcon)}>
                    <MaterialCommunityIcons name="lightning-bolt" size={48} color={theme.colors.palette.accent500} />
                  </View>
                  <Text preset="bold" text="Bulk Add Animals" size="lg" style={themed($stepTitle)} />
                  <Text
                    text="The lightning bolt button lets you quickly add multiple animals at once - perfect for registering a whole batch!"
                    size="md"
                    style={themed($stepDescription)}
                  />
                  <View style={themed($tipBox)}>
                    <MaterialCommunityIcons name="lightbulb-on" size={20} color={theme.colors.palette.accent500} />
                    <Text text="Tip: Great for when you're bringing in new livestock!" size="xs" style={themed($tipText)} />
                  </View>
                </View>
              )}

              {/* Step 2: Pull to Refresh */}
              {onboardingStep === 2 && (
                <View style={themed($stepContent)}>
                  <View style={themed($onboardingStepIcon)}>
                    <MaterialCommunityIcons name="refresh" size={48} color={theme.colors.tint} />
                  </View>
                  <Text preset="bold" text="Pull to Refresh" size="lg" style={themed($stepTitle)} />
                  <Text
                    text="Pull down on the list to sync your latest data from the server. This keeps everything up-to-date across all your devices!"
                    size="md"
                    style={themed($stepDescription)}
                  />
                  <View style={themed($tipBox)}>
                    <MaterialCommunityIcons name="lightbulb-on" size={20} color={theme.colors.palette.accent500} />
                    <Text text="Tip: The app syncs automatically, but you can always refresh manually!" size="xs" style={themed($tipText)} />
                  </View>
                </View>
              )}

              {/* Navigation Buttons */}
              <View style={themed($onboardingButtons)}>
                {onboardingStep > 0 && (
                  <Button
                    text="Back"
                    preset="default"
                    onPress={handlePrevStep}
                    style={themed($backButton)}
                  />
                )}
                <Button
                  text={onboardingStep === 2 ? "Got it!" : "Next"}
                  preset="reversed"
                  onPress={handleNextStep}
                  style={themed($nextButton)}
                />
              </View>
            </ScrollView>

            {/* Skip Button — pinned outside ScrollView so it never gets clipped */}
            <Pressable onPress={handleDismissOnboarding} style={themed($skipButton)}>
              <Text text="Skip tour" size="sm" style={themed($skipText)} />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Scan Modal */}
      <Modal
        visible={showScanModal}
        transparent={false}
        animationType="slide"
        onRequestClose={handleCloseScan}
      >
        <View style={themed($scanModalContainer)}>
          {device && hasPermission ? (
            <>
              <Camera
                ref={cameraRef}
                style={themed($camera)}
                device={device}
                isActive={showScanModal}
                photo={false}
                video={false}
                audio={false}
                torch={torch}
                onOcrData={handleOCRResult}
              />

              {/* Overlay with instructions */}
              <View style={themed($scanOverlay)}>
                <View style={themed($scanHeader)}>
                  <Pressable onPress={handleCloseScan} style={themed($closeButton)}>
                    <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                  </Pressable>
                  <Pressable onPress={handleToggleTorch} style={themed($torchButton)}>
                    <MaterialCommunityIcons
                      name={torch === "on" ? "flashlight" : "flashlight-off"}
                      size={24}
                      color="#FFF"
                    />
                  </Pressable>
                </View>

                <View style={themed($scanInstructions)}>
                  <MaterialCommunityIcons name="barcode-scan" size={48} color="#FFF" />
                  <Text
                    text="Point camera at ear tag"
                    size="lg"
                    style={themed($scanInstructionText)}
                  />
                  <Text
                    text="The tag number will be automatically detected"
                    size="sm"
                    style={themed($scanHintText)}
                  />
                </View>

                {/* Scanning frame */}
                <View style={themed($scanFrame)} />
              </View>
            </>
          ) : (
            <View style={themed($permissionContainer)}>
              <MaterialCommunityIcons name="camera-off" size={64} color={theme.colors.textDim} />
              <Text text="Camera permission required" preset="heading" style={themed($permissionText)} />
              <Button text="Grant Permission" onPress={requestPermission} style={themed($permissionButton)} />
              <Button text="Cancel" preset="default" onPress={handleCloseScan} style={themed($permissionButton)} />
            </View>
          )}
        </View>
      </Modal>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={handleCloseFilters}
        onApply={handleApplyFilters}
        initialFilters={filters}
        animals={animals}
        currentSpecies="cattle"
      />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.sm,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "flex-end",
  alignItems: "center",
  marginTop: spacing.xs,
  marginBottom: spacing.xs,
  paddingHorizontal: spacing.sm,
})

const $headerButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $filterButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.tint,
  borderRadius: 8,
  width: 36,
  height: 36,
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
})

const $filterBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: -4,
  right: -4,
  backgroundColor: colors.palette.primary500,
  borderRadius: 8,
  minWidth: 16,
  height: 16,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 4,
})

const $filterBadgeText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "700",
  fontSize: 10,
})

const $bulkAddButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.tint,
  borderRadius: 8,
  width: 36,
  height: 36,
  justifyContent: "center",
  alignItems: "center",
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
  paddingBottom: spacing.lg,
})

const $animalCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.sm,
  marginBottom: spacing.xs,
  shadowColor: "#000",
  shadowOpacity: 0.04,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
})

const $animalCardRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})

const $animalPhoto: ImageStyle = {
  width: 50,
  height: 50,
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
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-end",
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $tagBadge: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral600,
  backgroundColor: colors.palette.neutral200,
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 4,
  overflow: "hidden",
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xl,
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
  borderRadius: 8,
  padding: spacing.sm,
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.xs,
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

const $tagsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xxs,
  marginTop: spacing.xxs,
})

const $tag: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
  borderRadius: 4,
  borderWidth: 0.5,
  borderColor: colors.palette.primary300,
})

const $tagText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary700,
  fontWeight: "600",
})

const $offlineBanner: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: "#6B7280",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.xs,
  gap: spacing.xs,
})

const $offlineText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "600",
})

const $onboardingOverlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
})

const $onboardingModal: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 20,
  padding: spacing.lg,
  width: "100%",
  maxWidth: 400,
  maxHeight: "80%",
})

const $onboardingHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginBottom: spacing.lg,
})

const $welcomeIconContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: colors.palette.primary100,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: spacing.sm,
})

const $onboardingTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $onboardingSubtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  textAlign: "center",
  color: colors.textDim,
})

const $stepIndicator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "center",
  gap: spacing.xs,
  marginBottom: spacing.lg,
})

const $stepDot: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.palette.neutral300,
})

const $stepDotActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  width: 24,
})

const $stepContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginBottom: spacing.lg,
})

const $onboardingStepIcon: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: colors.palette.neutral100,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: spacing.md,
})

const $stepTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.sm,
})

const $stepDescription: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  textAlign: "center",
  color: colors.textDim,
  lineHeight: 22,
  marginBottom: spacing.md,
})

const $tipBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.accent100,
  borderRadius: 12,
  padding: spacing.sm,
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.xs,
})

const $tipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  color: colors.palette.accent700,
  lineHeight: 18,
})

const $onboardingButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginBottom: spacing.sm,
})

const $backButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $nextButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $skipButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.sm,
})

const $skipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $footerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.md,
  alignItems: "center",
  justifyContent: "center",
})

const $footerText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
})

const $loadMoreButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minWidth: 200,
  paddingHorizontal: spacing.md,
})

const $scanButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.tint,
  borderRadius: 8,
  width: 36,
  height: 36,
  justifyContent: "center",
  alignItems: "center",
})

const $scanModalContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "#000",
})

const $camera: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $scanOverlay: ThemedStyle<ViewStyle> = () => ({
  ...StyleSheet.absoluteFillObject,
  justifyContent: "space-between",
})

const $scanHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  padding: spacing.md,
  paddingTop: spacing.xl,
})

const $closeButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
})

const $torchButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
})

const $scanInstructions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  padding: spacing.lg,
})

const $scanInstructionText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  textAlign: "center",
  fontWeight: "700",
  marginTop: 16,
})

const $scanHintText: ThemedStyle<TextStyle> = () => ({
  color: "rgba(255,255,255,0.7)",
  textAlign: "center",
  marginTop: 8,
})

const $scanFrame: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  top: "40%",
  left: "10%",
  right: "10%",
  height: 200,
  borderWidth: 2,
  borderColor: "#FFF",
  borderRadius: 12,
  backgroundColor: "transparent",
})

const $permissionContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
  backgroundColor: "#000",
})

const $permissionText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  color: "#FFF",
  textAlign: "center",
  marginTop: spacing.md,
  marginBottom: spacing.lg,
})

const $permissionButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minWidth: 200,
  marginTop: spacing.sm,
})

const $rfidBar: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
  backgroundColor: colors.palette.primary100,
  borderTopWidth: 1,
  borderColor: colors.tint,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
})

const $rfidBarText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $rfidBarScanningText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "700",
})
