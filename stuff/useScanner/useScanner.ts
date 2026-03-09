import { useEffect } from 'react';
import { useRfidReader } from '@project/hooks';

type UseScannerProps = {
  navigation?: any;
  destination?: string;
};

type UseScannerReturn = {
  isScanning: boolean;
  scannedTag: { data: string } | null;
  error: string | null;
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
};

export const useScanner = ({
  navigation,
  destination,
}: UseScannerProps): UseScannerReturn => {
  const {
    isScanning,
    scannedTag,
    error,
    startScanning,
    stopScanning,
    initialize,
    isInitialized,
  } = useRfidReader();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  useEffect(() => {
    if (scannedTag && navigation && destination) {
      navigation.navigate('ProfileScreen', { cardRfid: scannedTag.data });
    }
  }, [scannedTag, navigation, destination]);

  return {
    isScanning,
    scannedTag,
    error,
    startScanning,
    stopScanning,
  };
};
