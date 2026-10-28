import type { PurchasesPackage } from "react-native-purchases"

type SubscriptionCustomerInfo = {
  activeSubscriptions?: string[]
  entitlements?: {
    active?: Record<string, { productIdentifier?: string }>
  }
}

/**
 * Match a RevenueCat package without allowing one product identifier to be a
 * substring of another. The App Store product identifier is the canonical
 * match; the package identifier is accepted for custom RevenueCat packages.
 */
export function findSubscriptionPackage(
  packages: PurchasesPackage[],
  productIdentifier: string,
): PurchasesPackage | undefined {
  const expectedIdentifier = productIdentifier.trim().toLowerCase()

  return packages.find(
    (pkg) =>
      pkg.product.identifier.trim().toLowerCase() === expectedIdentifier ||
      pkg.identifier.trim().toLowerCase() === expectedIdentifier,
  )
}

/**
 * True when StoreKit/RevenueCat already reports this exact subscription product
 * as active. This prevents an existing sandbox subscription from being
 * presented as though a new purchase just occurred.
 */
export function isSubscriptionProductActive(
  customerInfo: SubscriptionCustomerInfo,
  productIdentifier: string,
): boolean {
  const expectedIdentifier = productIdentifier.trim().toLowerCase()

  const hasActiveSubscription = (customerInfo.activeSubscriptions ?? []).some(
    (identifier) => identifier.trim().toLowerCase() === expectedIdentifier,
  )

  const hasMatchingEntitlement = Object.values(customerInfo.entitlements?.active ?? {}).some(
    (entitlement) => entitlement.productIdentifier?.trim().toLowerCase() === expectedIdentifier,
  )

  return hasActiveSubscription || hasMatchingEntitlement
}

/** Convert StoreKit/Google Play ISO-8601 subscription periods into clear copy. */
export function formatSubscriptionPeriod(subscriptionPeriod: string | null): string {
  switch (subscriptionPeriod?.toUpperCase()) {
    case "P1W":
      return "/week"
    case "P1M":
      return "/month"
    case "P3M":
      return "/3 months"
    case "P6M":
      return "/6 months"
    case "P1Y":
      return "/year"
    default:
      return subscriptionPeriod ? `/${subscriptionPeriod}` : ""
  }
}
