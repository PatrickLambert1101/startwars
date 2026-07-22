export type RfidReaderHook = {
  initialize: () => Promise<void>
  /** Set UHF inventory/read power in dBm (not receiver sensitivity). */
  setOutputPower: (powerDbm: number) => Promise<boolean>
  startScanning: () => Promise<void>
  stopScanning: () => Promise<void>
  clearScannedTag: () => void
  isInitialized: boolean
  isScanning: boolean
  scannedTag: { epc: string } | null
  error: string | null
  hasRfidHardware: boolean
  /** True when the current plan (Unlimited) or super-user status allows RFID reader use. */
  hasRfidAccess: boolean
}
