import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import * as Linking from "expo-linking"
import { supabase } from "@/services/supabase"

const AUTH_REDIRECT_URL = Linking.createURL("auth-callback")
const DEV_SKIP_AUTH = process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === "true"

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
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
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
