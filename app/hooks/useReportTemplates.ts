import { useEffect, useState } from "react"
import { Q } from "@nozbe/watermelondb"

import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"
import { database } from "@/db"
import { ReportTemplate } from "@/db/models"
import type { ReportConfig } from "@/services/reports/reportConfig"

export interface ReportTemplateFormData {
  name: string
  description?: string | null
  config: ReportConfig
}

/** Live list of the org's saved report templates, most recently used first. */
export function useReportTemplates() {
  const { currentOrg } = useDatabase()
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrg) {
      setTemplates([])
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<ReportTemplate>("report_templates")
      .query(
        Q.where("organization_id", currentOrg.id),
        Q.where("is_deleted", false),
        Q.sortBy("updated_at", Q.desc),
      )
      .observe()
      .subscribe((result) => {
        setTemplates(result)
        setIsLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [currentOrg])

  return { templates, isLoading }
}

export function useReportTemplate(templateId: string | undefined) {
  const [template, setTemplate] = useState<ReportTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(templateId))

  useEffect(() => {
    if (!templateId) {
      setTemplate(null)
      setIsLoading(false)
      return
    }

    const subscription = database
      .get<ReportTemplate>("report_templates")
      .findAndObserve(templateId)
      .subscribe({
        next: (result) => {
          setTemplate(result)
          setIsLoading(false)
        },
        error: () => {
          setTemplate(null)
          setIsLoading(false)
        },
      })

    return () => subscription.unsubscribe()
  }, [templateId])

  return { template, isLoading }
}

export function useReportTemplateActions() {
  const { currentOrg } = useDatabase()
  const { user } = useAuth()

  const createTemplate = async (data: ReportTemplateFormData): Promise<ReportTemplate> => {
    if (!currentOrg) throw new Error("No organization selected")

    return database.write(async () => {
      return database.get<ReportTemplate>("report_templates").create((template) => {
        template.organizationId = currentOrg.id
        template.name = data.name.trim()
        template.description = data.description?.trim() || null
        template.reportType = "custom"
        template.filters = JSON.stringify(data.config.filters)
        template.groupBy = data.config.groupBy
        template.sections = JSON.stringify(data.config.sections)
        template.columns = JSON.stringify(data.config.columns)
        template.createdByUserId = user?.id ?? null
        template.isDeleted = false
      })
    })
  }

  const updateTemplate = async (
    templateId: string,
    data: ReportTemplateFormData,
  ): Promise<void> => {
    await database.write(async () => {
      const template = await database.get<ReportTemplate>("report_templates").find(templateId)
      await template.update((t) => {
        t.name = data.name.trim()
        t.description = data.description?.trim() || null
        t.filters = JSON.stringify(data.config.filters)
        t.groupBy = data.config.groupBy
        t.sections = JSON.stringify(data.config.sections)
        t.columns = JSON.stringify(data.config.columns)
      })
    })
  }

  const touchLastRun = async (templateId: string): Promise<void> => {
    await database.write(async () => {
      const template = await database.get<ReportTemplate>("report_templates").find(templateId)
      await template.update((t) => {
        t.lastRunAt = new Date()
      })
    })
  }

  const deleteTemplate = async (templateId: string): Promise<void> => {
    await database.write(async () => {
      const template = await database.get<ReportTemplate>("report_templates").find(templateId)
      await template.update((t) => {
        t.isDeleted = true
      })
    })
  }

  return { createTemplate, updateTemplate, touchLastRun, deleteTemplate }
}
