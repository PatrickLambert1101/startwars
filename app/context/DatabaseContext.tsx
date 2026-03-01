import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { Organization } from "@/db/models/Organization"

export type DatabaseContextType = {
  currentOrg: Organization | null
  isOrgLoading: boolean
  createOrganization: (name: string) => Promise<Organization>
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
        if (orgs.length > 0) {
          setCurrentOrg(orgs[0])
        }
      } catch {
        // DB not ready yet or no orgs
      }
      setIsOrgLoading(false)
    }
    loadOrg()
  }, [])

  const createOrganization = useCallback(async (name: string): Promise<Organization> => {
    const org = await database.write(async () => {
      return database.get<Organization>("organizations").create((o) => {
        o.name = name
        o.isDeleted = false
      })
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
