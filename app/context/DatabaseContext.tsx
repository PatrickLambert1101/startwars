import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { Organization, LivestockType } from "@/db/models/Organization"
import { OrganizationMember } from "@/db/models/OrganizationMember"

export type CreateOrgParams = {
  name: string
  livestockTypes: LivestockType[]
  location?: string
  userIdForAdmin?: string  // Pass user.id to auto-create admin membership
  userEmailForAdmin?: string
}

export type DatabaseContextType = {
  currentOrg: Organization | null
  isOrgLoading: boolean
  createOrganization: (params: CreateOrgParams) => Promise<Organization>
  switchOrganization: (orgId: string) => Promise<void>
}

const DatabaseContext = createContext<DatabaseContextType | null>(null)

export const DatabaseProvider: FC<PropsWithChildren> = ({ children }) => {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [isOrgLoading, setIsOrgLoading] = useState(true)

  // On mount, load the first (or only) organization
  useEffect(() => {
    const loadOrg = async () => {
      try {
        const orgs = await database.get<Organization>("organizations")
          .query(Q.where("is_deleted", false))
          .fetch()
        console.log("[DatabaseContext] Found", orgs.length, "organizations")
        if (orgs.length > 0) {
          console.log("[DatabaseContext] Setting current org:", orgs[0].name)
          setCurrentOrg(orgs[0])
        } else {
          console.log("[DatabaseContext] No organizations found")
        }
      } catch (error) {
        console.error("[DatabaseContext] Error loading orgs:", error)
      }
      setIsOrgLoading(false)
    }
    loadOrg()
  }, [])

  const createOrganization = useCallback(async (params: CreateOrgParams): Promise<Organization> => {
    const org = await database.write(async () => {
      const newOrg = await database.get<Organization>("organizations").create((o) => {
        o.name = params.name
        o.livestockTypes = params.livestockTypes
        o.location = params.location ?? null
        o.isDeleted = false
      })

      // Auto-create admin membership if user info provided
      if (params.userIdForAdmin && params.userEmailForAdmin) {
        await database.get<OrganizationMember>("organization_members").create((m) => {
          m.organizationId = newOrg.id
          m.userId = params.userIdForAdmin!
          m.userEmail = params.userEmailForAdmin!
          m.userDisplayName = null
          m.role = "admin"
          m.invitedBy = null
          m.invitedAt = null
          m.joinedAt = new Date()
          m.isActive = true
        })
        console.log("[DatabaseContext] Created admin membership for", params.userEmailForAdmin)
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
