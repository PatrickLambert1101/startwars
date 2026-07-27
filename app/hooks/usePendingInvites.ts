import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/context/AuthContext"
import { useSyncContext } from "@/context/SyncContext"
import { supabase } from "@/services/supabase"

export interface PendingInvite {
  id: string
  organizationId: string
  organizationName: string
  role: "admin" | "worker"
  invitedBy: string | null
  expiresAt: string
}

/**
 * usePendingInvites - lists farm invites addressed to the signed-in user's email
 * and lets them accept one.
 *
 * Invites are matched server-side by email (see the `list_pending_invites` RPC);
 * the invitee never enters a code. Accepting creates a membership via
 * `accept_invite_by_email`, then triggers a sync so the farm + its data pull
 * down and the DatabaseContext observer sets currentOrg.
 */
export function usePendingInvites() {
  const { user } = useAuth()
  const { queueSync } = useSyncContext()
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) {
      setInvites([])
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.rpc("list_pending_invites")
      if (error) {
        console.error("[Invites] Failed to load pending invites:", error)
        setInvites([])
      } else {
        setInvites(
          (data ?? []).map((i: any) => ({
            id: i.id,
            organizationId: i.organization_id,
            organizationName: i.organization_name,
            role: i.role,
            invitedBy: i.invited_by,
            expiresAt: i.expires_at,
          })),
        )
      }
    } catch (err) {
      console.error("[Invites] Error loading pending invites:", err)
      setInvites([])
    }

    setIsLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const accept = useCallback(
    async (inviteId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data, error } = await supabase.rpc("accept_invite_by_email", {
          invite_id_param: inviteId,
        })

        if (error) {
          console.error("[Invites] accept_invite_by_email failed:", error)
          return { success: false, error: error.message }
        }

        const result = data as { success: boolean; error?: string } | null
        if (!result?.success) {
          return { success: false, error: result?.error || "Could not accept invite" }
        }

        // Pull the new membership (and then the farm's data) down.
        queueSync()
        // Optimistically drop the accepted invite from the list.
        setInvites((prev) => prev.filter((i) => i.id !== inviteId))
        return { success: true }
      } catch (err) {
        console.error("[Invites] Error accepting invite:", err)
        return { success: false, error: "Could not accept invite" }
      }
    },
    [queueSync],
  )

  return { invites, isLoading, refetch: load, accept }
}
