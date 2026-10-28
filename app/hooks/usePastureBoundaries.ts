import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"

import { useDatabase } from "@/context/DatabaseContext"
import { database } from "@/db"
import { Pasture, PastureBoundary, PastureBoundarySource } from "@/db/models"
import { getBoundaryMetrics, PastureBoundaryFeature } from "@/utils/pastureBoundary"
import type { PastureBoundaryImportPlanItem } from "@/utils/pastureBoundaryImport"

export function usePastureBoundary(pastureId: string) {
  const [boundary, setBoundary] = useState<PastureBoundary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!pastureId) {
      setBoundary(null)
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<PastureBoundary>("pasture_boundaries")
      .query(Q.where("pasture_id", pastureId), Q.where("is_deleted", false), Q.take(1))
      .observe()
      .subscribe((records) => {
        setBoundary(records[0] ?? null)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [pastureId])

  return { boundary, isLoading }
}

export function usePastureBoundaries() {
  const [boundaries, setBoundaries] = useState<PastureBoundary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentOrg } = useDatabase()

  useEffect(() => {
    if (!currentOrg) {
      setBoundaries([])
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<PastureBoundary>("pasture_boundaries")
      .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
      .observe()
      .subscribe((records) => {
        setBoundaries(records)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [currentOrg])

  return { boundaries, isLoading }
}

export function usePastureBoundaryActions() {
  const { currentOrg } = useDatabase()

  const saveBoundary = async (
    pastureId: string,
    feature: PastureBoundaryFeature,
    source: PastureBoundarySource,
    sourceName?: string,
  ): Promise<PastureBoundary> => {
    if (!currentOrg) throw new Error("No organization selected")

    const metrics = getBoundaryMetrics(feature)
    const serialized = JSON.stringify(feature)
    const now = new Date()

    return database.write(async () => {
      const existing = await database
        .get<PastureBoundary>("pasture_boundaries")
        .query(Q.where("pasture_id", pastureId), Q.take(1))
        .fetch()

      if (existing[0]) {
        await existing[0].update((record) => {
          record.boundaryGeojson = serialized
          record.boundarySource = source
          record.boundarySourceName = sourceName?.trim() || null
          record.centroidLatitude = metrics.centroidLatitude
          record.centroidLongitude = metrics.centroidLongitude
          record.calculatedAreaHectares = metrics.areaHectares
          record.boundaryUpdatedAt = now
          record.updatedAt = now
          record.isDeleted = false
        })
        return existing[0]
      }

      return database.get<PastureBoundary>("pasture_boundaries").create((record) => {
        record.organizationId = currentOrg.id
        record.pastureId = pastureId
        record.boundaryGeojson = serialized
        record.boundarySource = source
        record.boundarySourceName = sourceName?.trim() || null
        record.centroidLatitude = metrics.centroidLatitude
        record.centroidLongitude = metrics.centroidLongitude
        record.calculatedAreaHectares = metrics.areaHectares
        record.boundaryUpdatedAt = now
        record.updatedAt = now
        record.isDeleted = false
      })
    })
  }

  const clearBoundary = async (pastureId: string): Promise<void> => {
    await database.write(async () => {
      const existing = await database
        .get<PastureBoundary>("pasture_boundaries")
        .query(Q.where("pasture_id", pastureId), Q.where("is_deleted", false), Q.take(1))
        .fetch()

      if (existing[0]) {
        await existing[0].update((record) => {
          record.updatedAt = new Date()
          record.isDeleted = true
        })
      }
    })
  }

  const importNamedPastures = async (
    items: PastureBoundaryImportPlanItem[],
    source: PastureBoundarySource,
    sourceName?: string,
  ): Promise<{ created: number; updated: number }> => {
    if (!currentOrg) throw new Error("No organization selected")
    if (items.length === 0) return { created: 0, updated: 0 }

    const activePastures = await database
      .get<Pasture>("pastures")
      .query(Q.where("organization_id", currentOrg.id), Q.where("is_deleted", false))
      .fetch()
    const activeById = new Map(activePastures.map((pasture) => [pasture.id, pasture]))
    const usedCodes = new Set(activePastures.map((pasture) => pasture.code.trim().toUpperCase()))

    for (const item of items) {
      if (item.existingPastureId) {
        if (!activeById.has(item.existingPastureId)) {
          throw new Error(`The existing pasture "${item.pastureName}" could not be found.`)
        }
      } else if (usedCodes.has(item.pastureCode.trim().toUpperCase())) {
        throw new Error(`Pasture code "${item.pastureCode}" is already in use.`)
      } else {
        usedCodes.add(item.pastureCode.trim().toUpperCase())
      }
    }

    let created = 0
    let updated = 0
    const now = new Date()

    await database.write(async () => {
      const pastureCollection = database.get<Pasture>("pastures")
      const boundaryCollection = database.get<PastureBoundary>("pasture_boundaries")

      for (const item of items) {
        let targetPasture: Pasture
        if (item.existingPastureId) {
          targetPasture = activeById.get(item.existingPastureId) as Pasture
          updated += 1
        } else {
          targetPasture = await pastureCollection.create((record) => {
            record.organizationId = currentOrg.id
            record.name = item.pastureName
            record.code = item.pastureCode
            record.sizeHectares = item.candidate.areaHectares
            record.locationNotes = null
            record.forageType = null
            record.waterSource = null
            record.fenceType = null
            record.hasSaltBlocks = null
            record.hasMineralFeeders = null
            record.maxCapacity = null
            record.targetGrazingDays = 7
            record.targetRestDays = 28
            record.notes = null
            record.currentAnimalCount = 0
            record.isActive = true
            record.isDeleted = false
          })
          created += 1
        }

        const metrics = getBoundaryMetrics(item.candidate.feature)
        const serialized = JSON.stringify(item.candidate.feature)
        const existingBoundaries = await boundaryCollection
          .query(Q.where("pasture_id", targetPasture.id), Q.take(1))
          .fetch()

        if (existingBoundaries[0]) {
          await existingBoundaries[0].update((record) => {
            record.organizationId = currentOrg.id
            record.boundaryGeojson = serialized
            record.boundarySource = source
            record.boundarySourceName = sourceName?.trim() || null
            record.centroidLatitude = metrics.centroidLatitude
            record.centroidLongitude = metrics.centroidLongitude
            record.calculatedAreaHectares = metrics.areaHectares
            record.boundaryUpdatedAt = now
            record.updatedAt = now
            record.isDeleted = false
          })
        } else {
          await boundaryCollection.create((record) => {
            record.organizationId = currentOrg.id
            record.pastureId = targetPasture.id
            record.boundaryGeojson = serialized
            record.boundarySource = source
            record.boundarySourceName = sourceName?.trim() || null
            record.centroidLatitude = metrics.centroidLatitude
            record.centroidLongitude = metrics.centroidLongitude
            record.calculatedAreaHectares = metrics.areaHectares
            record.boundaryUpdatedAt = now
            record.updatedAt = now
            record.isDeleted = false
          })
        }
      }
    })

    return { created, updated }
  }

  return { saveBoundary, clearBoundary, importNamedPastures }
}
