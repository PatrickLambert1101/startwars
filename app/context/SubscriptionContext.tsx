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

export type PlanTier = "starter" | "farm" | "commercial"
export type PremiumFeature = "vaccines" | "pastures" | "unlimited_animals" | "team_members" | "advanced_reports"
export type BillingPeriod = "monthly" | "annual"

export type SubscriptionContextType = {
  plan: PlanTier
  isStarter: boolean
  isFarm: boolean
  isCommercial: boolean
  isPremium: boolean // Farm or Commercial
  isLoading: boolean
  /** Check if a specific premium feature is unlocked */
  hasFeature: (feature: PremiumFeature) => boolean
  /** Available purchase packages from RevenueCat */
  packages: PurchasesPackage[]
  /** Purchase a specific package */
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>
  /** Restore previous purchases */
  restorePurchases: () => Promise<void>
}

// Feature availability by tier
const TIER_FEATURES = {
  starter: [] as PremiumFeature[], // Free tier - no premium features
  farm: ["vaccines", "pastures", "unlimited_animals"] as PremiumFeature[],
  commercial: ["vaccines", "pastures", "unlimited_animals", "team_members", "advanced_reports"] as PremiumFeature[],
}

// RevenueCat API key - using test key (replace with production key later)
const REVENUECAT_API_KEY = "test_HiAakRXKRndBIBZdYHlGVISoCmX"

// RevenueCat entitlement identifiers — must match what you set up in the RC dashboard
const FARM_ENTITLEMENT_ID = "farm"
const COMMERCIAL_ENTITLEMENT_ID = "commercial"

export const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

export const SubscriptionProvider: FC<PropsWithChildren> = ({ children }) => {
  const { currentOrg } = useDatabase()

  const [plan, setPlan] = useState<PlanTier>("starter")
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Computed tier checks
  const isStarter = plan === "starter"
  const isFarm = plan === "farm"
  const isCommercial = plan === "commercial"
  const isPremium = isFarm || isCommercial

  // ── Initialise RevenueCat ─────────────────────────────────
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        // Configure RevenueCat with minimal logging
        Purchases.setLogLevel(LOG_LEVEL.INFO)

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
          allPurchasedProducts: Object.keys(customerInfo.allPurchasedProductIdentifiers || {}),
        })
        updatePlanFromCustomerInfo(customerInfo)

      } catch (error) {
        console.error("[Subscriptions] Failed to initialize RevenueCat:", error)
        // Default to starter plan on error
        setPlan("starter")
      } finally {
        setIsLoading(false)
      }
    }

    initRevenueCat()
  }, [])

  // ── Helpers ───────────────────────────────────────────────
  const updatePlanFromCustomerInfo = (info: CustomerInfo) => {
    // DEVELOPMENT WORKAROUND: Check if using test store and grant farm by default if any purchase exists
    const isTestStore = REVENUECAT_API_KEY.startsWith("test_")
    const hasAnyPurchase = Object.keys(info.allPurchasedProductIdentifiers || {}).length > 0

    if (isTestStore && hasAnyPurchase && Object.keys(info.entitlements.active).length === 0) {
      console.log("[Subscriptions] Test store detected with purchase but no entitlements. Granting Farm plan for testing.")
      setPlan("farm")
      return
    }

    // Check for highest tier first
    if (info.entitlements.active[COMMERCIAL_ENTITLEMENT_ID] !== undefined) {
      setPlan("commercial")
    } else if (info.entitlements.active[FARM_ENTITLEMENT_ID] !== undefined) {
      setPlan("farm")
    } else {
      setPlan("starter")
    }
  }

  const hasFeature = useCallback(
    (feature: PremiumFeature) => {
      return TIER_FEATURES[plan].includes(feature)
    },
    [plan],
  )

  // ── Purchase methods ──────────────────────────────────────
  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    try {
      setIsLoading(true)
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      console.log("[Subscriptions] Purchase completed. New customer info:", {
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        allPurchasedProducts: Object.keys(customerInfo.allPurchasedProductIdentifiers || {}),
      })
      updatePlanFromCustomerInfo(customerInfo)
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert("Purchase failed", e.message || "Something went wrong. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true)
      const info = await Purchases.restorePurchases()
      updatePlanFromCustomerInfo(info)
      const hasAnyEntitlement =
        info.entitlements.active[COMMERCIAL_ENTITLEMENT_ID] !== undefined ||
        info.entitlements.active[FARM_ENTITLEMENT_ID] !== undefined

      Alert.alert(
        hasAnyEntitlement ? "Restored!" : "Nothing to restore",
        hasAnyEntitlement
          ? "Your subscription has been restored."
          : "No previous purchases found for this account.",
      )
    } catch (e: any) {
      Alert.alert("Restore failed", e.message || "Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        isStarter,
        isFarm,
        isCommercial,
        isPremium,
        isLoading,
        hasFeature,
        packages,
        purchasePackage,
        restorePurchases,
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
