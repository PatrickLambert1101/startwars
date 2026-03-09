import React, { FC, useState } from "react"
import { View, Image, Pressable, ViewStyle, ImageStyle, ScrollView, Modal } from "react-native"
import { Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { parsePhotos } from "@/types/Photo"

export interface PhotoGalleryProps {
  photosJson: string | null
  style?: ViewStyle
}

/**
 * Read-only photo gallery component for displaying photos in records
 * Shows small thumbnails that can be tapped to view full-size
 */
export const PhotoGallery: FC<PhotoGalleryProps> = ({ photosJson, style }) => {
  const { themed, theme } = useAppTheme()
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  const photos = parsePhotos(photosJson)

  if (photos.length === 0) {
    return null
  }

  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[themed($gallery), style]}>
        {photos.map((photo, index) => (
          <Pressable key={index} onPress={() => setSelectedPhotoIndex(index)}>
            <Image
              source={{ uri: photo.thumbnailUri || photo.uri }}
              style={themed($thumbnail)}
              resizeMode="cover"
            />
          </Pressable>
        ))}
      </ScrollView>

      {selectedPhoto && (
        <Modal
          visible={selectedPhotoIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPhotoIndex(null)}
        >
          <Pressable style={themed($modalOverlay)} onPress={() => setSelectedPhotoIndex(null)}>
            <View style={themed($modalContent)}>
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={themed($fullImage)}
                resizeMode="contain"
              />
              {selectedPhoto.caption && (
                <View style={[themed($captionContainer), { backgroundColor: theme.colors.background }]}>
                  <Text text={selectedPhoto.caption} size="sm" />
                </View>
              )}
              <Pressable
                style={[themed($closeButton), { backgroundColor: theme.colors.error }]}
                onPress={() => setSelectedPhotoIndex(null)}
              >
                <Text text="✕" style={themed($closeText)} />
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  )
}

const $gallery: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
  marginBottom: spacing.xs,
})

const $thumbnail: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  width: 60,
  height: 60,
  borderRadius: 6,
  marginRight: spacing.xs,
})

const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.9)",
  justifyContent: "center",
  alignItems: "center",
})

const $modalContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  width: "100%",
  justifyContent: "center",
  alignItems: "center",
})

const $fullImage: ThemedStyle<ImageStyle> = () => ({
  width: "90%",
  height: "80%",
})

const $captionContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  bottom: 80,
  left: 20,
  right: 20,
  padding: spacing.sm,
  borderRadius: 8,
})

const $closeButton: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  top: 50,
  right: 20,
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
})

const $closeText: ThemedStyle<any> = () => ({
  color: "#FFFFFF",
  fontSize: 20,
  fontWeight: "bold",
})
