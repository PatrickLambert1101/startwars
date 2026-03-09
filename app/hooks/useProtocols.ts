import { useEffect, useState, useCallback } from "react"
import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { TreatmentProtocol, ProtocolType } from "@/db/models/TreatmentProtocol"
import { HealthRecord } from "@/db/models/HealthRecord"
import { useDatabase } from "@/context/DatabaseContext"

export type ProtocolFormData = {
  name: string
  description?: string
  protocolType: ProtocolType
  productName: string
  dosage: string
  administrationMethod?: string
  withdrawalDays?: number
  targetSpecies: string
  targetAgeMin?: number
  targetAgeMax?: number
}

export type ProtocolStats = {
  totalApplied: number
  appliedToday: number
  lastApplied: Date | null
}

/**
 * Hook to get all protocols for the current organization
 */
export function useProtocols() {
  const { currentOrg } = useDatabase()
  const [protocols, setProtocols] = useState<TreatmentProtocol[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setProtocols([])
      setIsLoading(false)
      return
    }

    const fetchProtocols = async () => {
      try {
        const results = await database
          .get<TreatmentProtocol>("treatment_protocols")
          .query(
            Q.where("organization_id", currentOrg.id),
            Q.where("is_deleted", false),
            Q.sortBy("name", Q.asc),
          )
          .fetch()
        setProtocols(results)
      } catch (error) {
        console.error("Failed to load protocols:", error)
      }
      setIsLoading(false)
    }

    fetchProtocols()

    // Subscribe to changes
    const subscription = database
      .get<TreatmentProtocol>("treatment_protocols")
      .query(
        Q.where("organization_id", currentOrg.id),
        Q.where("is_deleted", false),
      )
      .observe()
      .subscribe(setProtocols)

    return () => subscription.unsubscribe()
  }, [currentOrg])

  return { protocols, isLoading }
}

/**
 * Hook to get active protocols only
 */
export function useActiveProtocols() {
  const { currentOrg } = useDatabase()
  const [protocols, setProtocols] = useState<TreatmentProtocol[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setProtocols([])
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<TreatmentProtocol>("treatment_protocols")
      .query(
        Q.where("organization_id", currentOrg.id),
        Q.where("is_deleted", false),
        Q.where("is_active", true),
        Q.sortBy("name", Q.asc),
      )
      .observe()
      .subscribe((results) => {
        setProtocols(results)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [currentOrg])

  return { protocols, isLoading }
}

/**
 * Hook to get a single protocol by ID
 */
export function useProtocol(protocolId: string) {
  const [protocol, setProtocol] = useState<TreatmentProtocol | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!protocolId) {
      setProtocol(null)
      setIsLoading(false)
      return
    }

    const fetchProtocol = async () => {
      try {
        const result = await database.get<TreatmentProtocol>("treatment_protocols").find(protocolId)
        setProtocol(result)
      } catch (error) {
        console.error("Protocol not found:", error)
        setProtocol(null)
      }
      setIsLoading(false)
    }

    fetchProtocol()

    const subscription = database
      .get<TreatmentProtocol>("treatment_protocols")
      .findAndObserve(protocolId)
      .subscribe(setProtocol)

    return () => subscription.unsubscribe()
  }, [protocolId])

  return { protocol, isLoading }
}

/**
 * Hook to get stats for a protocol
 */
export function useProtocolStats(protocolId: string): ProtocolStats {
  const [stats, setStats] = useState<ProtocolStats>({
    totalApplied: 0,
    appliedToday: 0,
    lastApplied: null,
  })

  useEffect(() => {
    if (!protocolId) return

    const fetchStats = async () => {
      try {
        const records = await database
          .get<HealthRecord>("health_records")
          .query(
            Q.where("protocol_id", protocolId),
            Q.where("is_deleted", false),
            Q.sortBy("record_date", Q.desc),
          )
          .fetch()

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const appliedToday = records.filter(
          (r) => r.recordDate.getTime() >= today.getTime(),
        ).length

        setStats({
          totalApplied: records.length,
          appliedToday,
          lastApplied: records[0]?.recordDate || null,
        })
      } catch (error) {
        console.error("Failed to load protocol stats:", error)
      }
    }

    fetchStats()

    // Subscribe to changes in health records for this protocol
    const subscription = database
      .get<HealthRecord>("health_records")
      .query(
        Q.where("protocol_id", protocolId),
        Q.where("is_deleted", false),
      )
      .observe()
      .subscribe(() => fetchStats())

    return () => subscription.unsubscribe()
  }, [protocolId])

  return stats
}

/**
 * Common SA cattle protocols - vaccinations, dewormers, and treatments
 * that most South African cattle farmers use.
 */
const SA_DEFAULT_PROTOCOLS: ProtocolFormData[] = [
  // --- Vaccinations ---
  {
    name: "Botulism Vaccination",
    description: "Annual botulism prevention – critical in phosphorus-deficient areas",
    protocolType: "vaccination",
    productName: "Supavax (MSD)",
    dosage: "5ml per animal",
    administrationMethod: "Subcutaneous",
    withdrawalDays: 21,
    targetSpecies: "cattle",
  },
  {
    name: "Black Quarter (Blackleg)",
    description: "Clostridial disease prevention, vaccinate calves from 3 months",
    protocolType: "vaccination",
    productName: "Multivax P Plus (MSD)",
    dosage: "2ml per animal",
    administrationMethod: "Subcutaneous",
    withdrawalDays: 21,
    targetSpecies: "cattle",
    targetAgeMin: 3,
  },
  {
    name: "Lumpy Skin Disease",
    description: "Annual LSD vaccination – compulsory in many provinces",
    protocolType: "vaccination",
    productName: "Lumpy Skin Disease Vaccine (OBP)",
    dosage: "1ml per animal",
    administrationMethod: "Subcutaneous",
    withdrawalDays: 0,
    targetSpecies: "cattle",
  },
  {
    name: "Anthrax Vaccination",
    description: "Annual anthrax prevention – compulsory in endemic areas",
    protocolType: "vaccination",
    productName: "Sterne Vaccine (OBP)",
    dosage: "1ml per animal",
    administrationMethod: "Subcutaneous",
    withdrawalDays: 0,
    targetSpecies: "cattle",
  },
  {
    name: "Brucellosis (S19)",
    description: "Heifer vaccination between 4-8 months – state controlled",
    protocolType: "vaccination",
    productName: "Brucella S19 Vaccine (OBP)",
    dosage: "2ml per animal",
    administrationMethod: "Subcutaneous",
    withdrawalDays: 0,
    targetSpecies: "cattle",
    targetAgeMin: 4,
    targetAgeMax: 8,
  },
  {
    name: "Redwater & Gallsickness",
    description: "Tick-borne disease prevention in endemic areas",
    protocolType: "vaccination",
    productName: "Redwater Blood Vaccine (OBP)",
    dosage: "2ml per animal",
    administrationMethod: "Subcutaneous",
    withdrawalDays: 0,
    targetSpecies: "cattle",
  },
  // --- Deworming ---
  {
    name: "Ivermectin Deworming",
    description: "Broad-spectrum internal and external parasite control",
    protocolType: "deworming",
    productName: "Ivomec Classic (Boehringer)",
    dosage: "1ml per 50kg",
    administrationMethod: "Subcutaneous",
    withdrawalDays: 42,
    targetSpecies: "cattle",
  },
  {
    name: "Liver Fluke Treatment",
    description: "Closantel-based liver fluke and wireworm control",
    protocolType: "deworming",
    productName: "Prodose Orange (Virbac)",
    dosage: "As per weight – oral dosing gun",
    administrationMethod: "Oral",
    withdrawalDays: 28,
    targetSpecies: "cattle",
  },
  {
    name: "Combination Drench",
    description: "Broad-spectrum round and tapeworm control",
    protocolType: "deworming",
    productName: "Valbazen (Zoetis)",
    dosage: "10ml per 100kg",
    administrationMethod: "Oral",
    withdrawalDays: 14,
    targetSpecies: "cattle",
  },
  // --- Treatments ---
  {
    name: "Antibiotic – Long Acting",
    description: "General bacterial infection treatment",
    protocolType: "treatment",
    productName: "Terramycin LA (Zoetis)",
    dosage: "1ml per 10kg",
    administrationMethod: "Intramuscular",
    withdrawalDays: 28,
    targetSpecies: "cattle",
  },
  {
    name: "Tick Control – Pour-on",
    description: "External parasite (tick) control via pour-on",
    protocolType: "treatment",
    productName: "Drastic Deadline Xtra (Bayer)",
    dosage: "10ml per 100kg along backline",
    administrationMethod: "Pour-on",
    withdrawalDays: 0,
    targetSpecies: "cattle",
  },
  {
    name: "Vitamin & Mineral Supplement",
    description: "Nutritional support for stressed or production animals",
    protocolType: "treatment",
    productName: "Multimin (Virbac)",
    dosage: "1ml per 100kg",
    administrationMethod: "Subcutaneous",
    withdrawalDays: 0,
    targetSpecies: "cattle",
  },
]

/**
 * Actions for protocols
 */
export function useProtocolActions() {
  const { currentOrg } = useDatabase()

  const createProtocol = useCallback(
    async (data: ProtocolFormData) => {
      if (!currentOrg) throw new Error("No organization selected")

      return await database.write(async () => {
        return await database.get<TreatmentProtocol>("treatment_protocols").create((protocol) => {
          protocol.organizationId = currentOrg.id
          protocol.name = data.name
          protocol.description = data.description || null
          protocol.protocolType = data.protocolType
          protocol.productName = data.productName
          protocol.dosage = data.dosage
          protocol.administrationMethod = data.administrationMethod || null
          protocol.withdrawalDays = data.withdrawalDays || null
          protocol.targetSpecies = data.targetSpecies
          protocol.targetAgeMin = data.targetAgeMin || null
          protocol.targetAgeMax = data.targetAgeMax || null
          protocol.isActive = true
          protocol.isDeleted = false
        })
      })
    },
    [currentOrg],
  )

  const updateProtocol = useCallback(async (protocolId: string, data: Partial<ProtocolFormData>) => {
    return await database.write(async () => {
      const protocol = await database.get<TreatmentProtocol>("treatment_protocols").find(protocolId)
      return await protocol.update((p) => {
        if (data.name !== undefined) p.name = data.name
        if (data.description !== undefined) p.description = data.description || null
        if (data.protocolType !== undefined) p.protocolType = data.protocolType
        if (data.productName !== undefined) p.productName = data.productName
        if (data.dosage !== undefined) p.dosage = data.dosage
        if (data.administrationMethod !== undefined) p.administrationMethod = data.administrationMethod || null
        if (data.withdrawalDays !== undefined) p.withdrawalDays = data.withdrawalDays || null
        if (data.targetSpecies !== undefined) p.targetSpecies = data.targetSpecies
        if (data.targetAgeMin !== undefined) p.targetAgeMin = data.targetAgeMin || null
        if (data.targetAgeMax !== undefined) p.targetAgeMax = data.targetAgeMax || null
      })
    })
  }, [])

  const toggleProtocolActive = useCallback(async (protocolId: string) => {
    return await database.write(async () => {
      const protocol = await database.get<TreatmentProtocol>("treatment_protocols").find(protocolId)
      return await protocol.update((p) => {
        p.isActive = !p.isActive
      })
    })
  }, [])

  const deleteProtocol = useCallback(async (protocolId: string) => {
    return await database.write(async () => {
      const protocol = await database.get<TreatmentProtocol>("treatment_protocols").find(protocolId)
      return await protocol.update((p) => {
        p.isDeleted = true
      })
    })
  }, [])

  const duplicateProtocol = useCallback(
    async (protocolId: string) => {
      if (!currentOrg) throw new Error("No organization selected")

      return await database.write(async () => {
        const original = await database.get<TreatmentProtocol>("treatment_protocols").find(protocolId)
        return await database.get<TreatmentProtocol>("treatment_protocols").create((protocol) => {
          protocol.organizationId = currentOrg.id
          protocol.name = `${original.name} (Copy)`
          protocol.description = original.description
          protocol.protocolType = original.protocolType
          protocol.productName = original.productName
          protocol.dosage = original.dosage
          protocol.administrationMethod = original.administrationMethod
          protocol.withdrawalDays = original.withdrawalDays
          protocol.targetSpecies = original.targetSpecies
          protocol.targetAgeMin = original.targetAgeMin
          protocol.targetAgeMax = original.targetAgeMax
          protocol.isActive = false
          protocol.isDeleted = false
        })
      })
    },
    [currentOrg],
  )

  const seedDefaultProtocols = useCallback(
    async () => {
      if (!currentOrg) throw new Error("No organization selected")

      const existing = await database
        .get<TreatmentProtocol>("treatment_protocols")
        .query(
          Q.where("organization_id", currentOrg.id),
          Q.where("is_deleted", false),
        )
        .fetchCount()

      if (existing > 0) return 0

      await database.write(async () => {
        const batch = SA_DEFAULT_PROTOCOLS.map((data) =>
          database.get<TreatmentProtocol>("treatment_protocols").prepareCreate((protocol) => {
            protocol.organizationId = currentOrg.id
            protocol.name = data.name
            protocol.description = data.description || null
            protocol.protocolType = data.protocolType
            protocol.productName = data.productName
            protocol.dosage = data.dosage
            protocol.administrationMethod = data.administrationMethod || null
            protocol.withdrawalDays = data.withdrawalDays || null
            protocol.targetSpecies = data.targetSpecies
            protocol.targetAgeMin = data.targetAgeMin || null
            protocol.targetAgeMax = data.targetAgeMax || null
            protocol.isActive = true
            protocol.isDeleted = false
          }),
        )
        await database.batch(...batch)
      })

      return SA_DEFAULT_PROTOCOLS.length
    },
    [currentOrg],
  )

  return {
    createProtocol,
    updateProtocol,
    toggleProtocolActive,
    deleteProtocol,
    duplicateProtocol,
    seedDefaultProtocols,
  }
}
