import { FC, useState } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle, useWindowDimensions } from "react-native"

import { Screen, Text, TextField, Button } from "@/components"
import {
  HerdTrackrLogo,
  CowHeadIcon,
  ChuteIcon,
  ReportsIcon,
  BarnIcon,
  PastureIcon,
  RfidTagIcon,
  PhoneMockup,
  ScannerDevice,
  OfflineSyncIcon,
  TrustShieldIcon,
  RanchLandscape,
  VsBadge,
  CheckBadge,
  LockBadge,
} from "@/components/icons"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

// ─── Data ────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "1",
    title: "Create your ranch",
    desc: "Sign up in under a minute and configure your operation.",
  },
  {
    num: "2",
    title: "Add your herd",
    desc: "Enter animals one-by-one or scan RFID tags in batch mode.",
  },
  {
    num: "3",
    title: "Work the chute",
    desc: "Record weights, treatments, and scores chute-side — even offline.",
  },
  {
    num: "4",
    title: "Track & improve",
    desc: "View weight-gain trends, health reports, and pasture data over time.",
  },
]

const FREE_FEATURES = [
  "Unlimited animals",
  "Chute-side processing",
  "Weight & health records",
  "Breed & lineage tracking",
  "Basic reports & charts",
  "Offline-first sync",
]

const PRO_FEATURES = [
  "Everything in Free",
  "Vaccine scheduling & withdrawal tracking",
  "Pasture rotation management",
  "Automated reminders",
  "Advanced analytics",
  "Priority support",
]

const RANCH_FEATURES = [
  {
    Icon: CowHeadIcon,
    title: "Herd Management",
    desc: "RFID, ear tags, breed, DOB, lineage & status — all offline.",
    free: true,
  },
  {
    Icon: ChuteIcon,
    title: "Chute-Side Processing",
    desc: "Batch weigh, treat & score cattle with one-tap scanning.",
    free: true,
  },
  {
    Icon: ReportsIcon,
    title: "Reports & Analytics",
    desc: "Weight gain trends, breed distribution & herd health at a glance.",
    free: true,
  },
  {
    Icon: BarnIcon,
    title: "Vaccine Protocols",
    desc: "Schedule shots, track withdrawal dates & get deadline reminders.",
    free: false,
  },
  {
    Icon: PastureIcon,
    title: "Pasture Rotation",
    desc: "Map paddocks, assign herds & track grazing to optimise forage.",
    free: false,
  },
]

// ─── Component ───────────────────────────────────────────────────────

export const LandingScreen: FC<AppStackScreenProps<"Landing">> = ({ navigation }) => {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const { width: screenWidth } = useWindowDimensions()

  // Contact form state
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactMessage, setContactMessage] = useState("")

  // Pricing toggle
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const proPrice = billingCycle === "monthly" ? "$9.99" : "$7.99"
  const proPeriod = billingCycle === "monthly" ? "/month" : "/month"
  const proSavings = billingCycle === "annual" ? "Save 20% — billed $95.88/yr" : ""

  const handleContactSubmit = () => {
    if (!contactEmail.trim()) {
      Alert.alert("Missing info", "Please enter your email address.")
      return
    }
    Alert.alert(
      "Message sent!",
      "Thanks for reaching out. We'll get back to you shortly.",
      [{ text: "OK" }],
    )
    setContactName("")
    setContactEmail("")
    setContactMessage("")
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top", "bottom"]}>
      {/* ─── HERO ──────────────────────────────────────────────── */}
      <View style={themed($heroSection)}>
        <RanchLandscape
          width={Math.min(screenWidth, 420)}
          height={140}
          primaryColor={colors.tint}
          accentColor={colors.palette.accent500}
        />
        <View style={themed($heroContent)}>
          <HerdTrackrLogo size={64} color={colors.tint} accentColor={colors.tint} />
          <Text text="HerdTrackr" preset="heading" style={themed($heroTitle)} />
          <Text
            text="Cattle management that works where you do — offline-first, built for real ranchers."
            style={themed($heroSubtitle)}
          />
          <View style={themed($heroCta)}>
            <Button
              text="Get Started Free"
              preset="reversed"
              style={themed($heroBtn)}
              onPress={() => navigation.navigate("Login")}
            />
            <Pressable onPress={() => navigation.navigate("Login")} style={themed($heroLinkWrap)}>
              <Text text="Already have an account? Sign in" size="sm" style={themed($heroLink)} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* ─── SOCIAL PROOF BAR ──────────────────────────────────── */}
      <View style={themed($proofBar)}>
        <View style={themed($proofItem)}>
          <Text text="100%" preset="bold" style={themed($proofValue)} />
          <Text text="Offline" size="xxs" style={themed($proofLabel)} />
        </View>
        <View style={themed($proofDot)} />
        <View style={themed($proofItem)}>
          <Text text="iOS + Android" preset="bold" style={themed($proofValue)} />
          <Text text="Native apps" size="xxs" style={themed($proofLabel)} />
        </View>
        <View style={themed($proofDot)} />
        <View style={themed($proofItem)}>
          <Text text="Free" preset="bold" style={themed($proofValue)} />
          <Text text="To start" size="xxs" style={themed($proofLabel)} />
        </View>
      </View>

      {/* ─── MOBILE vs SCANNER ─────────────────────────────────── */}
      <View style={themed($section)}>
        <Text text="Two Ways to Work" preset="subheading" style={themed($sectionTitle)} />
        <Text
          text="Use your phone for everyday management, or pair with a handheld RFID scanner for high-speed chute processing."
          style={themed($sectionSub)}
        />

        <View style={themed($deviceRow)}>
          {/* Phone option */}
          <View style={themed($deviceCard)}>
            <PhoneMockup
              width={100}
              height={190}
              primaryColor={colors.tint}
              accentColor={colors.palette.accent500}
            />
            <Text text="Mobile App" preset="bold" style={themed($deviceTitle)} />
            <Text text="iPhone & Android" size="xs" style={themed($deviceSub)} />
            <View style={themed($deviceFeatures)}>
              <Text text="• Full herd management" size="xs" style={themed($deviceFeatureText)} />
              <Text text="• Camera-based tag reading" size="xs" style={themed($deviceFeatureText)} />
              <Text text="• Reports & analytics" size="xs" style={themed($deviceFeatureText)} />
              <Text text="• Works offline" size="xs" style={themed($deviceFeatureText)} />
            </View>
            <View style={themed($includedBadge)}>
              <Text text="INCLUDED FREE" size="xxs" style={themed($includedBadgeText)} />
            </View>
          </View>

          {/* VS */}
          <View style={themed($vsContainer)}>
            <VsBadge width={36} height={36} primaryColor={colors.tint} />
          </View>

          {/* Scanner option */}
          <View style={themed($deviceCard)}>
            <ScannerDevice
              width={100}
              height={130}
              primaryColor={colors.tint}
              accentColor={colors.palette.accent500}
            />
            <Text text="RFID Scanner" preset="bold" style={themed($deviceTitle)} />
            <Text text="Bluetooth handheld" size="xs" style={themed($deviceSub)} />
            <View style={themed($deviceFeatures)}>
              <Text text="• 200+ scans/minute" size="xs" style={themed($deviceFeatureText)} />
              <Text text="• Long-range UHF read" size="xs" style={themed($deviceFeatureText)} />
              <Text text="• Rugged & waterproof" size="xs" style={themed($deviceFeatureText)} />
              <Text text="• Pairs via Bluetooth" size="xs" style={themed($deviceFeatureText)} />
            </View>
            <View style={themed($optionalBadge)}>
              <Text text="OPTIONAL ADD-ON" size="xxs" style={themed($optionalBadgeText)} />
            </View>
          </View>
        </View>
      </View>

      {/* ─── HOW IT WORKS ──────────────────────────────────────── */}
      <View style={themed($section)}>
        <Text text="How It Works" preset="subheading" style={themed($sectionTitle)} />
        {STEPS.map((step, i) => (
          <View key={i} style={themed($stepRow)}>
            <View style={themed($stepBadge)}>
              <Text text={step.num} style={themed($stepBadgeText)} />
            </View>
            <View style={themed($stepContent)}>
              <Text text={step.title} preset="bold" />
              <Text text={step.desc} size="sm" style={themed($stepDesc)} />
            </View>
          </View>
        ))}
      </View>

      {/* ─── FEATURES ──────────────────────────────────────────── */}
      <View style={themed($section)}>
        <Text text="Everything You Need" preset="subheading" style={themed($sectionTitle)} />
        {RANCH_FEATURES.map((f, i) => (
          <View key={i} style={themed($featureCard)}>
            <View style={[themed($featureIconWrap), !f.free && { backgroundColor: colors.palette.accent100 }]}>
              <f.Icon size={26} color={f.free ? colors.tint : colors.palette.accent500} />
            </View>
            <View style={themed($featureBody)}>
              <View style={themed($featureTitleRow)}>
                <Text text={f.title} preset="bold" />
                {!f.free && <LockBadge size={16} color={colors.palette.accent500} />}
              </View>
              <Text text={f.desc} size="sm" style={themed($featureDesc)} />
            </View>
          </View>
        ))}
      </View>

      {/* ─── TRUST BADGES ──────────────────────────────────────── */}
      <View style={themed($trustRow)}>
        <View style={themed($trustItem)}>
          <OfflineSyncIcon width={40} height={40} primaryColor={colors.tint} />
          <Text text="Offline-First" size="xs" preset="bold" style={themed($trustLabel)} />
          <Text text="No signal? No problem." size="xxs" style={themed($trustDesc)} />
        </View>
        <View style={themed($trustItem)}>
          <TrustShieldIcon width={40} height={40} primaryColor={colors.tint} />
          <Text text="Secure & Private" size="xs" preset="bold" style={themed($trustLabel)} />
          <Text text="Your data stays yours." size="xxs" style={themed($trustDesc)} />
        </View>
        <View style={themed($trustItem)}>
          <RfidTagIcon size={40} color={colors.tint} />
          <Text text="RFID Ready" size="xs" preset="bold" style={themed($trustLabel)} />
          <Text text="Scan tags at speed." size="xxs" style={themed($trustDesc)} />
        </View>
      </View>

      {/* ─── PRICING ───────────────────────────────────────────── */}
      <View style={themed($section)}>
        <Text text="Simple, Transparent Pricing" preset="subheading" style={themed($sectionTitle)} />

        {/* Billing toggle */}
        <View style={themed($billingToggle)}>
          <Pressable
            onPress={() => setBillingCycle("monthly")}
            style={[themed($billingOption), billingCycle === "monthly" && themed($billingOptionActive)]}
          >
            <Text
              text="Monthly"
              size="sm"
              style={billingCycle === "monthly" ? themed($billingTextActive) : themed($billingText)}
            />
          </Pressable>
          <Pressable
            onPress={() => setBillingCycle("annual")}
            style={[themed($billingOption), billingCycle === "annual" && themed($billingOptionActive)]}
          >
            <Text
              text="Annual"
              size="sm"
              style={billingCycle === "annual" ? themed($billingTextActive) : themed($billingText)}
            />
            <View style={themed($saveBadge)}>
              <Text text="-20%" size="xxs" style={themed($saveBadgeText)} />
            </View>
          </Pressable>
        </View>

        <View style={themed($pricingRow)}>
          {/* Free tier */}
          <View style={themed($pricingCard)}>
            <Text text="Starter" preset="bold" style={themed($pricingTierName)} />
            <Text text="$0" preset="heading" style={themed($pricingAmount)} />
            <Text text="forever" size="xs" style={themed($pricingPeriod)} />
            <View style={themed($pricingDivider)} />
            {FREE_FEATURES.map((f, i) => (
              <View key={i} style={themed($pricingFeatureRow)}>
                <CheckBadge size={16} color={colors.tint} variant="filled" />
                <Text text={f} size="xs" style={themed($pricingFeatureText)} />
              </View>
            ))}
            <Button
              text="Get Started"
              preset="default"
              style={themed($pricingBtn)}
              onPress={() => navigation.navigate("Login")}
            />
          </View>

          {/* Pro tier */}
          <View style={themed($pricingCardPro)}>
            <View style={themed($popularBadge)}>
              <Text text="MOST POPULAR" size="xxs" style={themed($popularBadgeText)} />
            </View>
            <Text text="Pro" preset="bold" style={themed($pricingTierNamePro)} />
            <Text text={proPrice} preset="heading" style={themed($pricingAmountPro)} />
            <Text text={proPeriod} size="xs" style={themed($pricingPeriodPro)} />
            {proSavings ? (
              <Text text={proSavings} size="xxs" style={themed($pricingSavings)} />
            ) : null}
            <View style={themed($pricingDividerPro)} />
            {PRO_FEATURES.map((f, i) => (
              <View key={i} style={themed($pricingFeatureRow)}>
                <CheckBadge size={16} color="white" variant="filled" />
                <Text text={f} size="xs" style={themed($pricingFeatureTextPro)} />
              </View>
            ))}
            <Button
              text="Start Pro Trial"
              preset="reversed"
              style={themed($pricingBtnPro)}
              textStyle={{ color: colors.tint }}
              onPress={() => navigation.navigate("Login")}
            />
          </View>
        </View>

        {/* Ranch / Enterprise */}
        <View style={themed($enterpriseCard)}>
          <Text text="Ranch Enterprise" preset="bold" />
          <Text
            text="Multi-ranch, team accounts, API access & custom integrations. Contact us for pricing."
            size="sm"
            style={themed($enterpriseDesc)}
          />
          <Button
            text="Contact Sales"
            preset="default"
            style={themed($enterpriseBtn)}
            onPress={() => Alert.alert("Contact Sales", "Email us at sales@herdtrackr.com")}
          />
        </View>
      </View>

      {/* ─── CONTACT FORM ──────────────────────────────────────── */}
      <View style={themed($section)}>
        <Text text="Questions? Get in Touch" preset="subheading" style={themed($sectionTitle)} />
        <Text
          text="Whether you need help getting started or want to discuss enterprise plans, we're here."
          style={themed($sectionSub)}
        />

        <View style={themed($contactForm)}>
          <TextField
            label="Name"
            placeholder="Your name"
            value={contactName}
            onChangeText={setContactName}
          />
          <TextField
            label="Email"
            placeholder="you@ranch.com"
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField
            label="Message"
            placeholder="Tell us about your operation or ask a question..."
            value={contactMessage}
            onChangeText={setContactMessage}
            multiline
            numberOfLines={4}
            style={{ minHeight: 80 }}
          />
          <Button
            text="Send Message"
            preset="reversed"
            style={themed($contactBtn)}
            onPress={handleContactSubmit}
          />
        </View>
      </View>

      {/* ─── BOTTOM CTA ────────────────────────────────────────── */}
      <View style={themed($bottomCta)}>
        <HerdTrackrLogo size={48} color={colors.tint} accentColor={colors.tint} />
        <Text
          text="Join ranchers who trust HerdTrackr to run their operation."
          style={themed($bottomCtaText)}
        />
        <Button
          text="Start For Free"
          preset="reversed"
          style={themed($bottomCtaBtn)}
          onPress={() => navigation.navigate("Login")}
        />
        <Pressable onPress={() => navigation.navigate("Login")} style={{ marginTop: 8 }}>
          <Text text="Sign in to existing account" size="xs" style={themed($bottomLink)} />
        </Pressable>
      </View>
    </Screen>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

// Hero
const $heroSection: ThemedStyle<ViewStyle> = () => ({
  overflow: "hidden",
})

const $heroContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.lg,
  marginTop: -20,
})

const $heroTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginTop: spacing.sm,
  fontSize: 36,
  letterSpacing: -0.5,
})

const $heroSubtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginTop: spacing.xs,
  lineHeight: 22,
  maxWidth: 320,
})

const $heroCta: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginTop: spacing.lg,
  gap: spacing.sm,
})

const $heroBtn: ThemedStyle<ViewStyle> = () => ({
  minWidth: 220,
})

const $heroLinkWrap: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xs,
})

const $heroLink: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  textDecorationLine: "underline",
})

// Social proof bar
const $proofBar: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  gap: spacing.md,
  marginBottom: spacing.xl,
})

const $proofItem: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
})

const $proofValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 14,
})

const $proofLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $proofDot: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 4,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.separator,
})

// Sections
const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.xl,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
  textAlign: "center",
})

const $sectionSub: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.lg,
  lineHeight: 20,
})

// Devices (mobile vs scanner)
const $deviceRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  alignItems: "center",
})

const $deviceCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.md,
  alignItems: "center",
})

const $vsContainer: ThemedStyle<ViewStyle> = () => ({
  width: 36,
  alignItems: "center",
})

const $deviceTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  fontSize: 14,
})

const $deviceSub: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  marginBottom: 6,
})

const $deviceFeatures: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignSelf: "stretch",
  gap: 3,
  marginBottom: spacing.sm,
})

const $deviceFeatureText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $includedBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 2,
})

const $includedBadgeText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "700",
  letterSpacing: 0.5,
})

const $optionalBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.secondary200,
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 2,
})

const $optionalBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.secondary500,
  fontWeight: "700",
  letterSpacing: 0.5,
})

// Steps
const $stepRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: spacing.md,
  gap: spacing.sm,
})

const $stepBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 30,
  height: 30,
  borderRadius: 15,
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
  borderRadius: 14,
  padding: spacing.md,
  marginBottom: spacing.sm,
  gap: spacing.sm,
})

const $featureIconWrap: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 44,
  height: 44,
  borderRadius: 12,
  backgroundColor: colors.palette.primary100,
  alignItems: "center",
  justifyContent: "center",
})

const $featureBody: ThemedStyle<ViewStyle> = () => ({
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

// Trust badges
const $trustRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-around",
  paddingVertical: spacing.lg,
  paddingHorizontal: spacing.md,
  marginHorizontal: spacing.lg,
  marginBottom: spacing.xl,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
})

const $trustItem: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  flex: 1,
})

const $trustLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $trustDesc: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginTop: 2,
})

// Pricing
const $billingToggle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignSelf: "center",
  backgroundColor: colors.palette.neutral100,
  borderRadius: 10,
  padding: 3,
  marginBottom: spacing.lg,
})

const $billingOption: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
  borderRadius: 8,
  gap: 4,
})

const $billingOptionActive: ThemedStyle<ViewStyle> = () => ({
  backgroundColor: "#FFF",
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
})

const $billingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $billingTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "600",
})

const $saveBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.accent100,
  borderRadius: 4,
  paddingHorizontal: 4,
  paddingVertical: 1,
})

const $saveBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.accent500,
  fontWeight: "700",
})

const $pricingRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $pricingCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 20,
  padding: spacing.md,
  alignItems: "center",
})

const $pricingCardPro: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.tint,
  borderRadius: 20,
  padding: spacing.md,
  paddingTop: spacing.lg,
  alignItems: "center",
  overflow: "hidden",
})

const $popularBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: colors.palette.primary600,
  paddingVertical: 3,
  alignItems: "center",
})

const $popularBadgeText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "800",
  letterSpacing: 1,
})

const $pricingTierName: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xxs,
})

const $pricingTierNamePro: ThemedStyle<TextStyle> = ({ spacing }) => ({
  color: "#FFF",
  marginBottom: spacing.xxs,
})

const $pricingAmount: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 32,
  color: colors.text,
})

const $pricingAmountPro: ThemedStyle<TextStyle> = () => ({
  fontSize: 32,
  color: "#FFF",
})

const $pricingPeriod: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $pricingPeriodPro: ThemedStyle<TextStyle> = () => ({
  color: "rgba(255,255,255,0.7)",
})

const $pricingSavings: ThemedStyle<TextStyle> = () => ({
  color: "rgba(255,255,255,0.85)",
  marginTop: 2,
})

const $pricingDivider: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 1,
  backgroundColor: colors.separator,
  alignSelf: "stretch",
  marginVertical: spacing.sm,
})

const $pricingDividerPro: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  height: 1,
  backgroundColor: "rgba(255,255,255,0.2)",
  alignSelf: "stretch",
  marginVertical: spacing.sm,
})

const $pricingFeatureRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "stretch",
  gap: 6,
  marginBottom: 5,
})

const $pricingFeatureText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  flex: 1,
})

const $pricingFeatureTextPro: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  flex: 1,
})

const $pricingBtn: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignSelf: "stretch",
  marginTop: spacing.sm,
})

const $pricingBtnPro: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignSelf: "stretch",
  marginTop: spacing.sm,
  backgroundColor: "#FFF",
})

// Enterprise
const $enterpriseCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  marginTop: spacing.md,
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.separator,
  borderStyle: "dashed",
})

const $enterpriseDesc: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginVertical: spacing.sm,
  lineHeight: 20,
})

const $enterpriseBtn: ThemedStyle<ViewStyle> = () => ({
  minWidth: 160,
})

// Contact
const $contactForm: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  gap: spacing.sm,
})

const $contactBtn: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

// Bottom CTA
const $bottomCta: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xl,
})

const $bottomCtaText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginVertical: spacing.md,
  lineHeight: 22,
  maxWidth: 280,
})

const $bottomCtaBtn: ThemedStyle<ViewStyle> = () => ({
  minWidth: 220,
})

const $bottomLink: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  textDecorationLine: "underline",
})
