import { FC } from "react"
import { Pressable, View, ViewStyle, TextStyle, ScrollView } from "react-native"

import { Screen, Text, Button } from "@/components"
import { HerdTrackrLogo, CattleSilhouette, BarnIcon, CowHeadIcon, ChuteIcon, ReportsIcon, PastureIcon } from "@/components/icons"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

const FEATURES = [
  {
    Icon: CowHeadIcon,
    title: "Herd Management",
    desc: "Track every animal with RFID, ear tags, breed, DOB, lineage, and status. Works offline.",
    free: true,
  },
  {
    Icon: ChuteIcon,
    title: "Chute-Side Processing",
    desc: "Batch weigh, treat, and score cattle with one-tap RFID scanning in the chute.",
    free: true,
  },
  {
    Icon: ReportsIcon,
    title: "Reports & Analytics",
    desc: "Weight gain trends, breed distribution, and herd health summaries at a glance.",
    free: true,
  },
  {
    Icon: BarnIcon,
    title: "Vaccine Protocols",
    desc: "Schedule vaccinations, track withdrawal dates, and get reminders before deadlines.",
    free: false,
  },
  {
    Icon: PastureIcon,
    title: "Pasture Rotation",
    desc: "Map paddocks, assign herds, and track grazing days to optimise forage and soil health.",
    free: false,
  },
] as const

export const LandingScreen: FC<AppStackScreenProps<"Landing">> = ({ navigation }) => {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top", "bottom"]}>
      {/* Hero */}
      <View style={themed($hero)}>
        <HerdTrackrLogo size={80} color={colors.tint} accentColor={colors.tint} />
        <Text text="HerdTrackr" preset="heading" style={themed($heroTitle)} />
        <Text
          text="Cattle management that works where you do -- offline-first, built for ranchers."
          style={themed($heroSub)}
        />
      </View>

      {/* CTA buttons */}
      <View style={themed($ctaRow)}>
        <Button
          text="Get Started Free"
          preset="reversed"
          style={themed($ctaPrimary)}
          onPress={() => navigation.navigate("Login")}
        />
        <Button
          text="Sign In"
          preset="default"
          style={themed($ctaSecondary)}
          onPress={() => navigation.navigate("Login")}
        />
      </View>

      {/* How it works */}
      <View style={themed($section)}>
        <Text text="How It Works" preset="subheading" style={themed($sectionTitle)} />
        {STEPS.map((step, i) => (
          <View key={i} style={themed($stepRow)}>
            <View style={themed($stepBadge)}>
              <Text text={String(i + 1)} style={themed($stepBadgeText)} />
            </View>
            <View style={themed($stepContent)}>
              <Text text={step.title} preset="bold" />
              <Text text={step.desc} size="sm" style={themed($stepDesc)} />
            </View>
          </View>
        ))}
      </View>

      {/* Features */}
      <View style={themed($section)}>
        <Text text="Everything You Need" preset="subheading" style={themed($sectionTitle)} />
        {FEATURES.map((f, i) => (
          <View key={i} style={themed($featureCard)}>
            <View style={themed($featureIconWrap)}>
              <f.Icon size={28} color={f.free ? colors.tint : colors.palette.accent500} />
            </View>
            <View style={themed($featureContent)}>
              <View style={themed($featureTitleRow)}>
                <Text text={f.title} preset="bold" />
                {!f.free && (
                  <View style={themed($proBadge)}>
                    <Text text="PRO" size="xxs" style={themed($proBadgeText)} />
                  </View>
                )}
              </View>
              <Text text={f.desc} size="sm" style={themed($featureDesc)} />
            </View>
          </View>
        ))}
      </View>

      {/* Pricing */}
      <View style={themed($section)}>
        <Text text="Simple Pricing" preset="subheading" style={themed($sectionTitle)} />

        <View style={themed($pricingRow)}>
          {/* Free tier */}
          <View style={themed($pricingCard)}>
            <Text text="Free" preset="bold" style={themed($pricingTier)} />
            <Text text="$0" preset="heading" />
            <Text text="forever" size="xs" style={themed($pricingPeriod)} />
            <View style={themed($pricingDivider)} />
            <Text text="Unlimited animals" size="sm" style={themed($pricingItem)} />
            <Text text="Chute-side processing" size="sm" style={themed($pricingItem)} />
            <Text text="Weight & health records" size="sm" style={themed($pricingItem)} />
            <Text text="Basic reports" size="sm" style={themed($pricingItem)} />
            <Text text="Offline-first sync" size="sm" style={themed($pricingItem)} />
          </View>

          {/* Pro tier */}
          <View style={themed($pricingCardPro)}>
            <Text text="Pro" preset="bold" style={themed($pricingTierPro)} />
            <Text text="$9.99" preset="heading" style={{ color: "#FFF" }} />
            <Text text="/month" size="xs" style={themed($pricingPeriodPro)} />
            <View style={themed($pricingDividerPro)} />
            <Text text="Everything in Free, plus:" size="sm" style={themed($pricingItemPro)} />
            <Text text="Vaccine protocols" size="sm" style={themed($pricingItemPro)} />
            <Text text="Pasture rotation" size="sm" style={themed($pricingItemPro)} />
            <Text text="Withdrawal reminders" size="sm" style={themed($pricingItemPro)} />
            <Text text="Priority support" size="sm" style={themed($pricingItemPro)} />
          </View>
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={themed($bottomCta)}>
        <CattleSilhouette size={200} color={colors.tint} />
        <Text
          text="Join ranchers who trust HerdTrackr to manage their operation."
          style={themed($bottomCtaText)}
        />
        <Button
          text="Start For Free"
          preset="reversed"
          style={themed($ctaPrimary)}
          onPress={() => navigation.navigate("Login")}
        />
      </View>
    </Screen>
  )
}

const STEPS = [
  { title: "Create your ranch", desc: "Sign up and set up your organization in under a minute." },
  { title: "Add your herd", desc: "Enter animals individually or scan RFID tags in batch mode." },
  { title: "Work the chute", desc: "Record weights, treatments, and condition scores chute-side -- even offline." },
  { title: "Track & improve", desc: "See weight-gain trends, health reports, and pasture utilisation over time." },
]

// -- Styles --

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

const $hero: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xl,
  paddingBottom: spacing.lg,
})

const $heroTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginTop: spacing.sm,
  fontSize: 32,
})

const $heroSub: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginTop: spacing.xs,
  lineHeight: 22,
})

const $ctaRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "center",
  gap: spacing.md,
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.xl,
})

const $ctaPrimary: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  maxWidth: 200,
})

const $ctaSecondary: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  maxWidth: 200,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.xl,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  textAlign: "center",
})

// Steps
const $stepRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: spacing.md,
  gap: spacing.sm,
})

const $stepBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: colors.tint,
  alignItems: "center",
  justifyContent: "center",
})

const $stepBadgeText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "700",
  fontSize: 14,
})

const $stepContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $stepDesc: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  marginTop: 2,
})

// Features
const $featureCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
  gap: spacing.sm,
})

const $featureIconWrap: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 44,
  height: 44,
  borderRadius: 10,
  backgroundColor: colors.palette.primary100,
  alignItems: "center",
  justifyContent: "center",
})

const $featureContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $featureTitleRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: 2,
})

const $featureDesc: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $proBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.accent500,
  borderRadius: 4,
  paddingHorizontal: 6,
  paddingVertical: 1,
})

const $proBadgeText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "800",
})

// Pricing
const $pricingRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $pricingCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.md,
  alignItems: "center",
})

const $pricingCardPro: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.tint,
  borderRadius: 16,
  padding: spacing.md,
  alignItems: "center",
})

const $pricingTier: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $pricingTierPro: ThemedStyle<TextStyle> = ({ spacing }) => ({
  color: "#FFF",
  marginBottom: spacing.xs,
})

const $pricingPeriod: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $pricingPeriodPro: ThemedStyle<TextStyle> = () => ({
  color: "rgba(255,255,255,0.7)",
})

const $pricingDivider: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 1,
  backgroundColor: colors.separator,
  alignSelf: "stretch",
  marginVertical: spacing.sm,
})

const $pricingDividerPro: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  height: 1,
  backgroundColor: "rgba(255,255,255,0.25)",
  alignSelf: "stretch",
  marginVertical: spacing.sm,
})

const $pricingItem: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  marginBottom: 4,
})

const $pricingItemPro: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  marginBottom: 4,
})

// Bottom CTA
const $bottomCta: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg,
  opacity: 0.9,
})

const $bottomCtaText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginVertical: spacing.md,
  lineHeight: 22,
})
