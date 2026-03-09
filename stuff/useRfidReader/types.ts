export type RfidReaderHook = {
  initialize: () => Promise<void>;
  setOutputPower: (power: number) => Promise<void>;
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  isInitialized: boolean;
  isScanning: boolean;
  scannedTag: { data: string } | null;
  error: string | null;
};
