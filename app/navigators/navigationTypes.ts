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
  Reports: undefined
  Settings: undefined
}

// App Stack Navigator types
export type AppStackParamList = {
  Login: undefined
  Main: NavigatorScreenParams<MainTabParamList>
  OrgSetup: undefined
  AnimalDetail: { animalId: string }
  AnimalForm: { mode: "create" | "edit"; animalId?: string }
  HealthRecordForm: { animalId: string; recordId?: string }
  WeightRecordForm: { animalId: string; recordId?: string }
  BreedingRecordForm: { animalId: string; recordId?: string }
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
