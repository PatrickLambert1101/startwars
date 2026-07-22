import { clear } from "@/utils/storage"

import {
  clampRfidReadPower,
  loadRfidReadPower,
  RFID_READ_POWER_DEFAULT_DBM,
  RFID_READ_POWER_MAX_DBM,
  RFID_READ_POWER_MIN_DBM,
  saveRfidReadPower,
} from "./rfidReaderSettings"

describe("RFID read power settings", () => {
  beforeEach(clear)

  it("uses the calibrated default when no setting is stored", () => {
    expect(loadRfidReadPower()).toBe(RFID_READ_POWER_DEFAULT_DBM)
  })

  it("clamps and rounds values to the vendor SDK range", () => {
    expect(clampRfidReadPower(RFID_READ_POWER_MIN_DBM - 20)).toBe(RFID_READ_POWER_MIN_DBM)
    expect(clampRfidReadPower(18.6)).toBe(19)
    expect(clampRfidReadPower(RFID_READ_POWER_MAX_DBM + 20)).toBe(RFID_READ_POWER_MAX_DBM)
  })

  it("persists the normalized read power", () => {
    expect(saveRfidReadPower(24)).toBe(24)
    expect(loadRfidReadPower()).toBe(24)
  })
})
