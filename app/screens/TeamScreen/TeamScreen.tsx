import React, { useState } from "react"
import { View, ViewStyle, TextStyle, ScrollView, Pressable, FlatList, Alert } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Screen, Text, Button, Icon, TextField } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { AppStackScreenProps } from "@/navigators"
import { useTeam, useTeamActions, TeamMember, PendingInvite } from "@/hooks/useTeam"
import { formatDate } from "@/utils/formatDate"
import { useAuth } from "@/context/AuthContext"
import { useTranslation } from "react-i18next"
import { useSync } from "@/hooks/useSync"
import { useDatabase } from "@/context/DatabaseContext"

interface TeamScreenProps extends AppStackScreenProps<"Team"> {}

export function TeamScreen({ navigation }: TeamScreenProps) {
  const { t } = useTranslation()
  const { themed, theme: { colors } } = useAppTheme()
  const { members, invites, isLoading, needsSync, refetch } = useTeam()
  const { inviteMember, cancelInvite, updateMemberRole, removeMember } = useTeamActions()
  const { user } = useAuth()
  const { sync, status: syncStatus, error: syncError } = useSync()
  const { currentOrg } = useDatabase()

  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteContact, setInviteContact] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "worker">("worker")
  const [inviteMethod, setInviteMethod] = useState<"email" | "sms" | "whatsapp">("email")
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")

  const currentMember = members.find(m => m.userId === user?.id)
  const isAdmin = currentMember?.role === "admin"
  const hasNoMembership = !currentMember && members.length === 0

  const handleInvite = async () => {
    if (!inviteContact.trim()) {
      setInviteError(t("teamScreen.inviteForm.errors.contactRequired"))
      return
    }

    // Validate based on method
    if (inviteMethod === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteContact)) {
        setInviteError(t("teamScreen.inviteForm.errors.invalidEmail"))
        return
      }
    } else {
      // Basic phone validation (allow +27, 27, 0, etc.)
      if (!/^[\d+\s\-()]+$/.test(inviteContact)) {
        setInviteError(t("teamScreen.inviteForm.errors.invalidPhone"))
        return
      }
    }

    setIsInviting(true)
    setInviteError("")

    const result = await inviteMember(inviteContact.trim(), inviteRole, inviteMethod)

    if (result.success) {
      const contactLabel = inviteMethod === "email" ? inviteContact : inviteContact
      Alert.alert(
        t("teamScreen.alerts.inviteSent.title"),
        t("teamScreen.alerts.inviteSent.message", { contact: contactLabel, code: result.inviteCode, method: inviteMethod }),
        [{ text: t("teamScreen.alerts.inviteSent.ok") }]
      )
      setInviteContact("")
      setShowInviteForm(false)
      refetch()
    } else {
      setInviteError(result.error || t("teamScreen.inviteForm.errors.failedToSend"))
    }

    setIsInviting(false)
  }

  const handleCancelInvite = async (invite: PendingInvite) => {
    Alert.alert(
      t("teamScreen.alerts.cancelInvite.title"),
      t("teamScreen.alerts.cancelInvite.message", { email: invite.email }),
      [
        { text: t("teamScreen.alerts.cancelInvite.no"), style: "cancel" },
        {
          text: t("teamScreen.alerts.cancelInvite.yes"),
          style: "destructive",
          onPress: async () => {
            const result = await cancelInvite(invite.id)
            if (result.success) {
              refetch()
            } else {
              Alert.alert(
                t("teamScreen.alerts.error.title"),
                result.error || t("teamScreen.alerts.error.cancelInviteFailed")
              )
            }
          },
        },
      ]
    )
  }

  const handleChangeRole = async (member: TeamMember) => {
    const newRole = member.role === "admin" ? "worker" : "admin"
    const roleText = newRole === "admin" ? t("teamScreen.member.roleAdmin") : t("teamScreen.member.roleWorker")

    Alert.alert(
      t("teamScreen.alerts.changeRole.title"),
      t("teamScreen.alerts.changeRole.message", {
        name: member.userDisplayName || member.userEmail,
        role: roleText
      }),
      [
        { text: t("teamScreen.alerts.changeRole.cancel"), style: "cancel" },
        {
          text: t("teamScreen.alerts.changeRole.change"),
          onPress: async () => {
            const result = await updateMemberRole(member.id, newRole)
            if (result.success) {
              refetch()
            } else {
              Alert.alert(
                t("teamScreen.alerts.error.title"),
                result.error || t("teamScreen.alerts.error.updateRoleFailed")
              )
            }
          },
        },
      ]
    )
  }

  const handleRemoveMember = async (member: TeamMember) => {
    Alert.alert(
      t("teamScreen.alerts.removeMember.title"),
      t("teamScreen.alerts.removeMember.message", { name: member.userDisplayName || member.userEmail }),
      [
        { text: t("teamScreen.alerts.removeMember.cancel"), style: "cancel" },
        {
          text: t("teamScreen.alerts.removeMember.remove"),
          style: "destructive",
          onPress: async () => {
            const result = await removeMember(member.id)
            if (result.success) {
              refetch()
            } else {
              Alert.alert(
                t("teamScreen.alerts.error.title"),
                result.error || t("teamScreen.alerts.error.removeMemberFailed")
              )
            }
          },
        },
      ]
    )
  }

  const renderMember = ({ item: member }: { item: TeamMember }) => {
    const isCurrentUser = member.userId === user?.id

    return (
      <View style={themed($memberRow)}>
        <View style={themed($memberInfo)}>
          <View style={themed($memberHeader)}>
            <Text style={themed($memberName)}>
              {member.userDisplayName || member.userEmail}
              {isCurrentUser && <Text style={themed($youLabel)}>{t("teamScreen.member.you")}</Text>}
            </Text>
            <View style={[
              themed($roleBadge),
              member.role === "admin" ? themed($roleBadgeAdmin) : themed($roleBadgeWorker)
            ]}>
              <Text style={themed($roleBadgeText)}>
                {member.role === "admin" ? t("teamScreen.member.roleAdmin") : t("teamScreen.member.roleWorker")}
              </Text>
            </View>
          </View>
          {member.userDisplayName && (
            <Text style={themed($memberEmail)}>{member.userEmail}</Text>
          )}
          {member.joinedAt && (
            <Text style={themed($memberJoined)}>
              {t("teamScreen.member.joined", { date: formatDate(member.joinedAt, "PP") })}
            </Text>
          )}
        </View>

        {isAdmin && !isCurrentUser && (
          <View style={themed($memberActions)}>
            <Pressable
              onPress={() => handleChangeRole(member)}
              style={themed($actionButton)}
            >
              <Text style={themed($actionButtonText)}>
                {member.role === "admin" ? "↓" : "↑"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleRemoveMember(member)}
              style={themed($actionButtonDanger)}
            >
              <MaterialCommunityIcons name="close" size={18} color="#FFF" />
            </Pressable>
          </View>
        )}
      </View>
    )
  }

  const renderInvite = ({ item: invite }: { item: PendingInvite }) => (
    <View style={themed($inviteRow)}>
      <View style={themed($inviteInfo)}>
        <Text style={themed($inviteEmail)}>{invite.email}</Text>
        <View style={themed($inviteDetails)}>
          <View style={[
            themed($roleBadge),
            invite.role === "admin" ? themed($roleBadgeAdmin) : themed($roleBadgeWorker)
          ]}>
            <Text style={themed($roleBadgeText)}>
              {invite.role === "admin" ? t("teamScreen.member.roleAdmin") : t("teamScreen.member.roleWorker")}
            </Text>
          </View>
          {invite.expiresAt && (
            <Text style={themed($inviteExpires)}>
              {t("teamScreen.invite.code", { code: invite.inviteCode })} • {t("teamScreen.invite.expires", { date: formatDate(invite.expiresAt, "PP") })}
            </Text>
          )}
        </View>
      </View>

      {isAdmin && (
        <Pressable
          onPress={() => handleCancelInvite(invite)}
          style={themed($cancelButton)}
        >
          <Text style={themed($cancelButtonText)}>{t("teamScreen.invite.cancelButton")}</Text>
        </Pressable>
      )}
    </View>
  )

  const renderHeader = () => (
    <View style={themed($header)}>
      <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
        <Icon icon="back" size={24} />
      </Pressable>
      <Text preset="heading" style={themed($headerTitle)}>{t("teamScreen.title")}</Text>
    </View>
  )

  if (isLoading) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
        {renderHeader()}
        <View style={themed($content)}>
          <Text>{t("teamScreen.loading")}</Text>
        </View>
      </Screen>
    )
  }

  // Handle manual sync
  const handleManualSync = async () => {
    console.log("[Team] Manual sync triggered")
    const result = await sync()
    if (result.success) {
      console.log("[Team] Sync completed successfully")
      // Wait a bit for data to propagate, then refetch
      setTimeout(() => refetch(), 1000)
    } else {
      console.error("[Team] Sync failed:", result.error)
      Alert.alert("Sync Failed", result.error || "Unable to sync. Please try again.")
    }
  }

  // Show syncing message if organization hasn't synced yet
  if (needsSync) {
    const isSyncing = syncStatus === "syncing"
    const hasSyncError = syncStatus === "error"

    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
        {renderHeader()}
        <View style={themed($content)}>
          <View style={themed($syncNotice)}>
            {isSyncing ? (
              <>
                <MaterialCommunityIcons name="cloud-sync" size={48} color={colors.palette.primary500} />
                <Text style={themed($syncNoticeTitle)}>Syncing Organization...</Text>
                <Text style={themed($syncNoticeText)}>
                  Pushing your organization "{currentOrg?.name}" to the cloud. This usually takes just a few seconds.
                </Text>
              </>
            ) : hasSyncError ? (
              <>
                <MaterialCommunityIcons name="cloud-alert" size={48} color={colors.error} />
                <Text style={themed($syncNoticeTitle)}>Sync Error</Text>
                <Text style={themed($syncNoticeText)}>
                  {syncError || "Unable to sync organization to the cloud."}
                </Text>
                <Text style={themed($syncDebugText)}>
                  Org: {currentOrg?.name} ({currentOrg?.id})
                  {"\n"}Remote ID: {currentOrg?.remoteId || "null"}
                </Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="cloud-off-outline" size={48} color={colors.palette.accent500} />
                <Text style={themed($syncNoticeTitle)}>Organization Not Synced</Text>
                <Text style={themed($syncNoticeText)}>
                  Your organization "{currentOrg?.name}" needs to be synced to the cloud before you can use team features.
                </Text>
              </>
            )}
            <Button
              text={isSyncing ? "Syncing..." : "Sync Now"}
              preset="filled"
              onPress={handleManualSync}
              disabled={isSyncing}
              style={themed($syncNoticeButton)}
            />
          </View>
        </View>
      </Screen>
    )
  }

  if (!isAdmin) {
    const isSyncing = syncStatus === "syncing"

    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
        {renderHeader()}
        <ScrollView style={themed($content)}>
          {hasNoMembership ? (
            <View style={themed($syncNotice)}>
              <MaterialCommunityIcons name="account-off-outline" size={48} color={colors.palette.accent500} />
              <Text style={themed($syncNoticeTitle)}>No Team Access</Text>
              <Text style={themed($syncNoticeText)}>
                You don't appear to be a member of this organization. Try syncing to refresh your team membership from the cloud.
              </Text>
              <Button
                text={isSyncing ? "Syncing..." : "Sync Now"}
                preset="filled"
                onPress={handleManualSync}
                disabled={isSyncing}
                style={themed($syncNoticeButton)}
              />
              <Button
                text="Go to Settings"
                preset="default"
                onPress={() => navigation.navigate("Main", { screen: "Settings" })}
                style={themed($syncNoticeButton)}
              />
            </View>
          ) : (
            <>
              <View style={themed($section)}>
                <Text style={themed($sectionTitle)}>
                  {t("teamScreen.sections.members", { count: members.length })}
                </Text>
                <FlatList
                  data={members}
                  renderItem={renderMember}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
              <Text style={themed($noAccessText)}>
                {t("teamScreen.noAccess.text")}
              </Text>
            </>
          )}
        </ScrollView>
      </Screen>
    )
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      {renderHeader()}
      <ScrollView style={themed($content)} showsVerticalScrollIndicator={false}>
        {/* Invite Form */}
        {showInviteForm ? (
          <View style={themed($inviteForm)}>
            <Text style={themed($formTitle)}>{t("teamScreen.inviteForm.title")}</Text>

            {/* Method Selector */}
            <View style={themed($roleSelector)}>
              <Text style={themed($roleSelectorLabel)}>{t("teamScreen.inviteForm.methodLabel")}</Text>
              <View style={themed($roleOptions)}>
                <Pressable
                  onPress={() => setInviteMethod("email")}
                  style={[themed($roleOption), inviteMethod === "email" && themed($roleOptionSelected)]}
                >
                  <Icon icon="email" size={16} style={{ marginRight: 6 }} />
                  <Text style={[themed($roleOptionText), inviteMethod === "email" && themed($roleOptionTextSelected)]}>
                    {t("teamScreen.inviteForm.methodEmail")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setInviteMethod("sms")}
                  style={[themed($roleOption), inviteMethod === "sms" && themed($roleOptionSelected)]}
                >
                  <Icon icon="message" size={16} style={{ marginRight: 6 }} />
                  <Text style={[themed($roleOptionText), inviteMethod === "sms" && themed($roleOptionTextSelected)]}>
                    {t("teamScreen.inviteForm.methodSMS")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setInviteMethod("whatsapp")}
                  style={[themed($roleOption), inviteMethod === "whatsapp" && themed($roleOptionSelected)]}
                >
                  <MaterialCommunityIcons
                    name="whatsapp"
                    size={16}
                    color={inviteMethod === "whatsapp" ? colors.tint : colors.text}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[themed($roleOptionText), inviteMethod === "whatsapp" && themed($roleOptionTextSelected)]}>
                    {t("teamScreen.inviteForm.methodWhatsApp")}
                  </Text>
                </Pressable>
              </View>
            </View>

            <TextField
              label={inviteMethod === "email"
                ? t("teamScreen.inviteForm.emailLabel")
                : t("teamScreen.inviteForm.phoneLabel")
              }
              value={inviteContact}
              onChangeText={(text) => {
                setInviteContact(text)
                setInviteError("")
              }}
              placeholder={inviteMethod === "email"
                ? t("teamScreen.inviteForm.emailPlaceholder")
                : t("teamScreen.inviteForm.phonePlaceholder")
              }
              keyboardType={inviteMethod === "email" ? "email-address" : "phone-pad"}
              autoCapitalize="none"
              autoComplete={inviteMethod === "email" ? "email" : "tel"}
              autoCorrect={false}
              helper={inviteError}
              status={inviteError ? "error" : undefined}
              containerStyle={themed($formField)}
            />

            <View style={themed($roleSelector)}>
              <Text style={themed($roleSelectorLabel)}>{t("teamScreen.inviteForm.roleLabel")}</Text>
              <View style={themed($roleOptions)}>
                <Pressable
                  onPress={() => setInviteRole("worker")}
                  style={[themed($roleOption), inviteRole === "worker" && themed($roleOptionSelected)]}
                >
                  <Text style={[themed($roleOptionText), inviteRole === "worker" && themed($roleOptionTextSelected)]}>
                    {t("teamScreen.inviteForm.roleWorker")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setInviteRole("admin")}
                  style={[themed($roleOption), inviteRole === "admin" && themed($roleOptionSelected)]}
                >
                  <Text style={[themed($roleOptionText), inviteRole === "admin" && themed($roleOptionTextSelected)]}>
                    {t("teamScreen.inviteForm.roleAdmin")}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={themed($formActions)}>
              <Button
                text={t("teamScreen.inviteForm.cancelButton")}
                preset="default"
                onPress={() => {
                  setShowInviteForm(false)
                  setInviteContact("")
                  setInviteError("")
                }}
                style={themed($formActionButton)}
              />
              <Button
                text={isInviting ? t("teamScreen.inviteForm.sending") : t("teamScreen.inviteForm.sendButton")}
                preset="filled"
                onPress={handleInvite}
                disabled={isInviting}
                style={themed($formActionButton)}
              />
            </View>
          </View>
        ) : (
          <Button
            text={t("teamScreen.inviteButton")}
            preset="filled"
            onPress={() => setShowInviteForm(true)}
            style={themed($inviteButton)}
          />
        )}

        {/* Pending Invites */}
        {invites.length > 0 && (
          <View style={themed($section)}>
            <Text style={themed($sectionTitle)}>
              {t("teamScreen.sections.pendingInvites", { count: invites.length })}
            </Text>
            <FlatList
              data={invites}
              renderItem={renderInvite}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Team Members */}
        <View style={themed($section)}>
          <Text style={themed($sectionTitle)}>
            {t("teamScreen.sections.teamMembers", { count: members.length })}
          </Text>
          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginTop: spacing.md,
  marginBottom: spacing.sm,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
  marginLeft: -spacing.xs,
})

const $headerTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  flex: 1,
  marginLeft: spacing.xs,
})

const $content: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $inviteButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $inviteForm: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.lg,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $formTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 18,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.md,
})

const $formField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $roleSelector: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $roleSelectorLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.xs,
})

const $roleOptions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $roleOption: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: 8,
  borderWidth: 2,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.background,
  alignItems: "center",
})

const $roleOptionSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $roleOptionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 15,
  fontWeight: "500",
  color: colors.palette.neutral600,
})

const $roleOptionTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
  fontWeight: "600",
})

const $formActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $formActionButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $section: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.sm,
})

const $memberRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
})

const $memberInfo: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $memberHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: 2,
})

const $memberName: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
})

const $youLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "normal",
  color: colors.palette.neutral500,
})

const $memberEmail: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  color: colors.palette.neutral600,
  marginTop: 2,
})

const $memberJoined: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.neutral500,
  marginTop: 2,
})

const $roleBadge: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
  borderRadius: 4,
})

const $roleBadgeAdmin: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
})

const $roleBadgeWorker: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral400,
})

const $roleBadgeText: ThemedStyle<TextStyle> = () => ({
  fontSize: 11,
  fontWeight: "600",
  color: "white",
  textTransform: "uppercase",
})

const $memberActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})

const $actionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.palette.neutral200,
  alignItems: "center",
  justifyContent: "center",
})

const $actionButtonDanger: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.palette.angry100,
  alignItems: "center",
  justifyContent: "center",
})

const $actionButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.palette.neutral700,
})

const $inviteRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
})

const $inviteInfo: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $inviteEmail: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 15,
  fontWeight: "500",
  color: colors.text,
  marginBottom: 4,
})

const $inviteDetails: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  flexWrap: "wrap",
})

const $inviteExpires: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.neutral500,
})

const $cancelButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 6,
  backgroundColor: colors.palette.angry100,
})

const $cancelButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  fontWeight: "600",
  color: colors.palette.angry500,
})

const $noAccessText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.palette.neutral600,
  textAlign: "center",
  marginTop: spacing.lg,
})

const $syncNotice: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.xl,
  marginTop: spacing.lg,
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $syncNoticeTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 20,
  fontWeight: "700",
  color: colors.text,
  marginTop: spacing.md,
  marginBottom: spacing.xs,
})

const $syncNoticeText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 15,
  color: colors.textDim,
  textAlign: "center",
  lineHeight: 22,
  marginBottom: spacing.lg,
})

const $syncNoticeButton: ThemedStyle<ViewStyle> = () => ({
  minWidth: 200,
})

const $syncDebugText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 11,
  color: colors.textDim,
  fontFamily: "monospace",
  marginTop: spacing.md,
  textAlign: "center",
  backgroundColor: colors.palette.neutral100,
  padding: spacing.sm,
  borderRadius: 8,
})
