import { PropsWithChildren, useState } from "react"
import { ScrollView, ViewStyle } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAuth } from "@/context/AuthContext"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { getContactPhone } from "@/utils/contactPhone"
import { loadString, saveString } from "@/utils/storage"

import { ContactPhoneForm } from "./ContactPhoneForm"

/** Mounted with the user ID as its key, so one user's dismissal never hides another's prompt. */
export function ContactPhoneGate({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const dismissalKey = `contact-phone-dismissed:${user?.id}`
  const [dismissed, setDismissed] = useState(() => loadString(dismissalKey) === "true")

  if (!user || getContactPhone(user) || dismissed) return <>{children}</>

  return (
    <SafeAreaView style={[themed($safeArea), { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={themed($container)} keyboardShouldPersistTaps="handled">
        <ContactPhoneForm
          onSkip={() => {
            saveString(dismissalKey, "true")
            setDismissed(true)
          }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const $safeArea: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  justifyContent: "center",
  padding: spacing.lg,
})
