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
  const { user } = useAuth()
  const { currentOrg } = useDatabase()

  useEffect(() => {
    if (!currentOrg || !user) {
      setIsLoading(false)
      return
    }

    loadTeamData()
  }, [currentOrg, user])

  const loadTeamData = async () => {
    if (!currentOrg) return

    setIsLoading(true)

    try {
      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from("memberships")
        .select("*")
        .eq("organization_id", currentOrg.remoteId)
        .eq("is_active", true)
        .order("joined_at", { ascending: false })

      if (membersError) {
        console.error("Failed to load members:", membersError)
      } else {
        setMembers(
          (membersData || []).map((m) => ({
            id: m.id,
            userId: m.user_id,
            userEmail: m.user_email || "",
            userDisplayName: m.user_display_name,
            role: m.role,
            joinedAt: m.joined_at,
            isActive: m.is_active,
          }))
        )
      }

      // Load pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from("invites")
        .select("*")
        .eq("organization_id", currentOrg.remoteId)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })

      if (invitesError) {
        console.error("Failed to load invites:", invitesError)
      } else {
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
        return { success: false, error: "Failed to generate invite code" }
      }

      const inviteCode = codeData as string

      // Create invite
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

      const { data, error } = await supabase
        .from("invites")
        .insert({
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
        .update({ is_active: false })
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
