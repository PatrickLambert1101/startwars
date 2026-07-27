import { useEffect, useRef, useState } from "react"
import { Animated, StyleSheet, View } from "react-native"
import * as Network from "expo-network"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useAppTheme } from "@/theme/context"

import { Text } from "./Text"

const POLL_INTERVAL = 5_000 // expo-network has no event listener; poll every 5s
const BACK_ONLINE_DURATION = 2_500 // how long the "back online" bar stays up

type BannerState = "hidden" | "offline" | "online"

/**
 * NetworkBanner - Google-style connectivity bar pinned to the bottom.
 *
 * Shows a persistent "You're offline" bar while there is no connection, and a
 * transient "Back online" bar when the connection is restored. Mounted once,
 * globally, so it overlays every screen.
 */
export function NetworkBanner() {
  const { t } = useTranslation()
  const { theme } = useAppTheme()
  const insets = useSafeAreaInsets()
  const [state, setState] = useState<BannerState>("hidden")
  const slideAnim = useRef(new Animated.Value(100)).current

  // Track connectivity by polling expo-network (same approach as AutoSync).
  useEffect(() => {
    let mounted = true
    // null = unknown until first check, so we don't flash "back online" on boot.
    let wasOnline: boolean | null = null
    let onlineTimer: ReturnType<typeof setTimeout> | null = null

    const check = async () => {
      try {
        const netState = await Network.getNetworkStateAsync()
        const isOnline = Boolean(netState.isConnected && netState.isInternetReachable)
        if (!mounted) return

        if (!isOnline) {
          if (onlineTimer) {
            clearTimeout(onlineTimer)
            onlineTimer = null
          }
          setState("offline")
        } else if (wasOnline === false) {
          // Just transitioned offline -> online: show the transient bar.
          setState("online")
          if (onlineTimer) clearTimeout(onlineTimer)
          onlineTimer = setTimeout(() => {
            if (mounted) setState("hidden")
          }, BACK_ONLINE_DURATION)
        } else {
          // Online and was already online (or first check): nothing to show.
          if (!onlineTimer) setState("hidden")
        }

        wasOnline = isOnline
      } catch {
        // Ignore transient errors; next poll will re-evaluate.
      }
    }

    check()
    const interval = setInterval(check, POLL_INTERVAL)

    return () => {
      mounted = false
      clearInterval(interval)
      if (onlineTimer) clearTimeout(onlineTimer)
    }
  }, [])

  // Slide the bar in/out as state changes.
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state === "hidden" ? 100 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start()
  }, [state, slideAnim])

  if (state === "hidden") return null

  const isOffline = state === "offline"
  // Offline uses the theme's semantic text/background pair so contrast holds in
  // both light and dark mode; "back online" uses the brand green.
  const backgroundColor = isOffline ? theme.colors.text : theme.colors.palette.primary500
  const foregroundColor = isOffline ? theme.colors.background : theme.colors.palette.neutral100

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={isOffline ? "wifi-off" : "wifi-check"}
          size={16}
          color={foregroundColor}
        />
        <Text
          text={isOffline ? t("networkBanner.offline") : t("networkBanner.backOnline")}
          style={[styles.text, { color: foregroundColor }]}
        />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    elevation: 6,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    position: "absolute",
    right: 0,
    zIndex: 9999,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
})
