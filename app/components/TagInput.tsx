import { FC, useState } from "react"
import { View, Pressable, ViewStyle, TextStyle, TextInput } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Text } from "./Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  style?: ViewStyle
  suggestions?: string[]
}

const DEFAULT_SUGGESTIONS = [
  "Breeding Stock",
  "For Sale",
  "Medical Watch",
  "Quarantine",
  "High Value",
  "Show Animal",
  "Pregnant",
  "Weaning",
]

export const TagInput: FC<TagInputProps> = ({
  tags,
  onTagsChange,
  placeholder = "Add tags...",
  style,
  suggestions = DEFAULT_SUGGESTIONS,
}) => {
  const { themed, theme } = useAppTheme()
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag])
    }
    setInputValue("")
    setShowSuggestions(false)
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove))
  }

  const handleSubmit = () => {
    if (inputValue.trim()) {
      addTag(inputValue)
    }
  }

  const filteredSuggestions = suggestions.filter(
    s => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <View style={[themed($container), style]}>
      {/* Selected Tags */}
      {tags.length > 0 && (
        <View style={themed($tagsContainer)}>
          {tags.map((tag) => (
            <View key={tag} style={themed($tag)}>
              <Text text={tag} size="xs" style={themed($tagText)} />
              <Pressable onPress={() => removeTag(tag)} style={themed($tagRemove)}>
                <MaterialCommunityIcons name="close" size={14} color={theme.colors.palette.primary700} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Input */}
      <TextInput
        value={inputValue}
        onChangeText={setInputValue}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onSubmitEditing={handleSubmit}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textDim}
        style={themed($input)}
        returnKeyType="done"
      />

      {/* Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <View style={themed($suggestionsContainer)}>
          {filteredSuggestions.map((suggestion) => (
            <Pressable
              key={suggestion}
              onPress={() => addTag(suggestion)}
              style={themed($suggestion)}
            >
              <MaterialCommunityIcons name="tag-outline" size={16} color={theme.colors.palette.primary500} />
              <Text text={suggestion} size="sm" style={themed($suggestionText)} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = () => ({
  position: "relative",
})

const $tagsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  marginBottom: spacing.xs,
})

const $tag: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.palette.primary100,
  borderRadius: 16,
  paddingVertical: spacing.xxs,
  paddingLeft: spacing.sm,
  paddingRight: spacing.xs,
  borderWidth: 1,
  borderColor: colors.palette.primary300,
  gap: spacing.xxs,
})

const $tagText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary700,
  fontWeight: "600",
})

const $tagRemove: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xxs,
})

const $input: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.sm,
  fontSize: 14,
  color: colors.text,
  backgroundColor: colors.background,
})

const $suggestionsContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  marginTop: spacing.xxs,
  maxHeight: 200,
  zIndex: 1000,
  elevation: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
})

const $suggestion: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.sm,
  gap: spacing.xs,
})

const $suggestionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})
