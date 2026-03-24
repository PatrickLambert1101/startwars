import { useEffect, useState, useRef } from "react"
import { View, Text, StyleSheet, Animated } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useSyncContext } from "@/context/SyncContext"
import { useAppTheme } from "@/theme/context"
import type { SyncStage } from "@/hooks/useSync"

/**
 * SyncIndicator - Shows a beautiful progress bar at the top when syncing
 */
export function SyncIndicator() {
  const { status, progress, stage } = useSyncContext()
  const { theme } = useAppTheme()
  const insets = useSafeAreaInsets()
  const [isVisible, setIsVisible] = useState(false)
  const [slideAnim] = useState(new Animated.Value(-100))
  const progressAnim = useRef(new Animated.Value(0)).current

  // Slide animation
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
      // Slide up after showing complete state
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

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [progress, progressAnim])

  if (!isVisible && status !== "syncing") return null

  const getStageText = (stage: SyncStage | null): string => {
    switch (stage) {
      case "pulling":
        return "Syncing from server..."
      case "processing":
        return "Processing changes..."
      case "pushing":
        return "Uploading changes..."
      case "complete":
        return "Sync complete!"
      default:
        return "Syncing..."
    }
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  })

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
        <Text style={[styles.text, { color: theme.colors.palette.neutral100 }]}>
          {getStageText(stage)}
        </Text>
        <Text style={[styles.percentage, { color: theme.colors.palette.neutral100 }]}>
          {Math.round(progress)}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: theme.colors.palette.secondary300 }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
              backgroundColor: theme.colors.palette.accent500,
            },
          ]}
        />
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
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  percentage: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1.5,
  },
})
