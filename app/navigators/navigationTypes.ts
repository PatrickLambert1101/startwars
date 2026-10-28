import { ComponentProps } from "react"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import {
  CompositeScreenProps,
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

import type { AnimalStatus } from "@/db/models/Animal"
import type { DataImportType } from "@/services/dataImport/types"

// Main Tab Navigator types
export type MainTabParamList = {
  Dashboard: undefined
  HerdList:
    | {
        statuses?: AnimalStatus[]
        scannedTag?: string
        requestId?: number
      }
    | undefined
  Chute:
    | {
        mode?: "single"
        animalId?: string
        protocolId?: string
        vaccinationId?: string
        requestId?: number
      }
    | undefined
  Pastures: undefined
  Calendar: undefined
  Breeding:
    | {
        initialFilter?: "all" | "attention" | "pending" | "history"
        requestId?: number
      }
    | undefined
}

// App Stack Navigator types
export type AppStackParamList = {
  Auth: undefined
  Landing: undefined
  Login: undefined
  Main: NavigatorScreenParams<MainTabParamList>
  OrgSetup: undefined
  Team: undefined
  Settings: undefined
  DataImports: undefined
  DataImport: { importType: DataImportType }
  AnimalDetail: {
    animalId: string
    initialTab?: "overview" | "health" | "vaccinations" | "weight" | "breeding"
  }
  AnimalForm: {
    mode: "create" | "edit"
    animalId?: string
    /** Pre-fill a newly scanned tag when creating an animal from a failed lookup. */
    initialRfidTag?: string
    initialVisualTag?: string
    /** When creating from a parent card, link the saved animal immediately. */
    linkAsParentOf?: string
    parentRole?: "sire" | "dam"
  }
  BulkAnimalAdd: undefined
  HealthRecordForm: {
    animalId: string
    recordId?: string
    protocolId?: string
    vaccinationId?: string
  }
  WeightRecordForm: { animalId: string; recordId?: string }
  BreedingRecordForm: { animalId: string; recordId?: string }
  TreatmentProtocols: undefined
  ProtocolForm: { protocolId?: string }
  ProtocolDetail: { protocolId: string }
  VaccinationSchedules: undefined
  VaccinationScheduleForm: { mode: "create" | "edit"; scheduleId?: string }
  PendingVaccinations:
    | {
        initialFilter?: "attention" | "all"
      }
    | undefined
  Reports: undefined
  ReportBuilder: { templateId?: string }
  /** adHocConfig: serialized ReportConfig JSON; title shown when no template */
  ReportViewer: { templateId?: string; adHocConfig?: string; title?: string }
  PastureDetail: { pastureId: string }
  PastureForm: { pastureId?: string }
  PastureActivityForm: { pastureId: string }
  PastureActivityList: { pastureId: string }
  PastureBoundary: { pastureId: string }
  PastureKmlImport: undefined
  PasturesMap: undefined
  PastureWizard: undefined
  MovementForm: { pastureId?: string; movementType?: "move_in" | "move_out" }
  TagScanner: { callbackId?: string }
  Upgrade: undefined
  Paywall: undefined
  CustomerCenter: undefined
  IconGallery: undefined
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

export interface NavigationProps extends Partial<
  ComponentProps<typeof NavigationContainer<AppStackParamList>>
> {}
