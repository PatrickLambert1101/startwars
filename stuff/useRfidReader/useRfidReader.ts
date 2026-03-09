import { useState, useEffect, useCallback } from 'react';
import { NativeEventEmitter } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import {
  KeyEventModule,
  playSound,
  UHFReader,
  VolumeUpEventModule,
} from '@project/services';

import { RfidReaderHook } from './types';

const uhfEventEmitter = new NativeEventEmitter(UHFReader);
const keyEventEmitter = new NativeEventEmitter(KeyEventModule);
const volumeUpEventEmitter = new NativeEventEmitter(VolumeUpEventModule);

export const useRfidReader = (): RfidReaderHook => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTag, setScannedTag] = useState<{ data: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    try {
      const isEmulator = await DeviceInfo.isEmulator();
      if (!isEmulator) {
        await UHFReader.initialize();
      }
      playSound('beep_neutral');
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      setError(`Initialization error: ${err}`);
    }
  }, []);

  const setOutputPower = useCallback(async (power: number) => {
    try {
      const isEmulator = await DeviceInfo.isEmulator();
      if (!isEmulator) {
        await UHFReader.setOutputPower(power);
      }
      setError(null);
    } catch (err) {
      setError(`Power setting error: ${err}`);
    }
  }, []);

  const startScanning = useCallback(async () => {
    try {
      const isEmulator = await DeviceInfo.isEmulator();
      if (!isEmulator) {
        await UHFReader.startScanning();
      }
      setIsScanning(true);
      setError(null);
    } catch (err) {
      setError(`Scanning start error: ${err}`);
    }
  }, []);

  const stopScanning = useCallback(async () => {
    try {
      const isEmulator = await DeviceInfo.isEmulator();
      if (!isEmulator) {
        await UHFReader.stopScanning();
      }
      setIsScanning(false);
      setError(null);
    } catch (err) {
      setError(`Scanning stop error: ${err}`);
    }
  }, []);

  useEffect(() => {
    const keyDownSubscription = keyEventEmitter.addListener('onKeyDown', () => {
      setScannedTag(null);
      startScanning();
    });

    const keyUpSubscription = keyEventEmitter.addListener('onKeyUp', () => {
      stopScanning();
    });

    const tagSubscription = uhfEventEmitter.addListener(
      'onTagScanned',
      (tag) => {
        setScannedTag(tag);
      },
    );

    const volumeUpPressListenerForEmulator = volumeUpEventEmitter.addListener(
      'onVolumeUpPress',
      () => {
        setScannedTag(null);
        startScanning();
      },
    );

    const volumeUpReleaseListenerForEmulator = volumeUpEventEmitter.addListener(
      'onVolumeUpRelease',
      () => {
        stopScanning();
      },
    );

    const errorSubscription = uhfEventEmitter.addListener(
      'onScanError',
      (err) => {
        setError(`Scanning error: ${err}`);
      },
    );

    return () => {
      tagSubscription.remove();
      errorSubscription.remove();
      keyDownSubscription.remove();
      keyUpSubscription.remove();
      volumeUpPressListenerForEmulator.remove();
      volumeUpReleaseListenerForEmulator.remove();
    };
  }, [startScanning, stopScanning]);

  return {
    initialize,
    setOutputPower,
    startScanning,
    stopScanning,
    isInitialized,
    isScanning,
    scannedTag,
    error,
  };
};
