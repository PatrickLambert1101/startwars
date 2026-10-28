import { FC, useCallback, useEffect, useState } from "react"
import { ViewStyle } from "react-native"
import { format, parse, isValid } from "date-fns"

import { TextField } from "./TextField"

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
  const [textValue, setTextValue] = useState(value ? format(value, "dd/MM/yyyy") : "")
  const [error, setError] = useState("")

  useEffect(() => {
    setTextValue(value ? format(value, "dd/MM/yyyy") : "")
  }, [value])

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
