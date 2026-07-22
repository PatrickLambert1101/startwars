import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import * as Linking from "expo-linking"
import Purchases from "react-native-purchases"
import { supabase } from "@/services/supabase"
import { logAuthOperation, setUserContext, captureException } from "@/services/sentry"
import { loadString, saveString } from "@/utils/storage"

const AUTH_REDIRECT_URL = Linking.createURL("auth-callback")
// Hard-gated behind __DEV__ so it can never be enabled in a release build,
// even if EXPO_PUBLIC_DEV_SKIP_AUTH leaks into the production environment.
const DEV_SKIP_AUTH = __DEV__ && process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === "true"

// App Store / Play review bypass: this email skips the emailed OTP and accepts
// a fixed code instead, then signs in with a password under the hood. The
// account only has access to the Demo Ranch demo organization (see
// scripts/setup-review-account.ts, which must stay in sync with these values).
// Values are injected from EXPO_PUBLIC_* env vars at build time so no credential
// lives in source. If unset, the bypass is disabled (empty email never matches).
const REVIEW_EMAIL = (process.env.EXPO_PUBLIC_REVIEW_EMAIL ?? "").trim().toLowerCase()
const REVIEW_OTP_CODE = process.env.EXPO_PUBLIC_REVIEW_OTP_CODE ?? ""
const REVIEW_PASSWORD = process.env.EXPO_PUBLIC_REVIEW_PASSWORD ?? ""
const isReviewEmail = (email: string) =>
  REVIEW_EMAIL.length > 0 && email.trim().toLowerCase() === REVIEW_EMAIL

export type AuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  session: Session | null
  user: User | null
  authEmail: string
  setAuthEmail: (email: string) => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: string | null; success?: boolean }>
  signInWithOTP: (email: string) => Promise<{ error: string | null; success?: boolean }>
  verifyOTP: (email: string, token: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  validationError: string
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authEmail, setAuthEmail] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setIsLoading(false)

      if (s?.user) {
        setUserContext({ id: s.user.id, email: s.user.email })
        logAuthOperation("session-refresh", {
          userId: s.user.id,
          email: s.user.email,
        })
      } else {
        setUserContext(null)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log("[Auth] State change:", event)
      setSession(s)

      if (s?.user) {
        setUserContext({ id: s.user.id, email: s.user.email })
        if (event === "SIGNED_IN") {
          logAuthOperation("login", {
            userId: s.user.id,
            email: s.user.email,
          })

          // Multi-tenant approach: We keep ALL data in the local database
          // The DatabaseContext will filter to show only this user's organizations
          // This allows background sync to continue for all users without data loss
          console.log("[Auth] User signed in:", s.user.email)
          console.log("[Auth] Local database preserved - will show only this user's data via filtering")
        }
      } else {
        setUserContext(null)
        if (event === "SIGNED_OUT") {
          logAuthOperation("logout", {})
          console.log("[Auth] User signed out - local database preserved for background sync")
          // Note: We do NOT clear the database on logout
          // This preserves unsynced changes and allows sync to complete in the background
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Handle auth deep links (email confirmation, magic links, etc.)
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      const hashIndex = url.indexOf("#")
      if (hashIndex === -1) return

      const params = new URLSearchParams(url.substring(hashIndex + 1))
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error) console.warn("[Auth] Failed to set session from deep link:", error.message)
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url)
    })

    const sub = Linking.addEventListener("url", ({ url }) => handleDeepLink(url))
    return () => sub.remove()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    console.log("[Auth] signIn called", {
      email,
      emailLength: email.length,
      passwordLength: password.length,
      emailTrimmed: email.trim(),
      hasWhitespace: email !== email.trim()
    })

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error("[Auth] signIn error:", {
        message: error.message,
        status: error.status,
        name: error.name,
        email: email,
      })

      logAuthOperation("login", {
        email,
        error,
        method: "password",
      })

      captureException(error, {
        component: "AuthContext",
        operation: "signIn",
        email,
        errorStatus: error.status,
      })

      return { error: error.message }
    }

    console.log("[Auth] signIn success:", {
      userId: data?.user?.id,
      email: data?.user?.email,
      hasSession: !!data?.session
    })

    logAuthOperation("login", {
      email: data?.user?.email,
      userId: data?.user?.id,
      method: "password",
    })

    return { error: null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: AUTH_REDIRECT_URL },
    })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: AUTH_REDIRECT_URL,
        shouldCreateUser: true,
      },
    })
    if (error) return { error: error.message }
    return { error: null, success: true }
  }, [])

  const signInWithOTP = useCallback(async (email: string) => {
    // App review bypass - no email is sent; the fixed code is checked in verifyOTP
    if (isReviewEmail(email)) {
      return { error: null, success: true }
    }

    // Development bypass - skip OTP entirely
    if (DEV_SKIP_AUTH) {
      console.log("[Auth] DEV MODE: Skipping OTP, will auto-verify")
      return { error: null, success: true }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })
    if (error) return { error: error.message }
    return { error: null, success: true }
  }, [])

  const verifyOTP = useCallback(async (email: string, token: string) => {
    // App review bypass - fixed code signs in the demo review account
    if (isReviewEmail(email)) {
      if (token.trim() !== REVIEW_OTP_CODE) {
        return { error: "Invalid code. Please try again." }
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: REVIEW_EMAIL,
        password: REVIEW_PASSWORD,
      })
      if (error) return { error: error.message }
      return { error: null }
    }

    // Development bypass - auto sign in/up with dev password
    if (DEV_SKIP_AUTH) {
      console.log("[Auth] DEV MODE: Auto-authenticating with dev password")
      const devPassword = "dev-password-123"

      // Try signing in first
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: devPassword,
      })

      // If user doesn't exist, create them then sign in
      if (signInError?.message.includes("Invalid login credentials")) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: devPassword,
          options: {
            emailRedirectTo: AUTH_REDIRECT_URL,
            data: {
              dev_user: true,
            },
          },
        })
        if (signUpError) {
          console.error("[Auth] DEV MODE: SignUp error:", signUpError.message)
          return { error: signUpError.message }
        }

        console.log("[Auth] DEV MODE: Created new user, signing in...")

        // Now sign in with the new account
        const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
          email,
          password: devPassword,
        })

        if (newSignInError) {
          console.error("[Auth] DEV MODE: SignIn after signup error:", newSignInError.message)
          return { error: newSignInError.message }
        }

        if (!newSignInData?.session) {
          console.error("[Auth] DEV MODE: No session after signup+signin")
          return { error: "Failed to create session - check Supabase email confirmation settings" }
        }

        console.log("[Auth] DEV MODE: Signed in successfully")
      } else if (signInError) {
        console.error("[Auth] DEV MODE: SignIn error:", signInError.message)
        return { error: signInError.message }
      } else if (!signInData?.session) {
        console.error("[Auth] DEV MODE: SignIn succeeded but no session")
        return { error: "No session created - check Supabase email confirmation settings" }
      } else {
        console.log("[Auth] DEV MODE: Signed in successfully")
      }

      return { error: null }
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Reset RevenueCat to clear user-specific data
      console.log("[Auth] Logging out RevenueCat user")
      await Purchases.logOut()
      console.log("[Auth] RevenueCat user logged out successfully")
    } catch (error) {
      console.error("[Auth] Error logging out RevenueCat:", error)
    }

    // NOTE: We do NOT clear the local database on logout to preserve offline changes
    // The database will be automatically cleared on login if a different user signs in
    // This prevents data loss if the user has unsynced changes

    // Sign out from Supabase
    await supabase.auth.signOut()
    setSession(null)
  }, [])

  const validationError = (() => {
    if (!authEmail || authEmail.length === 0) return "can't be blank"
    if (authEmail.length < 6) return "must be at least 6 characters"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail)) return "must be a valid email address"
    return ""
  })()

  const value: AuthContextType = {
    isAuthenticated: !!session,
    isLoading,
    session,
    user: session?.user ?? null,
    authEmail,
    setAuthEmail,
    signIn,
    signUp,
    signInWithMagicLink,
    signInWithOTP,
    verifyOTP,
    logout,
    validationError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
