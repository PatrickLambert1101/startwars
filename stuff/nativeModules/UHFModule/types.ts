import { NativeModules } from 'react-native';

const { UHFModule } = NativeModules;

type UHFModuleInterface = {
  initialize: () => void;
  setOutputPower: (power: number) => void;
  startScanning: () => void;
  stopScanning: () => void;
  addListener: (event: string) => void;
  removeListeners: (count: number) => void;
};

export const UHFReader: UHFModuleInterface = UHFModule;
