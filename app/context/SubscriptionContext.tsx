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

export type PlanTier = "free" | "pro"
export type PremiumFeature = "vaccines" | "pastures"
export type BillingPeriod = "monthly" | "annual"

export type SubscriptionContextType = {
  plan: PlanTier
  isPro: boolean
  isLoading: boolean
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

// RevenueCat API keys — replace with your real keys from the RevenueCat dashboard
const REVENUECAT_API_KEY_APPLE = "appl_YOUR_REVENUECAT_APPLE_API_KEY"
const REVENUECAT_API_KEY_GOOGLE = "goog_YOUR_REVENUECAT_GOOGLE_API_KEY"

// RevenueCat entitlement identifier — must match what you set up in the RC dashboard
const PRO_ENTITLEMENT_ID = "pro"

export const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

export const SubscriptionProvider: FC<PropsWithChildren> = ({ children }) => {
  const [plan, setPlan] = useState<PlanTier>("free")
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isPro = plan === "pro"

  // ── Initialise RevenueCat ─────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const apiKey =
          Platform.OS === "ios" ? REVENUECAT_API_KEY_APPLE : REVENUECAT_API_KEY_GOOGLE

        if (apiKey.includes("YOUR_REVENUECAT")) {
          console.log("[Subscriptions] Using placeholder API keys — skipping RevenueCat init")
          setIsLoading(false)
          return
        }

        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG)
        }

        await Purchases.configure({ apiKey })

        // Fetch current customer info
        const info = await Purchases.getCustomerInfo()
        updatePlanFromCustomerInfo(info)

        // Fetch available packages
        const offerings = await Purchases.getOfferings()
        if (offerings.current?.availablePackages) {
          setPackages(offerings.current.availablePackages)
        }

        // Listen for subscription changes
        Purchases.addCustomerInfoUpdateListener(updatePlanFromCustomerInfo)
      } catch (e) {
        console.warn("[Subscriptions] Failed to initialise RevenueCat:", e)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  // ── Helpers ───────────────────────────────────────────────
  const updatePlanFromCustomerInfo = (info: CustomerInfo) => {
    const hasProEntitlement = info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined
    setPlan(hasProEntitlement ? "pro" : "free")
  }

  const hasFeature = useCallback(
    (feature: PremiumFeature) => {
      if (isPro) return true
      return !PREMIUM_FEATURES.includes(feature)
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
