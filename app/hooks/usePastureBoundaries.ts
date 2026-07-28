import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"

import { useDatabase } from "@/context/DatabaseContext"
import { database } from "@/db"
import { PastureBoundary, PastureBoundarySource } from "@/db/models"
import { getBoundaryMetrics, PastureBoundaryFeature } from "@/utils/pastureBoundary"

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

  return { saveBoundary, clearBoundary }
}
