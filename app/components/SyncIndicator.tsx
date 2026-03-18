import { useEffect, useState } from "react"
import { View, Text, StyleSheet, Animated, ActivityIndicator } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useSyncContext } from "@/context/SyncContext"
import { useAppTheme } from "@/theme/context"

/**
 * SyncIndicator - Shows a subtle banner at the top of the screen when syncing
 * Similar to YouTube's "You are back online" indicator
 */
export function SyncIndicator() {
  const { status } = useSyncContext()
  const { theme } = useAppTheme()
  const insets = useSafeAreaInsets()
  const [isVisible, setIsVisible] = useState(false)
  const [slideAnim] = useState(new Animated.Value(-100))

  useEffect(() => {
    if (status === "syncing") {
      setIsVisible(true)
      // Slide down
      Animated.spring(slideAnim, {
        toValue: insets.top,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start()
    } else if (status === "idle" && isVisible) {
      // Slide up after a brief delay
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setIsVisible(false)
        })
      }, 1000)
    }
  }, [status, insets.top, isVisible, slideAnim])

  if (!isVisible && status !== "syncing") return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.palette.secondary500,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <ActivityIndicator size="small" color={theme.colors.palette.neutral100} style={styles.spinner} />
        <Text style={[styles.text, { color: theme.colors.palette.neutral100 }]}>
          Syncing...
        </Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
})
