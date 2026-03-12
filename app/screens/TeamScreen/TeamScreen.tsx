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

interface TeamScreenProps extends AppStackScreenProps<"Team"> {}

export function TeamScreen({ navigation }: TeamScreenProps) {
  const { themed, theme: { colors } } = useAppTheme()
  const { members, invites, isLoading, refetch } = useTeam()
  const { inviteMember, cancelInvite, updateMemberRole, removeMember } = useTeamActions()
  const { user } = useAuth()

  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "worker">("worker")
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")

  const currentMember = members.find(m => m.userId === user?.id)
  const isAdmin = currentMember?.role === "admin"
  const hasNoMembership = !currentMember && members.length === 0

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError("Email is required")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setInviteError("Please enter a valid email")
      return
    }

    setIsInviting(true)
    setInviteError("")

    const result = await inviteMember(inviteEmail.trim(), inviteRole)

    if (result.success) {
      Alert.alert(
        "Invite Sent!",
        `We've sent an invitation to ${inviteEmail}.\n\nInvite code: ${result.inviteCode}\n\nThey can use this code or click the link in the email.`,
        [{ text: "OK" }]
      )
      setInviteEmail("")
      setShowInviteForm(false)
      refetch()
    } else {
      setInviteError(result.error || "Failed to send invite")
    }

    setIsInviting(false)
  }

  const handleCancelInvite = async (invite: PendingInvite) => {
    Alert.alert(
      "Cancel Invite?",
      `Cancel the invitation for ${invite.email}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            const result = await cancelInvite(invite.id)
            if (result.success) {
              refetch()
            } else {
              Alert.alert("Error", result.error || "Failed to cancel invite")
            }
          },
        },
      ]
    )
  }

  const handleChangeRole = async (member: TeamMember) => {
    const newRole = member.role === "admin" ? "worker" : "admin"

    Alert.alert(
      "Change Role?",
      `Change ${member.userDisplayName || member.userEmail} to ${newRole === "admin" ? "Admin" : "Worker"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          onPress: async () => {
            const result = await updateMemberRole(member.id, newRole)
            if (result.success) {
              refetch()
            } else {
              Alert.alert("Error", result.error || "Failed to update role")
            }
          },
        },
      ]
    )
  }

  const handleRemoveMember = async (member: TeamMember) => {
    Alert.alert(
      "Remove Team Member?",
      `Remove ${member.userDisplayName || member.userEmail} from the team?\n\nThey will lose access to this farm.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const result = await removeMember(member.id)
            if (result.success) {
              refetch()
            } else {
              Alert.alert("Error", result.error || "Failed to remove member")
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
              {isCurrentUser && <Text style={themed($youLabel)}> (You)</Text>}
            </Text>
            <View style={[
              themed($roleBadge),
              member.role === "admin" ? themed($roleBadgeAdmin) : themed($roleBadgeWorker)
            ]}>
              <Text style={themed($roleBadgeText)}>{member.role === "admin" ? "Admin" : "Worker"}</Text>
            </View>
          </View>
          {member.userDisplayName && (
            <Text style={themed($memberEmail)}>{member.userEmail}</Text>
          )}
          {member.joinedAt && (
            <Text style={themed($memberJoined)}>
              Joined {formatDate(member.joinedAt, "PP")}
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
            <Text style={themed($roleBadgeText)}>{invite.role === "admin" ? "Admin" : "Worker"}</Text>
          </View>
          {invite.expiresAt && (
            <Text style={themed($inviteExpires)}>
              Code: {invite.inviteCode} • Expires {formatDate(invite.expiresAt, "PP")}
            </Text>
          )}
        </View>
      </View>

      {isAdmin && (
        <Pressable
          onPress={() => handleCancelInvite(invite)}
          style={themed($cancelButton)}
        >
          <Text style={themed($cancelButtonText)}>Cancel</Text>
        </Pressable>
      )}
    </View>
  )

  const renderHeader = () => (
    <View style={themed($header)}>
      <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
        <Icon icon="back" size={24} />
      </Pressable>
      <Text preset="heading" style={themed($headerTitle)}>Team</Text>
    </View>
  )

  if (isLoading) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
        {renderHeader()}
        <View style={themed($content)}>
          <Text>Loading...</Text>
        </View>
      </Screen>
    )
  }

  if (!isAdmin) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
        {renderHeader()}
        <ScrollView style={themed($content)}>
          {hasNoMembership ? (
            <View style={themed($syncNotice)}>
              <Icon icon="view" size={48} color={colors.palette.accent500} />
              <Text style={themed($syncNoticeTitle)}>Sync Required</Text>
              <Text style={themed($syncNoticeText)}>
                Your farm needs to sync with the server to enable team management.{"\n\n"}
                Go to Settings and tap "Sync Now" to become an admin and start inviting team members.
              </Text>
              <Button
                text="Go to Settings"
                preset="filled"
                onPress={() => navigation.navigate("Main", { screen: "Settings" })}
                style={themed($syncNoticeButton)}
              />
            </View>
          ) : (
            <>
              <View style={themed($section)}>
                <Text style={themed($sectionTitle)}>Team Members ({members.length})</Text>
                <FlatList
                  data={members}
                  renderItem={renderMember}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
              <Text style={themed($noAccessText)}>
                Only admins can invite and manage team members.
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
            <Text style={themed($formTitle)}>Invite Team Member</Text>

            <TextField
              label="Email Address"
              value={inviteEmail}
              onChangeText={(text) => {
                setInviteEmail(text)
                setInviteError("")
              }}
              placeholder="worker@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              helper={inviteError}
              status={inviteError ? "error" : undefined}
              containerStyle={themed($formField)}
            />

            <View style={themed($roleSelector)}>
              <Text style={themed($roleSelectorLabel)}>Role</Text>
              <View style={themed($roleOptions)}>
                <Pressable
                  onPress={() => setInviteRole("worker")}
                  style={[themed($roleOption), inviteRole === "worker" && themed($roleOptionSelected)]}
                >
                  <Text style={[themed($roleOptionText), inviteRole === "worker" && themed($roleOptionTextSelected)]}>
                    Worker
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setInviteRole("admin")}
                  style={[themed($roleOption), inviteRole === "admin" && themed($roleOptionSelected)]}
                >
                  <Text style={[themed($roleOptionText), inviteRole === "admin" && themed($roleOptionTextSelected)]}>
                    Admin
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={themed($formActions)}>
              <Button
                text="Cancel"
                preset="default"
                onPress={() => {
                  setShowInviteForm(false)
                  setInviteEmail("")
                  setInviteError("")
                }}
                style={themed($formActionButton)}
              />
              <Button
                text={isInviting ? "Sending..." : "Send Invite"}
                preset="filled"
                onPress={handleInvite}
                disabled={isInviting}
                style={themed($formActionButton)}
              />
            </View>
          </View>
        ) : (
          <Button
            text="+ Invite Team Member"
            preset="filled"
            onPress={() => setShowInviteForm(true)}
            style={themed($inviteButton)}
          />
        )}

        {/* Pending Invites */}
        {invites.length > 0 && (
          <View style={themed($section)}>
            <Text style={themed($sectionTitle)}>Pending Invites ({invites.length})</Text>
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
          <Text style={themed($sectionTitle)}>Team Members ({members.length})</Text>
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
