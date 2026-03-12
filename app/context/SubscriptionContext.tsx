import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { Alert, Platform } from "react-native"
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases"
import { useDatabase } from "./DatabaseContext"

export type PlanTier = "free" | "pro"
export type PremiumFeature = "vaccines" | "pastures"
export type BillingPeriod = "monthly" | "annual"

export type SubscriptionContextType = {
  plan: PlanTier
  isPro: boolean
  isLoading: boolean
  /** Current subscription tier (starter | farm | commercial) */
  currentPlan: string
  /** Check if a specific premium feature is unlocked */
  hasFeature: (feature: PremiumFeature) => boolean
  /** Available purchase packages from RevenueCat */
  packages: PurchasesPackage[]
  /** Purchase a specific package */
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>
  /** Convenience: purchase pro monthly */
  purchaseProMonthly: () => Promise<void>
  /** Convenience: purchase pro annual */
  purchaseProAnnual: () => Promise<void>
  /** Restore previous purchases */
  restorePurchases: () => Promise<void>
  /** Legacy: immediate upgrade (for dev/testing) */
  upgradeToPro: () => void
}

const PREMIUM_FEATURES: PremiumFeature[] = ["vaccines", "pastures"]

// RevenueCat API key - using test key (replace with production key later)
const REVENUECAT_API_KEY = "test_HiAakRXKRndBIBZdYHlGVISoCmX"

// RevenueCat entitlement identifier — must match what you set up in the RC dashboard
const PRO_ENTITLEMENT_ID = "Herdtrackr Pro"

export const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

export const SubscriptionProvider: FC<PropsWithChildren> = ({ children }) => {
  const { currentOrg } = useDatabase()

  const [plan, setPlan] = useState<PlanTier>("free")
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get current subscription tier from database
  const currentPlan = currentOrg?.subscriptionTier || "starter"

  const isPro = plan === "pro"

  // ── Initialise RevenueCat ─────────────────────────────────
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        // Configure RevenueCat with debug logging
        Purchases.setLogLevel(LOG_LEVEL.DEBUG)

        // Initialize SDK
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
          appUserID: undefined, // Let RevenueCat generate anonymous ID (will link on login)
        })

        console.log("[Subscriptions] RevenueCat initialized successfully")

        // Fetch available offerings
        const offerings = await Purchases.getOfferings()
        console.log("[Subscriptions] Available offerings:", offerings)

        if (offerings.current?.availablePackages) {
          setPackages(offerings.current.availablePackages)
          console.log("[Subscriptions] Found packages:", offerings.current.availablePackages.length)
        } else {
          console.warn("[Subscriptions] No current offering found")
        }

        // Check current subscription status
        const customerInfo = await Purchases.getCustomerInfo()
        console.log("[Subscriptions] Customer info:", {
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          allEntitlements: Object.keys(customerInfo.entitlements.all),
        })
        updatePlanFromCustomerInfo(customerInfo)

      } catch (error) {
        console.error("[Subscriptions] Failed to initialize RevenueCat:", error)
        // Default to free plan on error
        setPlan("free")
      } finally {
        setIsLoading(false)
      }
    }

    initRevenueCat()
  }, [])

  // ── Helpers ───────────────────────────────────────────────
  const updatePlanFromCustomerInfo = (info: CustomerInfo) => {
    const hasProEntitlement = info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined
    setPlan(hasProEntitlement ? "pro" : "free")
  }

  const hasFeature = useCallback(
    (feature: PremiumFeature) => {
      return isPro
    },
    [isPro],
  )

  // ── Purchase methods ──────────────────────────────────────
  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    try {
      setIsLoading(true)
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      updatePlanFromCustomerInfo(customerInfo)
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert("Purchase failed", e.message || "Something went wrong. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const purchaseProMonthly = useCallback(async () => {
    const monthly = packages.find(
      (p) => p.packageType === "MONTHLY" || p.identifier === "$rc_monthly",
    )
    if (monthly) {
      await purchasePackage(monthly)
    } else {
      Alert.alert("Unavailable", "Monthly plan is not available right now.")
    }
  }, [packages, purchasePackage])

  const purchaseProAnnual = useCallback(async () => {
    const annual = packages.find(
      (p) => p.packageType === "ANNUAL" || p.identifier === "$rc_annual",
    )
    if (annual) {
      await purchasePackage(annual)
    } else {
      Alert.alert("Unavailable", "Annual plan is not available right now.")
    }
  }, [packages, purchasePackage])

  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true)
      const info = await Purchases.restorePurchases()
      updatePlanFromCustomerInfo(info)
      const restored = info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined
      Alert.alert(
        restored ? "Restored!" : "Nothing to restore",
        restored
          ? "Your Pro subscription has been restored."
          : "No previous purchases found for this account.",
      )
    } catch (e: any) {
      Alert.alert("Restore failed", e.message || "Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Dev/testing fallback
  const upgradeToPro = useCallback(() => {
    setPlan("pro")
  }, [])

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        isPro,
        isLoading,
        currentPlan,
        hasFeature,
        packages,
        purchasePackage,
        purchaseProMonthly,
        purchaseProAnnual,
        restorePurchases,
        upgradeToPro,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) throw new Error("useSubscription must be used within a SubscriptionProvider")
  return context
}
