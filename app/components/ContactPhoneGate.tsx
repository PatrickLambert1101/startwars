import { PropsWithChildren, useState } from "react"
import { ViewStyle } from "react-native"

import { Screen } from "@/components/Screen"
import { useAuth } from "@/context/AuthContext"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { getContactPhone } from "@/utils/contactPhone"
import { loadString, saveString } from "@/utils/storage"

import { ContactPhoneForm } from "./ContactPhoneForm"

/** Mounted with the user ID as its key, so one user's dismissal never hides another's prompt. */
export function ContactPhoneGate({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const { themed } = useAppTheme()
  const dismissalKey = `contact-phone-dismissed:${user?.id}`
  const [dismissed, setDismissed] = useState(() => loadString(dismissalKey) === "true")

  if (!user || getContactPhone(user) || dismissed) return <>{children}</>

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={themed($container)}
    >
      <ContactPhoneForm
        onSkip={() => {
          saveString(dismissalKey, "true")
          setDismissed(true)
        }}
      />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  justifyContent: "center",
  padding: spacing.lg,
})
