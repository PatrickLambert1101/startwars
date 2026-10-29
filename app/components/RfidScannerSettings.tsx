import { useCallback, useEffect, useState } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { useRfidReader } from "@/hooks/useRfidReader"
import {
  loadRfidReadPower,
  RFID_READ_POWER_DEFAULT_DBM,
  RFID_READ_POWER_MAX_DBM,
  RFID_READ_POWER_MIN_DBM,
  saveRfidReadPower,
} from "@/services/rfidReaderSettings"
import { bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Button } from "./Button"
import { Text } from "./Text"

export function RfidScannerSettings() {
  const { t } = useTranslation()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const { error, hasRfidHardware, initialize, isInitialized, reset, setOutputPower } =
    useRfidReader()
  const [readerPower, setReaderPower] = useState(RFID_READ_POWER_DEFAULT_DBM)
  const [powerSaved, setPowerSaved] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    setReaderPower(loadRfidReadPower())
  }, [])

  useEffect(() => {
    if (hasRfidHardware && !isInitialized && !isResetting) initialize()
  }, [hasRfidHardware, initialize, isInitialized, isResetting])

  const applyPower = useCallback(
    async (power: number) => {
      const savedPower = saveRfidReadPower(power)
      setReaderPower(savedPower)

      const applied = !isInitialized || (await setOutputPower(savedPower))
      if (applied) {
        setPowerSaved(true)
        setTimeout(() => setPowerSaved(false), 1500)
      }
    },
    [isInitialized, setOutputPower],
  )

  const handleReset = useCallback(async () => {
    setIsResetting(true)
    try {
      await reset()
    } finally {
      setIsResetting(false)
    }
  }, [reset])

  if (!hasRfidHardware) return null

  const connected = isInitialized && !isResetting
  const powerScalePercent = Math.round(
    ((readerPower - RFID_READ_POWER_MIN_DBM) /
      (RFID_READ_POWER_MAX_DBM - RFID_READ_POWER_MIN_DBM)) *
      100,
  )

  return (
    <View style={themed($section)}>
      <Text
        preset="formLabel"
        text={t("settingsScreen.sections.rfidScanner")}
        style={themed($sectionLabel)}
      />

      <View style={themed($card)}>
        <View style={themed($statusRow)}>
          <View
            style={[
              themed($statusIcon),
              connected ? themed($statusIconConnected) : themed($statusIconDisconnected),
            ]}
          >
            <MaterialCommunityIcons
              name={connected ? "access-point-check" : "access-point-off"}
              size={22}
              color={connected ? "#576E28" : "#D64220"}
            />
          </View>
          <View style={$statusCopy}>
            <Text
              preset="bold"
              text={
                isResetting
                  ? t("settingsScreen.rfid.resetting")
                  : connected
                    ? t("settingsScreen.rfid.connected")
                    : t("settingsScreen.rfid.notConnected")
              }
              style={connected ? themed($connectedText) : themed($disconnectedText)}
            />
            <Text
              size="xxs"
              text={
                connected
                  ? t("settingsScreen.rfid.connectedHint")
                  : t("settingsScreen.rfid.notConnectedHint")
              }
              style={themed($statusHint)}
            />
          </View>
        </View>

        <Button
          text={
            isResetting
              ? t("settingsScreen.rfid.resetting")
              : connected
                ? t("settingsScreen.rfid.resetButton")
                : t("settingsScreen.rfid.reconnectButton")
          }
          preset="default"
          onPress={handleReset}
          disabled={isResetting}
          style={themed($resetButton)}
          LeftAccessory={({ style }) => (
            <MaterialCommunityIcons name="restart" size={20} color={colors.tint} style={style} />
          )}
        />

        {!connected && error && (
          <Text
            size="xxs"
            text={t("settingsScreen.rfid.connectionError")}
            style={themed($errorText)}
          />
        )}

        <View style={themed($divider)} />
        <Text style={themed($powerLabel)}>{t("settingsScreen.rfid.readerPower")}</Text>
        <View style={themed($powerControl)}>
          <Pressable
            style={themed($powerButton)}
            onPress={() => applyPower(readerPower - 1)}
            disabled={readerPower <= RFID_READ_POWER_MIN_DBM}
          >
            <Text style={themed($powerButtonText)}>-</Text>
          </Pressable>

          <View style={$powerDisplay}>
            <Text style={themed($powerValue)}>{readerPower}</Text>
            <Text style={themed($powerUnit)}>dBm</Text>
          </View>

          <Pressable
            style={themed($powerButton)}
            onPress={() => applyPower(readerPower + 1)}
            disabled={readerPower >= RFID_READ_POWER_MAX_DBM}
          >
            <Text style={themed($powerButtonText)}>+</Text>
          </Pressable>
        </View>

        <View style={themed($barTrack)}>
          <View style={[themed($barFill), { width: `${powerScalePercent}%` }]} />
        </View>

        <View style={themed($presetRow)}>
          {[
            { label: t("settingsScreen.rfid.presets.low"), value: 10 },
            { label: t("settingsScreen.rfid.presets.med"), value: 18 },
            { label: t("settingsScreen.rfid.presets.high"), value: 24 },
            { label: t("settingsScreen.rfid.presets.max"), value: 30 },
          ].map((preset) => (
            <Pressable
              key={preset.label}
              style={[
                themed($presetChip),
                readerPower === preset.value && themed($presetChipActive),
              ]}
              onPress={() => applyPower(preset.value)}
            >
              <Text
                style={[
                  themed($presetChipText),
                  readerPower === preset.value && themed($presetChipTextActive),
                ]}
              >
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {powerSaved && (
          <Text style={themed($savedText)}>
            {t("settingsScreen.rfid.powerSaved", { power: readerPower })}
          </Text>
        )}
        <Text style={themed($rangeHint)}>
          {t("settingsScreen.rfid.rangeHint", {
            min: RFID_READ_POWER_MIN_DBM,
            max: RFID_READ_POWER_MAX_DBM,
          })}
        </Text>
      </View>
    </View>
  )
}

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({ marginBottom: spacing.lg })
const $sectionLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  letterSpacing: 1,
  marginBottom: spacing.xs,
})
const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: bentoRadii.card,
  padding: spacing.md,
})
const $statusRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  flexDirection: "row",
  gap: spacing.sm,
})
const $statusIcon: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  borderRadius: 22,
  height: 44,
  justifyContent: "center",
  width: 44,
})
const $statusIconConnected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
})
const $statusIconDisconnected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.angry100,
})
const $statusCopy: ViewStyle = { flex: 1 }
const $connectedText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
})
const $disconnectedText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error })
const $statusHint: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })
const $resetButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({ marginTop: spacing.sm })
const $errorText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  marginTop: spacing.xs,
  textAlign: "center",
})
const $divider: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.separator,
  height: 1,
  marginVertical: spacing.md,
})
const $powerLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 13,
  fontWeight: "600",
  letterSpacing: 0.5,
  marginBottom: spacing.xs,
  textTransform: "uppercase",
})
const $powerControl: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  flexDirection: "row",
  gap: spacing.md,
  justifyContent: "center",
  marginBottom: spacing.sm,
})
const $powerButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  alignItems: "center",
  backgroundColor: colors.palette.neutral200,
  borderRadius: 24,
  height: 48,
  justifyContent: "center",
  width: 48,
})
const $powerButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 24,
  fontWeight: "700",
  lineHeight: 28,
})
const $powerDisplay: ViewStyle = { alignItems: "center", minWidth: 80 }
const $powerValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 36,
  fontWeight: "800",
  lineHeight: 40,
})
const $powerUnit: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 13,
  fontWeight: "500",
})
const $barTrack: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderRadius: 4,
  height: 8,
  marginBottom: spacing.md,
  overflow: "hidden",
})
const $barFill: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
  borderRadius: 4,
  height: "100%",
})
const $presetRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.sm,
})
const $presetChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  borderColor: colors.palette.neutral300,
  borderRadius: bentoRadii.button,
  borderWidth: 1.5,
  flex: 1,
  paddingVertical: spacing.xs,
})
const $presetChipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
  borderColor: colors.palette.primary500,
})
const $presetChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral500,
  fontSize: 13,
  fontWeight: "600",
})
const $presetChipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
})
const $savedText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.palette.primary500,
  fontSize: 13,
  fontWeight: "600",
  marginBottom: spacing.xs,
  textAlign: "center",
})
const $rangeHint: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  lineHeight: 18,
})
