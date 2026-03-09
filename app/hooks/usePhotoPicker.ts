import { useState } from "react"
import * as ImagePicker from "expo-image-picker"
import { Alert } from "react-native"
import type { PhotoWithMetadata } from "@/types/Photo"

export interface UsePhotoPickerOptions {
  maxPhotos?: number
  onPhotosSelected?: (photos: PhotoWithMetadata[]) => void
}

export interface UsePhotoPickerResult {
  photos: PhotoWithMetadata[]
  pickFromCamera: () => Promise<void>
  pickFromGallery: () => Promise<void>
  removePhoto: (index: number) => void
  isLoading: boolean
}

/**
 * Hook for picking photos from camera or gallery
 */
export function usePhotoPicker(options: UsePhotoPickerOptions = {}): UsePhotoPickerResult {
  const { maxPhotos = 3, onPhotosSelected } = options
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const pickFromCamera = async () => {
    try {
      // Request camera permission
      const permission = await ImagePicker.requestCameraPermissionsAsync()

      if (!permission.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera access in your device settings to take photos.",
          [{ text: "OK" }],
        )
        return
      }

      if (photos.length >= maxPhotos) {
        Alert.alert("Photo Limit Reached", `You can only add up to ${maxPhotos} photos.`, [{ text: "OK" }])
        return
      }

      setIsLoading(true)

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const newPhoto: PhotoWithMetadata = {
          uri: result.assets[0].uri,
          localUri: result.assets[0].uri,
          createdAt: Date.now(),
          uploadStatus: "pending",
        }

        const updatedPhotos = [...photos, newPhoto]
        setPhotos(updatedPhotos)
        onPhotosSelected?.(updatedPhotos)
      }
    } catch (error) {
      console.error("Error taking photo:", error)
      Alert.alert("Error", "Failed to take photo. Please try again.", [{ text: "OK" }])
    } finally {
      setIsLoading(false)
    }
  }

  const pickFromGallery = async () => {
    try {
      // Request media library permission
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert(
          "Photo Library Permission Required",
          "Please enable photo library access in your device settings.",
          [{ text: "OK" }],
        )
        return
      }

      const remainingSlots = maxPhotos - photos.length

      if (remainingSlots <= 0) {
        Alert.alert("Photo Limit Reached", `You can only add up to ${maxPhotos} photos.`, [{ text: "OK" }])
        return
      }

      setIsLoading(false)

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
      })

      if (!result.canceled && result.assets.length > 0) {
        const newPhotos: PhotoWithMetadata[] = result.assets.map((asset) => ({
          uri: asset.uri,
          localUri: asset.uri,
          createdAt: Date.now(),
          uploadStatus: "pending",
        }))

        const updatedPhotos = [...photos, ...newPhotos]
        setPhotos(updatedPhotos)
        onPhotosSelected?.(updatedPhotos)
      }
    } catch (error) {
      console.error("Error picking photos:", error)
      Alert.alert("Error", "Failed to select photos. Please try again.", [{ text: "OK" }])
    } finally {
      setIsLoading(false)
    }
  }

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index)
    setPhotos(updatedPhotos)
    onPhotosSelected?.(updatedPhotos)
  }

  return {
    photos,
    pickFromCamera,
    pickFromGallery,
    removePhoto,
    isLoading,
  }
}
