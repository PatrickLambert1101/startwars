import { useState, useEffect } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
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
    if (!currentOrg) {
      setIsLoading(false)
      setMembers([])
      setInvites([])
      return
    }

    setNeedsSync(false)
    setIsLoading(true)

    try {
      // Load members from local database first
      const localMembers = await database
        .get<any>("organization_members")
        .query(
          Q.where("organization_id", currentOrg.id),
          Q.where("is_deleted", false)
        )
        .fetch()

      console.log("[Team] Loaded local members:", localMembers.length)

      setMembers(
        localMembers.map((m) => ({
          id: m.id,
          userId: m.userId,
          userEmail: m.userEmail || "",
          userDisplayName: m.userDisplayName,
          role: m.role,
          joinedAt: m.joinedAt?.toISOString() || m.createdAt?.toISOString() || new Date().toISOString(),
          isActive: m.isActive,
        }))
      )

      // Load pending invites from Supabase (only if org has been synced)
      if (currentOrg.remoteId && currentOrg.remoteId !== "null") {
        const { data: invitesData, error: invitesError } = await supabase
          .from("invites")
          .select("*")
          .eq("organization_id", currentOrg.remoteId)
          .gt("expires_at", new Date().toISOString())

        if (invitesError) {
          console.error("[Team] Failed to load invites:", invitesError)
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
      } else {
        setInvites([])
      }
    } catch (error) {
      console.error("[Team] Failed to load team data:", error)
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

  const inviteMember = async (
    contact: string,
    role: "admin" | "worker",
    method: "email" | "sms" | "whatsapp" = "email"
  ): Promise<{ success: boolean; error?: string; inviteCode?: string }> => {
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

      // Ensure organization exists in Supabase
      // Use remoteId if available, otherwise use id (they should be the same after sync)
      const orgId = currentOrg.remoteId || currentOrg.id

      console.log("[Team] Checking org in Supabase:", {
        orgId,
        orgName: currentOrg.name,
        remoteId: currentOrg.remoteId,
        localId: currentOrg.id
      })

      // Check if org exists in Supabase first
      const { data: orgCheck, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("id", orgId)
        .single()

      console.log("[Team] Org check result:", { orgCheck, orgError })

      if (!orgCheck) {
        return {
          success: false,
          error: "Organization not synced yet. Please wait a moment and try again."
        }
      }

      // Prepare invite data based on method
      const isPhone = method === "sms" || method === "whatsapp"
      const inviteData: any = {
        id: generateId(),
        organization_id: orgId,
        role,
        invited_by: user.id,
        invite_code: inviteCode,
        expires_at: expiresAt.toISOString(),
        invite_method: method,
      }

      if (isPhone) {
        inviteData.phone = contact.trim()
        inviteData.email = null
      } else {
        inviteData.email = contact.toLowerCase().trim()
        inviteData.phone = null
      }

      const { data, error } = await supabase
        .from("invites")
        .insert(inviteData)
        .select()
        .single()

      if (error) {
        console.error("Failed to insert invite:", error)
        if (error.code === "23505") {
          // Unique constraint violation
          return { success: false, error: `This ${isPhone ? 'phone number' : 'email'} has already been invited` }
        }
        return { success: false, error: error.message }
      }

      // Send the invite via Edge Function
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        console.warn("[Team] No session found, skipping invite send")
        return { success: true, inviteCode }
      }

      try {
        const sendResult = await supabase.functions.invoke('send-invite', {
          body: {
            inviteId: data.id,
            method,
          },
        })

        if (sendResult.error) {
          console.error("[Team] Failed to send invite:", sendResult.error)
          // Don't fail the whole operation - invite is created, just not sent
          return {
            success: true,
            inviteCode,
            error: `Invite created but failed to send: ${sendResult.error.message}`
          }
        }

        console.log("[Team] Invite sent successfully via", method)
      } catch (sendError) {
        console.error("[Team] Error calling send-invite function:", sendError)
        // Don't fail - invite is created
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
