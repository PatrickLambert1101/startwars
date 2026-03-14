import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { Organization, LivestockType } from "@/db/models/Organization"
import { OrganizationMember } from "@/db/models/OrganizationMember"
import { useAuth } from "./AuthContext"

export type CreateOrgParams = {
  name: string
  livestockTypes: LivestockType[]
  location?: string
  defaultBreeds?: Partial<Record<LivestockType, string>>
  userIdForAdmin?: string  // Pass user.id to auto-create admin membership
  userEmailForAdmin?: string
  userDisplayName?: string // User's display name for membership
}

export type DatabaseContextType = {
  currentOrg: Organization | null
  isOrgLoading: boolean
  createOrganization: (params: CreateOrgParams) => Promise<Organization>
  switchOrganization: (orgId: string) => Promise<void>
  resetDatabase: () => Promise<void>
}

const DatabaseContext = createContext<DatabaseContextType | null>(null)

export const DatabaseProvider: FC<PropsWithChildren> = ({ children }) => {
  const { user } = useAuth()
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [isOrgLoading, setIsOrgLoading] = useState(true)

  // On mount (or user change), load organizations the user is a member of
  useEffect(() => {
    const loadOrg = async () => {
      if (!user) {
        console.log("[DatabaseContext] No user, clearing current org")
        setCurrentOrg(null)
        setIsOrgLoading(false)
        return
      }

      try {
        // Get all active memberships for this user
        const memberships = await database.get<OrganizationMember>("organization_members")
          .query(
            Q.where("user_id", user.id),
            Q.where("is_active", true)
          )
          .fetch()

        console.log("[DatabaseContext] Found", memberships.length, "active memberships for user:", user.email)

        if (memberships.length === 0) {
          console.log("[DatabaseContext] User has no organization memberships")
          setCurrentOrg(null)
          setIsOrgLoading(false)
          return
        }

        // Get organization IDs from memberships
        const orgIds = memberships.map(m => m.organizationId)

        // Load organizations that the user is a member of
        const orgs = await database.get<Organization>("organizations")
          .query(
            Q.where("id", Q.oneOf(orgIds)),
            Q.where("is_deleted", false)
          )
          .fetch()

        console.log("[DatabaseContext] Found", orgs.length, "organizations for user")

        if (orgs.length > 0) {
          console.log("[DatabaseContext] Setting current org:", orgs[0].name)
          setCurrentOrg(orgs[0])
        } else {
          console.log("[DatabaseContext] No non-deleted organizations found")
          setCurrentOrg(null)
        }
      } catch (error) {
        console.error("[DatabaseContext] Error loading orgs:", error)
      }
      setIsOrgLoading(false)
    }
    loadOrg()
  }, [user])

  const createOrganization = useCallback(async (params: CreateOrgParams): Promise<Organization> => {
    const org = await database.write(async () => {
      const newOrg = await database.get<Organization>("organizations").create((o) => {
        o.name = params.name
        o.livestockTypes = params.livestockTypes
        o.location = params.location ?? null
        o.defaultBreeds = params.defaultBreeds || {}
        o.subscriptionTier = "starter" // All new organizations start on free tier
        o.subscriptionStatus = "active"
        o.subscriptionStartsAt = null
        o.subscriptionEndsAt = null
        o.isDeleted = false
      })

      // Auto-create admin membership if user info provided
      if (params.userIdForAdmin && params.userEmailForAdmin) {
        await database.get<OrganizationMember>("organization_members").create((m) => {
          m.organizationId = newOrg.id
          m.userId = params.userIdForAdmin!
          m.userEmail = params.userEmailForAdmin!
          m.userDisplayName = params.userDisplayName ?? null
          m.role = "admin"
          m.invitedBy = null
          m.invitedAt = null
          m.joinedAt = new Date()
          m.isActive = true
        })
        console.log("[DatabaseContext] Created admin membership for", params.userEmailForAdmin, "with display name:", params.userDisplayName)
      }

      return newOrg
    })
    setCurrentOrg(org)
    return org
  }, [])

  const switchOrganization = useCallback(async (orgId: string) => {
    const org = await database.get<Organization>("organizations").find(orgId)
    setCurrentOrg(org)
  }, [])

  return (
    <DatabaseContext.Provider value={{ currentOrg, isOrgLoading, createOrganization, switchOrganization }}>
      {children}
    </DatabaseContext.Provider>
  )
}

export const useDatabase = () => {
  const context = useContext(DatabaseContext)
  if (!context) throw new Error("useDatabase must be used within a DatabaseProvider")
  return context
}
