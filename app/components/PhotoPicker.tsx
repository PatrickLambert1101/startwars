import React, { FC, useState } from "react"
import { View, Image, Pressable, ViewStyle, ImageStyle, TextStyle, ScrollView, ActivityIndicator } from "react-native"
import { Text, Button, Icon } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { usePhotoPicker } from "@/hooks/usePhotoPicker"
import type { PhotoWithMetadata } from "@/types/Photo"

export interface PhotoPickerProps {
  photos: PhotoWithMetadata[]
  onPhotosChange: (photos: PhotoWithMetadata[]) => void
  maxPhotos?: number
  label?: string
  style?: ViewStyle
}

/**
 * Inline photo picker component with camera and gallery support
 * Shows small photo thumbnails with remove buttons
 */
export const PhotoPicker: FC<PhotoPickerProps> = ({
  photos: externalPhotos,
  onPhotosChange,
  maxPhotos = 3,
  label = "Photos",
  style,
}) => {
  const { themed, theme } = useAppTheme()
  const [showOptions, setShowOptions] = useState(false)

  const { pickFromCamera, pickFromGallery, isLoading } = usePhotoPicker({
    maxPhotos,
    onPhotosSelected: onPhotosChange,
  })

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = externalPhotos.filter((_, i) => i !== index)
    onPhotosChange(updatedPhotos)
  }

  const handleAddPhoto = async (source: "camera" | "gallery") => {
    setShowOptions(false)
    if (source === "camera") {
      await pickFromCamera()
    } else {
      await pickFromGallery()
    }
  }

  const canAddMore = externalPhotos.length < maxPhotos

  return (
    <View style={[themed($container), style]}>
      <View style={themed($labelRow)}>
        <Text preset="formLabel" text={label} />
        <Text
          text={`${externalPhotos.length}/${maxPhotos}`}
          size="xs"
          style={themed($count)}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={themed($scrollView)}>
        {externalPhotos.map((photo, index) => (
          <View key={index} style={themed($photoCard)}>
            <Image source={{ uri: photo.uri }} style={$photoImage} />
            <Pressable
              style={[themed($removeButton), { backgroundColor: theme.colors.error }]}
              onPress={() => handleRemovePhoto(index)}
            >
              <Icon icon="x" size={14} color="#FFFFFF" />
            </Pressable>
            {photo.uploadStatus === "uploading" && (
              <View style={themed($uploadingOverlay)}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
          </View>
        ))}

        {canAddMore && !showOptions && (
          <Pressable
            style={themed($addButton)}
            onPress={() => setShowOptions(true)}
            disabled={isLoading}
          >
            <Icon icon="plus" size={32} color={theme.colors.tint} />
            <Text text="Add Photo" size="xs" style={themed($addText)} />
          </Pressable>
        )}

        {canAddMore && showOptions && (
          <View style={themed($optionsCard)}>
            <Text text="Add photo from:" size="xs" style={themed($optionsTitle)} />
            <Button
              text="Camera"
              preset="default"
              LeftAccessory={(props) => <Icon icon="camera" {...props} />}
              onPress={() => handleAddPhoto("camera")}
              style={themed($optionButton)}
            />
            <Button
              text="Gallery"
              preset="default"
              LeftAccessory={(props) => <Icon icon="image" {...props} />}
              onPress={() => handleAddPhoto("gallery")}
              style={themed($optionButton)}
            />
            <Button
              text="Cancel"
              preset="default"
              onPress={() => setShowOptions(false)}
              style={themed($optionButton)}
              textStyle={themed($cancelText)}
            />
          </View>
        )}
      </ScrollView>

      {externalPhotos.length === 0 && (
        <Text
          text="No photos yet. Tap + to add photos to document this record."
          size="xs"
          style={themed($emptyText)}
        />
      )}
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $labelRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.xs,
})

const $count: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $scrollView: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $photoCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.sm,
  position: "relative",
  borderRadius: 8,
  overflow: "hidden",
})

const $photoImage: ImageStyle = {
  width: 100,
  height: 100,
  borderRadius: 8,
}

const $removeButton: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  top: 4,
  right: 4,
  width: 24,
  height: 24,
  borderRadius: 12,
  justifyContent: "center",
  alignItems: "center",
})

const $uploadingOverlay: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 8,
})

const $addButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 100,
  height: 100,
  borderRadius: 8,
  borderWidth: 2,
  borderStyle: "dashed",
  borderColor: colors.border,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
  marginRight: spacing.sm,
})

const $addText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginTop: spacing.xxs,
})

const $optionsCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 120,
  borderRadius: 8,
  backgroundColor: colors.palette.neutral100,
  padding: spacing.sm,
  marginRight: spacing.sm,
  justifyContent: "center",
})

const $optionsTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
  fontWeight: "600",
})

const $optionButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xxs,
  minHeight: 36,
})

const $cancelText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontStyle: "italic",
  marginTop: spacing.xs,
})
