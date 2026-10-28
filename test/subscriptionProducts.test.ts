import type { PurchasesPackage } from "react-native-purchases"

import {
  findSubscriptionPackage,
  formatSubscriptionPeriod,
  isSubscriptionProductActive,
} from "../app/utils/subscriptionProducts"

function packageWithIdentifiers(
  packageIdentifier: string,
  productIdentifier: string,
): PurchasesPackage {
  return {
    identifier: packageIdentifier,
    product: { identifier: productIdentifier },
  } as PurchasesPackage
}

describe("subscription product helpers", () => {
  const packages = [
    packageWithIdentifiers("farm_monthly", "farm_monthly"),
    packageWithIdentifiers("commercial_monthly", "commercial_monthly"),
    packageWithIdentifiers("commercial_annual", "commercial_yearly"),
  ]

  it("matches exact store product and custom package identifiers", () => {
    expect(findSubscriptionPackage(packages, "commercial_monthly"))?.toBe(packages[1])
    expect(findSubscriptionPackage(packages, "commercial_annual"))?.toBe(packages[2])
  })

  it("does not match partial identifiers", () => {
    expect(findSubscriptionPackage(packages, "commercial"))?.toBeUndefined()
  })

  it("formats the supported billing periods for disclosure", () => {
    expect(formatSubscriptionPeriod("P1M")).toBe("/month")
    expect(formatSubscriptionPeriod("P1Y")).toBe("/year")
    expect(formatSubscriptionPeriod("P3M")).toBe("/3 months")
  })

  it("detects an exact active StoreKit subscription", () => {
    expect(
      isSubscriptionProductActive({ activeSubscriptions: ["farm_monthly"] }, "farm_monthly"),
    ).toBe(true)
    expect(
      isSubscriptionProductActive({ activeSubscriptions: ["farm_monthly_yearly"] }, "farm_monthly"),
    ).toBe(false)
  })

  it("detects the product attached to an active entitlement", () => {
    expect(
      isSubscriptionProductActive(
        {
          entitlements: {
            active: { farm: { productIdentifier: "farm_monthly" } },
          },
        },
        "FARM_MONTHLY",
      ),
    ).toBe(true)
  })

  it("does not treat another plan as the requested active product", () => {
    expect(
      isSubscriptionProductActive(
        {
          activeSubscriptions: ["farm_monthly"],
          entitlements: {
            active: { farm: { productIdentifier: "farm_monthly" } },
          },
        },
        "commercial_monthly",
      ),
    ).toBe(false)
  })
})
