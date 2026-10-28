import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Alert, Platform } from "react-native"
import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from "react-native-purchases"

import { isSubscriptionProductActive } from "@/utils/subscriptionProducts"

import { useAuth } from "./AuthContext"

export type PlanTier = "starter" | "farm" | "commercial"
export type PremiumFeature =
  | "vaccines"
  | "pastures"
  | "unlimited_animals"
  | "team_members"
  | "advanced_reports"
export type BillingPeriod = "monthly" | "annual"
export type PurchaseOutcome = "purchased" | "already_active"

/**
 * The whole paid model is now just an animal-count ladder — every tier has every
 * feature, they differ only in how many animals you may hold. "Cows" loosely:
 * the cap counts total animals of every species. Infinity = unlimited.
 *
 * Tiers reuse the existing RevenueCat entitlements (farm, commercial); only what
 * they grant changed (a higher cap instead of extra features).
 */
export const ANIMAL_LIMITS: Record<PlanTier, number> = {
  starter: 50, // free
  farm: 500, // mid
  commercial: Infinity, // unlimited
}

/** The free tier's cap, surfaced for copy ("free for your first N animals"). */
export const FREE_ANIMAL_LIMIT = ANIMAL_LIMITS.starter

export type SubscriptionContextType = {
  plan: PlanTier
  isStarter: boolean
  isFarm: boolean
  isCommercial: boolean
  isPremium: boolean // Farm or Commercial
  /** True once the animal cap has been lifted (paid, or super user). */
  isPaid: boolean
  /** Max animals allowed on the current plan (Infinity once paid). */
  animalLimit: number
  isLoading: boolean
  /**
   * Every feature is now free for everyone — the only thing you pay for is
   * animals beyond the free limit. Kept so existing call sites don't break.
   */
  hasFeature: (feature: PremiumFeature) => boolean
  /** Available purchase packages from RevenueCat */
  packages: PurchasesPackage[]
  /** True while products are being fetched from the current RevenueCat offering. */
  isPackagesLoading: boolean
  /** Fetch the current offering again after a transient StoreKit/network failure. */
  reloadPackages: () => Promise<void>
  /** Purchase a specific package */
  purchasePackage: (pkg: PurchasesPackage) => Promise<PurchaseOutcome>
  /** Restore previous purchases */
  restorePurchases: () => Promise<void>
}

// RevenueCat API keys from environment variables
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY

// Get the appropriate API key for the current platform
const getRevenueCatApiKey = (): string | null => {
  if (Platform.OS === "ios") {
    return REVENUECAT_IOS_KEY || null
  } else if (Platform.OS === "android") {
    return REVENUECAT_ANDROID_KEY || null
  }
  return null
}

// RevenueCat entitlement identifiers — must match what you set up in the RC dashboard
const FARM_ENTITLEMENT_ID = "farm"
const COMMERCIAL_ENTITLEMENT_ID = "commercial"

const planForProductIdentifier = (productIdentifier: string): PlanTier | null => {
  const normalizedIdentifier = productIdentifier.trim().toLowerCase()

  if (
    normalizedIdentifier === "commercial_monthly" ||
    normalizedIdentifier === "commercial_yearly"
  ) {
    return "commercial"
  }

  if (normalizedIdentifier === "farm_monthly" || normalizedIdentifier === "farm_yearly") {
    return "farm"
  }

  return null
}

export const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

export const SubscriptionProvider: FC<PropsWithChildren> = ({ children }) => {
  const { user } = useAuth()

  const [plan, setPlan] = useState<PlanTier>("starter")
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPackagesLoading, setIsPackagesLoading] = useState(true)
  const [isSuperUser, setIsSuperUser] = useState(false)
  const [isRevenueCatConfigured, setIsRevenueCatConfigured] = useState(false)
  const isSuperUserRef = useRef(false)

  // Computed tier checks. Tiers are legacy: the model is now simply free (capped
  // at FREE_ANIMAL_LIMIT animals) vs paid (uncapped). Any non-starter plan — or a
  // super user — counts as paid.
  const isStarter = plan === "starter"
  const isFarm = plan === "farm"
  const isCommercial = plan === "commercial"
  const isPremium = isFarm || isCommercial
  const isPaid = isPremium || isSuperUser
  // Super users are effectively commercial (unlimited); otherwise the cap comes
  // straight from the plan ladder.
  const animalLimit = isSuperUser ? Infinity : ANIMAL_LIMITS[plan]

  const updateSuperUserStatus = useCallback((value: boolean) => {
    isSuperUserRef.current = value
    setIsSuperUser(value)
  }, [])

  const updatePlanFromCustomerInfo = useCallback((info: CustomerInfo) => {
    // Super users always keep commercial access, even when a RevenueCat
    // request that began earlier finishes after their status check.
    if (isSuperUserRef.current) {
      console.log("[Subscriptions] Super user detected - maintaining commercial access")
      setPlan("commercial")
      return
    }

    // DEVELOPMENT WORKAROUND: Check if using test store and grant farm by default if any purchase exists
    const apiKey = getRevenueCatApiKey()
    const isTestStore = apiKey?.startsWith("test_") || false
    const hasAnyPurchase = Object.keys(info.allPurchasedProductIdentifiers || {}).length > 0

    if (isTestStore && hasAnyPurchase && Object.keys(info.entitlements.active).length === 0) {
      console.log(
        "[Subscriptions] Test store detected with purchase but no entitlements. Granting Farm plan for testing.",
      )
      setPlan("farm")
      return
    }

    const activeProductPlans = info.activeSubscriptions
      .map(planForProductIdentifier)
      .filter((activePlan): activePlan is PlanTier => activePlan !== null)

    // Check for highest tier first. activeSubscriptions is also considered so
    // an active StoreKit purchase still unlocks the plan while RevenueCat's
    // entitlement mapping/cache catches up.
    if (
      info.entitlements.active[COMMERCIAL_ENTITLEMENT_ID] !== undefined ||
      activeProductPlans.includes("commercial")
    ) {
      setPlan("commercial")
    } else if (
      info.entitlements.active[FARM_ENTITLEMENT_ID] !== undefined ||
      activeProductPlans.includes("farm")
    ) {
      setPlan("farm")
    } else {
      setPlan("starter")
    }
  }, [])

  const loadPackages = useCallback(async () => {
    setIsPackagesLoading(true)

    try {
      const offerings = await Purchases.getOfferings()
      const availablePackages = offerings.current?.availablePackages ?? []

      setPackages(availablePackages)
      if (availablePackages.length === 0) {
        console.warn(
          "[Subscriptions] No packages in the current RevenueCat offering — check App Store Connect product status and RevenueCat offering configuration",
        )
      } else {
        console.log("[Subscriptions] Found packages:", availablePackages.length)
      }
    } catch (error) {
      setPackages([])
      throw error
    } finally {
      setIsPackagesLoading(false)
    }
  }, [])

  // ── Initialise RevenueCat ─────────────────────────────────
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        const apiKey = getRevenueCatApiKey()

        // Check if API key is configured
        if (!apiKey) {
          console.warn(
            "[Subscriptions] RevenueCat API key not configured. Subscriptions will be disabled.",
          )
          console.warn(
            "[Subscriptions] Please set EXPO_PUBLIC_REVENUECAT_IOS_KEY or EXPO_PUBLIC_REVENUECAT_ANDROID_KEY in your .env file",
          )
          setPlan("starter")
          setIsLoading(false)
          setIsRevenueCatConfigured(false)
          setIsPackagesLoading(false)
          return
        }

        // Validate API key format
        if (apiKey.includes("YOUR_") || apiKey.includes("your-")) {
          console.warn(
            "[Subscriptions] RevenueCat API key appears to be a placeholder. Subscriptions will be disabled.",
          )
          console.warn(
            "[Subscriptions] Get your production key from: https://app.revenuecat.com/settings/api-keys",
          )
          setPlan("starter")
          setIsLoading(false)
          setIsRevenueCatConfigured(false)
          setIsPackagesLoading(false)
          return
        }

        // Configure RevenueCat with minimal logging
        // In development, only show errors (not warnings about missing products)
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.ERROR : LOG_LEVEL.WARN)

        // Initialize SDK
        await Purchases.configure({
          apiKey,
          appUserID: undefined, // Let RevenueCat generate anonymous ID (will link on login)
        })

        console.log("[Subscriptions] RevenueCat initialized successfully")
        setIsRevenueCatConfigured(true)

        // Fetch available products before presenting the paywall. Prices and
        // periods shown to the customer come directly from these store products.
        await loadPackages()

        // Check current subscription status
        const customerInfo = await Purchases.getCustomerInfo()
        console.log("[Subscriptions] Customer info:", {
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          allEntitlements: Object.keys(customerInfo.entitlements.all),
          allPurchasedProducts: Object.keys(customerInfo.allPurchasedProductIdentifiers || {}),
        })
        updatePlanFromCustomerInfo(customerInfo)
      } catch (error: any) {
        // "Offerings empty" is an expected state in dev (no StoreKit/App Store
        // products yet) — log as warn rather than error to avoid spamming Sentry.
        const message = String(error?.message || error)
        const isOfferingsEmpty =
          message.includes("why-are-offerings-empty") || message.includes("None of the products")
        if (isOfferingsEmpty) {
          console.warn(
            "[Subscriptions] RevenueCat offerings empty — products not yet linked. See https://rev.cat/why-are-offerings-empty",
          )
        } else {
          console.error("[Subscriptions] Failed to initialize RevenueCat:", error)
        }
        // Default to starter plan on error
        setPlan("starter")
        setPackages([])
        setIsPackagesLoading(false)
      } finally {
        setIsLoading(false)
      }
    }

    initRevenueCat()
  }, [loadPackages, updatePlanFromCustomerInfo])

  // ── Check if user is a super user (full commercial access) ──
  useEffect(() => {
    const checkSuperUser = async () => {
      if (!user?.id || !user?.email) {
        updateSuperUserStatus(false)
        return
      }

      try {
        console.log("[Subscriptions] Checking super user status for:", user.email)
        const { supabase } = await import("@/services/supabase")

        const { data, error } = await supabase.rpc("is_super_user", {
          check_user_id: user.id,
          check_email: user.email,
        })

        if (error) {
          console.error("[Subscriptions] Error checking super user status:", error)
          updateSuperUserStatus(false)
          return
        }

        console.log("[Subscriptions] Super user status:", data)
        updateSuperUserStatus(data === true)

        // If user is a super user, grant them commercial access
        if (data === true) {
          console.log("[Subscriptions] User is a super user - granting commercial access")
          setPlan("commercial")
        }
      } catch (error) {
        console.error("[Subscriptions] Failed to check super user status:", error)
        updateSuperUserStatus(false)
      }
    }

    checkSuperUser()
  }, [user?.id, user?.email, updateSuperUserStatus])

  // ── Identify user with RevenueCat when they log in ──────────
  useEffect(() => {
    const identifyUser = async () => {
      if (!user?.id) {
        console.log("[Subscriptions] No user logged in, skipping identification")
        return
      }

      // Skip RevenueCat if not properly configured
      if (!isRevenueCatConfigured) {
        console.log("[Subscriptions] RevenueCat not configured, skipping identification")
        return
      }

      // Skip RevenueCat if user is a super user
      if (isSuperUser) {
        console.log("[Subscriptions] User is a super user, skipping RevenueCat")
        return
      }

      try {
        console.log("[Subscriptions] Identifying user with RevenueCat:", user.id)
        await Purchases.logIn(user.id)
        console.log("[Subscriptions] User identified successfully")

        // Refresh customer info after login
        const customerInfo = await Purchases.getCustomerInfo()
        console.log("[Subscriptions] Refreshed customer info after login:", {
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          allPurchasedProducts: Object.keys(customerInfo.allPurchasedProductIdentifiers || {}),
        })
        updatePlanFromCustomerInfo(customerInfo)
      } catch (error) {
        console.error("[Subscriptions] Failed to identify user with RevenueCat:", error)
      }
    }

    identifyUser()
  }, [user?.id, isSuperUser, isRevenueCatConfigured, updatePlanFromCustomerInfo])

  // All features are free now; paying only lifts the animal cap. Kept as a
  // function so the existing hasFeature(...) call sites keep working.
  const hasFeature = useCallback((_feature: PremiumFeature) => true, [])

  // ── Purchase methods ──────────────────────────────────────
  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage) => {
      const applyStoreProductPlan = (productIdentifier: string) => {
        const purchasedPlan = planForProductIdentifier(productIdentifier)
        if (purchasedPlan) setPlan(purchasedPlan)
      }

      try {
        setIsLoading(true)

        // RevenueCat can restore an existing StoreKit subscription during app
        // startup. If the paywall was opened before that refresh completed, do
        // not make an already-owned product look like a brand-new purchase.
        const currentCustomerInfo = await Purchases.getCustomerInfo()
        if (isSubscriptionProductActive(currentCustomerInfo, pkg.product.identifier)) {
          updatePlanFromCustomerInfo(currentCustomerInfo)
          return "already_active" as const
        }

        const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg)
        console.log("[Subscriptions] Purchase completed. New customer info:", {
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          allPurchasedProducts: Object.keys(customerInfo.allPurchasedProductIdentifiers || {}),
        })

        updatePlanFromCustomerInfo(customerInfo)

        // purchasePackage only resolves after the store completes the purchase.
        // RevenueCat's CustomerInfo can briefly lag behind StoreKit (the exact
        // state Apple's review screenshot captured), so never turn that success
        // into a contradictory "Purchase Failed" alert. Keep access consistent
        // from the verified store product while CustomerInfo refreshes.
        if (!isSubscriptionProductActive(customerInfo, pkg.product.identifier)) {
          console.warn(
            "[Subscriptions] Store purchase completed before CustomerInfo reflected the product; applying the purchased plan locally",
          )
          applyStoreProductPlan(productIdentifier || pkg.product.identifier)
        }

        return "purchased" as const
      } catch (e: any) {
        const readableErrorCode = e?.userInfo?.readableErrorCode || e?.readableErrorCode
        const isAlreadyPurchased =
          e?.code === Purchases.PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR ||
          readableErrorCode === "PRODUCT_ALREADY_PURCHASED"

        if (isAlreadyPurchased) {
          // StoreKit owns the subscription, but it may be attached to a previous
          // anonymous RevenueCat user (common after sandbox reinstalls). RevenueCat
          // recommends restoring here to re-sync the receipt with the current ID.
          try {
            const restoredCustomerInfo = await Purchases.restorePurchases()
            updatePlanFromCustomerInfo(restoredCustomerInfo)

            if (!isSubscriptionProductActive(restoredCustomerInfo, pkg.product.identifier)) {
              applyStoreProductPlan(pkg.product.identifier)
            }
          } catch (restoreError) {
            console.warn(
              "[Subscriptions] Store reports the product is already purchased, but receipt re-sync was delayed:",
              restoreError,
            )
            applyStoreProductPlan(pkg.product.identifier)
          }

          return "already_active" as const
        }

        // The paywall owns customer-facing purchase feedback. Re-throwing is
        // essential: swallowing this error previously made failed/cancelled
        // purchases look successful to the caller.
        throw e
      } finally {
        setIsLoading(false)
      }
    },
    [updatePlanFromCustomerInfo],
  )

  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true)
      const info = await Purchases.restorePurchases()
      updatePlanFromCustomerInfo(info)
      const hasAnyActivePlan =
        info.entitlements.active[COMMERCIAL_ENTITLEMENT_ID] !== undefined ||
        info.entitlements.active[FARM_ENTITLEMENT_ID] !== undefined ||
        info.activeSubscriptions.some(
          (productIdentifier) => planForProductIdentifier(productIdentifier) !== null,
        )

      Alert.alert(
        hasAnyActivePlan ? "Restored!" : "Nothing to restore",
        hasAnyActivePlan
          ? "Your subscription has been restored."
          : "No previous purchases found for this account.",
      )
    } catch (e: any) {
      Alert.alert("Restore failed", e.message || "Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }, [updatePlanFromCustomerInfo])

  const contextValue = useMemo(
    () => ({
      plan,
      isStarter,
      isFarm,
      isCommercial,
      isPremium,
      isPaid,
      animalLimit,
      isLoading,
      hasFeature,
      packages,
      isPackagesLoading,
      reloadPackages: loadPackages,
      purchasePackage,
      restorePurchases,
    }),
    [
      plan,
      isStarter,
      isFarm,
      isCommercial,
      isPremium,
      isPaid,
      animalLimit,
      isLoading,
      hasFeature,
      packages,
      isPackagesLoading,
      loadPackages,
      purchasePackage,
      restorePurchases,
    ],
  )

  return (
    <SubscriptionContext.Provider value={contextValue}>{children}</SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) throw new Error("useSubscription must be used within a SubscriptionProvider")
  return context
}
