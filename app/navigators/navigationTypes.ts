import { ComponentProps } from "react"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import {
  CompositeScreenProps,
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

// Main Tab Navigator types
export type MainTabParamList = {
  Dashboard: undefined
  HerdList: undefined
  Chute: undefined
  Pastures: undefined
  Calendar: undefined
  Settings: undefined
}

// App Stack Navigator types
export type AppStackParamList = {
  Auth: undefined
  Landing: undefined
  Login: undefined
  Main: NavigatorScreenParams<MainTabParamList>
  OrgSetup: undefined
  Team: undefined
  AnimalDetail: { animalId: string }
  AnimalForm: { mode: "create" | "edit"; animalId?: string }
  BulkAnimalAdd: undefined
  HealthRecordForm: { animalId: string; recordId?: string; protocolId?: string; vaccinationId?: string }
  WeightRecordForm: { animalId: string; recordId?: string }
  BreedingRecordForm: { animalId: string; recordId?: string }
  TreatmentProtocols: undefined
  ProtocolForm: { protocolId?: string }
  ProtocolDetail: { protocolId: string }
  VaccinationSchedules: undefined
  VaccinationScheduleForm: { mode: "create" | "edit"; scheduleId?: string }
  PendingVaccinations: undefined
  Reports: undefined
  PastureDetail: { pastureId: string }
  PastureForm: { pastureId?: string }
  PastureWizard: undefined
  MovementForm: { pastureId?: string; movementType?: "move_in" | "move_out" }
  TagScanner: { onTagScanned?: (tagNumber: string) => void }
  Upgrade: undefined
  Paywall: undefined
  CustomerCenter: undefined
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

export interface NavigationProps
  extends Partial<ComponentProps<typeof NavigationContainer<AppStackParamList>>> {}
