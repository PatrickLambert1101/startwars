import React, { FC, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
  ScansHistory,
  SettingsModal,
  Scan,
  CenterScreen,
  ScanFooter,
} from '@project/components';
import Logo from '@project/assets/images/logo.png';

import { useScanner } from '@project/hooks';
import { AuthStackProps } from '@project/navigation';
import { useConfigStore, useConnectionStore } from '@project/stores';

export const ScanScreen: FC = () => {
  const navigation = useNavigation<AuthStackProps>();
  const [modalVisible, setModalVisible] = useState(false);
  const { isConnected, checkConnection } = useConnectionStore();
  const { accountLogo } = useConfigStore();
  const { isScanning } = useScanner({ navigation, destination: 'Profile' });

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  if (!isConnected) {
    return <CenterScreen text="Please connect to the internet to continue" />;
  }

  return (
    <>
      <SettingsModal
        navigation={navigation}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
      <Scan isScanning={isScanning} scanningText="Pull trigger to scan" />
      <View className="flex-1 bg-black p-6 pb-20">
        <ScansHistory />
      </View>
      {!isScanning && (
        <ScanFooter
          accountLogo={accountLogo}
          Logo={Logo}
          handleShowModal={() => setModalVisible(true)}
        />
      )}
    </>
  );
};
