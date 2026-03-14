import { useState, useEffect } from "react"
import { supabase } from "@/services/supabase"
import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"

export interface TeamMember {
  id: string
  userId: string
  userEmail: string
  userDisplayName: string | null
  role: "admin" | "worker"
  joinedAt: string
  isActive: boolean
}

export interface PendingInvite {
  id: string
  email: string
  role: "admin" | "worker"
  inviteCode: string
  expiresAt: string
  createdAt: string
}

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [needsSync, setNeedsSync] = useState(false)
  const { user } = useAuth()
  const { currentOrg } = useDatabase()

  useEffect(() => {
    if (!currentOrg || !user) {
      setIsLoading(false)
      setNeedsSync(false)
      return
    }

    loadTeamData()
  }, [currentOrg, user])

  const loadTeamData = async () => {
    if (!currentOrg || !currentOrg.remoteId || currentOrg.remoteId === "null") {
      console.log("[Team] Organization hasn't synced yet. Remote ID will be available after first sync.")
      setIsLoading(false)
      setMembers([])
      setInvites([])
      setNeedsSync(true) // Flag that org needs to sync to Supabase first
      return
    }

    setNeedsSync(false)

    console.log("[Team] Loading team data for org:", currentOrg.remoteId)
    setIsLoading(true)

    try {
      // Debug: Check current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log("[Team] Current user ID:", currentUser?.id)
      console.log("[Team] Expected user ID:", user?.id)

      // Debug: Try to see ANY memberships for this user
      const { data: allMyMemberships, error: allError } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", currentUser?.id || user?.id)
      console.log("[Team] All my memberships (should bypass org filter):", allMyMemberships?.length || 0)
      if (allError) {
        console.error("[Team] Error fetching all memberships:", allError)
      } else if (allMyMemberships && allMyMemberships.length > 0) {
        console.log("[Team] First membership:", JSON.stringify(allMyMemberships[0], null, 2))
      }

      // Load members
      console.log("[Team] Querying memberships for org:", currentOrg.remoteId)
      const { data: membersData, error: membersError } = await supabase
        .from("memberships")
        .select("*")
        .eq("organization_id", currentOrg.remoteId)

      if (membersError) {
        console.error("[Team] Failed to load members:", membersError)
        console.error("[Team] Error details:", JSON.stringify(membersError, null, 2))
      } else {
        console.log("[Team] Loaded members:", membersData?.length || 0)
        setMembers(
          (membersData || []).map((m) => ({
            id: m.id,
            userId: m.user_id,
            userEmail: m.user_email || "",
            userDisplayName: m.user_display_name,
            role: m.role,
            joinedAt: m.joined_at || m.created_at || new Date().toISOString(),
            isActive: true, // All fetched members are active
          }))
        )
      }

      // Load pending invites (not yet accepted and not expired)
      const { data: invitesData, error: invitesError } = await supabase
        .from("invites")
        .select("*")
        .eq("organization_id", currentOrg.remoteId)
        .gt("expires_at", new Date().toISOString())

      if (invitesError) {
        console.error("Failed to load invites:", invitesError)
        // Don't fail the whole load if invites fail
        setInvites([])
      } else {
        console.log("[Team] Loaded invites:", invitesData?.length || 0)
        setInvites(
          (invitesData || []).map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role,
            inviteCode: i.invite_code,
            expiresAt: i.expires_at,
            createdAt: i.created_at,
          }))
        )
      }
    } catch (error) {
      console.error("Failed to load team data:", error)
    }

    setIsLoading(false)
  }

  return {
    members,
    invites,
    isLoading,
    needsSync, // True if organization hasn't synced to Supabase yet
    refetch: loadTeamData,
  }
}

export function useTeamActions() {
  const { user } = useAuth()
  const { currentOrg } = useDatabase()

  const inviteMember = async (email: string, role: "admin" | "worker"): Promise<{ success: boolean; error?: string; inviteCode?: string }> => {
    if (!currentOrg || !user) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      // Generate invite code
      const { data: codeData, error: codeError } = await supabase.rpc("generate_invite_code")

      if (codeError || !codeData) {
        console.error("Failed to generate invite code:", codeError)
        return { success: false, error: "Failed to generate invite code" }
      }

      const inviteCode = codeData as string

      // Generate ID for invite (using WatermelonDB-style random ID)
      const generateId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let result = ''
        for (let i = 0; i < 16; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      // Create invite
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

      const { data, error } = await supabase
        .from("invites")
        .insert({
          id: generateId(),
          organization_id: currentOrg.remoteId,
          email: email.toLowerCase().trim(),
          role,
          invited_by: user.id,
          invite_code: inviteCode,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Failed to insert invite:", error)
        if (error.code === "23505") {
          // Unique constraint violation
          return { success: false, error: "This email has already been invited" }
        }
        return { success: false, error: error.message }
      }

      return { success: true, inviteCode }
    } catch (error) {
      console.error("Failed to invite member:", error)
      return { success: false, error: "Failed to send invite" }
    }
  }

  const cancelInvite = async (inviteId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentOrg || !user) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      const { error } = await supabase
        .from("invites")
        .delete()
        .eq("id", inviteId)
        .eq("organization_id", currentOrg.remoteId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to cancel invite:", error)
      return { success: false, error: "Failed to cancel invite" }
    }
  }

  const updateMemberRole = async (memberId: string, newRole: "admin" | "worker"): Promise<{ success: boolean; error?: string }> => {
    if (!currentOrg || !user) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      const { error } = await supabase
        .from("memberships")
        .update({ role: newRole })
        .eq("id", memberId)
        .eq("organization_id", currentOrg.remoteId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to update member role:", error)
      return { success: false, error: "Failed to update role" }
    }
  }

  const removeMember = async (memberId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentOrg || !user) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("id", memberId)
        .eq("organization_id", currentOrg.remoteId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to remove member:", error)
      return { success: false, error: "Failed to remove member" }
    }
  }

  return {
    inviteMember,
    cancelInvite,
    updateMemberRole,
    removeMember,
  }
}
