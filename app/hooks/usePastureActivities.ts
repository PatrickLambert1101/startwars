import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"

import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"
import { database } from "@/db"
import { PastureActivity, PastureActivityType } from "@/db/models"

export interface PastureActivityFormData {
  pastureId: string
  activityDate: Date
  activityType: PastureActivityType
  targetSpecies?: string
  areaHectares?: number
  performedBy?: string
  notes?: string
  tickLoadScore?: number
  animalsInspected?: number
}

export function usePastureActivities(pastureId: string) {
  const [activities, setActivities] = useState<PastureActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!pastureId) {
      setActivities([])
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<PastureActivity>("pasture_activities")
      .query(
        Q.where("pasture_id", pastureId),
        Q.where("is_deleted", false),
        Q.sortBy("activity_date", Q.desc),
      )
      .observe()
      .subscribe((result) => {
        setActivities(result)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [pastureId])

  return { activities, isLoading }
}

export function useAllPastureActivities() {
  const [activities, setActivities] = useState<PastureActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentOrg } = useDatabase()

  useEffect(() => {
    if (!currentOrg) {
      setActivities([])
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<PastureActivity>("pasture_activities")
      .query(
        Q.where("organization_id", currentOrg.id),
        Q.where("is_deleted", false),
        Q.sortBy("activity_date", Q.desc),
      )
      .observe()
      .subscribe((result) => {
        setActivities(result)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [currentOrg])

  return { activities, isLoading }
}

export function usePastureActivityActions() {
  const { currentOrg } = useDatabase()
  const { user } = useAuth()

  const createActivity = async (data: PastureActivityFormData): Promise<PastureActivity> => {
    if (!currentOrg) throw new Error("No organization selected")

    return database.write(async () => {
      return database.get<PastureActivity>("pasture_activities").create((activity) => {
        activity.organizationId = currentOrg.id
        activity.pastureId = data.pastureId
        activity.activityDate = data.activityDate
        activity.activityType = data.activityType
        activity.targetSpecies = data.targetSpecies?.trim() || null
        activity.areaHectares = data.areaHectares ?? null
        activity.performedBy = data.performedBy?.trim() || null
        activity.notes = data.notes?.trim() || null
        activity.photos = null
        activity.tickLoadScore = data.tickLoadScore ?? null
        activity.animalsInspected = data.animalsInspected ?? null
        activity.createdByUserId = user?.id ?? null
        activity.createdByName = user?.email ?? null
        activity.isDeleted = false
      })
    })
  }

  const deleteActivity = async (activityId: string): Promise<void> => {
    await database.write(async () => {
      const activity = await database.get<PastureActivity>("pasture_activities").find(activityId)
      await activity.update((record) => {
        record.isDeleted = true
      })
    })
  }

  return { createActivity, deleteActivity }
}
