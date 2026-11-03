import { loadString, saveString } from "@/utils/storage"

export const RFID_READ_POWER_STORAGE_KEY = "rfid_reader_power"
export const RFID_READ_POWER_MIN_DBM = 5
export const RFID_READ_POWER_MAX_DBM = 30
export const RFID_READ_POWER_DEFAULT_DBM = 18

export const RFID_REGION_STORAGE_KEY = "rfid_reader_region"
export const RFID_REGION_DEFAULT = "ZA"
export type RfidRegion = "ZA" | "US"

export function clampRfidReadPower(powerDbm: number): number {
  return Math.max(RFID_READ_POWER_MIN_DBM, Math.min(RFID_READ_POWER_MAX_DBM, Math.round(powerDbm)))
}

export function loadRfidReadPower(): number {
  const storedValue = loadString(RFID_READ_POWER_STORAGE_KEY)
  if (!storedValue) return RFID_READ_POWER_DEFAULT_DBM

  const parsedValue = Number.parseInt(storedValue, 10)
  if (!Number.isFinite(parsedValue)) return RFID_READ_POWER_DEFAULT_DBM

  return clampRfidReadPower(parsedValue)
}

export function saveRfidReadPower(powerDbm: number): number {
  const normalizedPower = clampRfidReadPower(powerDbm)
  saveString(RFID_READ_POWER_STORAGE_KEY, String(normalizedPower))
  return normalizedPower
}

export function loadRfidRegion(): RfidRegion {
  return loadString(RFID_REGION_STORAGE_KEY) === "US" ? "US" : RFID_REGION_DEFAULT
}

export function saveRfidRegion(region: RfidRegion): RfidRegion {
  saveString(RFID_REGION_STORAGE_KEY, region)
  return region
}
