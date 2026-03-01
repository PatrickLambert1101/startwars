import { FC, useCallback, useState } from "react"
import { Platform, Pressable, View, ViewStyle, TextStyle } from "react-native"
import { format, parse, isValid } from "date-fns"

import { Text } from "./Text"
import { TextField } from "./TextField"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface DateFieldProps {
  label: string
  value: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  containerStyle?: ViewStyle
}

/**
 * Simple date field — user types DD/MM/YYYY.
 * Parses on blur and shows formatted date when valid.
 * No external date picker dependency needed.
 */
export const DateField: FC<DateFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  containerStyle,
}) => {
  const { themed } = useAppTheme()
  const [textValue, setTextValue] = useState(value ? format(value, "dd/MM/yyyy") : "")
  const [error, setError] = useState("")

  const handleBlur = useCallback(() => {
    if (!textValue.trim()) {
      onChange(null)
      setError("")
      return
    }

    // Try parsing common date formats
    const formats = ["dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "dd-MM-yyyy"]
    let parsed: Date | null = null

    for (const fmt of formats) {
      const result = parse(textValue.trim(), fmt, new Date())
      if (isValid(result)) {
        parsed = result
        break
      }
    }

    if (parsed) {
      onChange(parsed)
      setTextValue(format(parsed, "dd/MM/yyyy"))
      setError("")
    } else {
      setError("Invalid date — use DD/MM/YYYY")
    }
  }, [textValue, onChange])

  const handleChangeText = useCallback((text: string) => {
    setTextValue(text)
    setError("")
  }, [])

  // Auto-insert slashes for convenience
  const handleAutoFormat = useCallback((text: string) => {
    // If user typed 2 digits or 5 chars (dd/mm), auto-add slash
    const cleaned = text.replace(/[^\d/]/g, "")
    if (cleaned.length === 2 && !cleaned.includes("/")) {
      setTextValue(cleaned + "/")
    } else if (cleaned.length === 5 && cleaned.split("/").length === 2) {
      setTextValue(cleaned + "/")
    } else {
      setTextValue(cleaned)
    }
    setError("")
  }, [])

  return (
    <TextField
      label={label}
      value={textValue}
      onChangeText={handleAutoFormat}
      onBlur={handleBlur}
      placeholder={placeholder}
      keyboardType="numeric"
      helper={error}
      status={error ? "error" : undefined}
      containerStyle={containerStyle}
    />
  )
}
