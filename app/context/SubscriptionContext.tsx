import { createContext, FC, PropsWithChildren, useCallback, useContext, useState } from "react"

export type PlanTier = "free" | "pro"

export type SubscriptionContextType = {
  plan: PlanTier
  isPro: boolean
  /** Check if a specific premium feature is unlocked */
  hasFeature: (feature: PremiumFeature) => boolean
  /** Upgrade to pro (stub — will wire to IAP / Stripe later) */
  upgradeToPro: () => void
  /** Restore purchases (stub) */
  restorePurchases: () => void
}

/** Features gated behind the Pro plan */
export type PremiumFeature = "vaccines" | "pastures"

const PREMIUM_FEATURES: PremiumFeature[] = ["vaccines", "pastures"]

export const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

export const SubscriptionProvider: FC<PropsWithChildren> = ({ children }) => {
  const [plan, setPlan] = useState<PlanTier>("free")

  const isPro = plan === "pro"

  const hasFeature = useCallback(
    (feature: PremiumFeature) => {
      if (isPro) return true
      return !PREMIUM_FEATURES.includes(feature)
    },
    [isPro],
  )

  const upgradeToPro = useCallback(() => {
    // TODO: integrate with RevenueCat / Stripe
    setPlan("pro")
  }, [])

  const restorePurchases = useCallback(() => {
    // TODO: integrate with RevenueCat
    setPlan("pro")
  }, [])

  return (
    <SubscriptionContext.Provider value={{ plan, isPro, hasFeature, upgradeToPro, restorePurchases }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) throw new Error("useSubscription must be used within a SubscriptionProvider")
  return context
}
