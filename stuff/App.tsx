import React, { FC, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import BootSplash from 'react-native-bootsplash';
import { useCameraPermission } from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'react-native';
import KeepAwake from 'react-native-keep-awake';
import {
  configureFonts,
  DefaultTheme,
  Provider as PaperProvider,
} from 'react-native-paper';
import { AppContainer } from '@project/navigation';
import { useAuthStore, useConfigStore } from '@project/stores';
import { useClient, useRfidReader } from '@project/hooks';

const fontConfig = {
  android: {
    regular: {
      fontFamily: 'Roboto',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'Roboto-Medium',
      fontWeight: 'normal',
    },
    light: {
      fontFamily: 'Roboto-Light',
      fontWeight: 'normal',
    },
    thin: {
      fontFamily: 'Roboto-Thin',
      fontWeight: 'normal',
    },
  },
};

const theme = {
  ...DefaultTheme,
  fonts: configureFonts(fontConfig),
  dark: true,
  colors: {
    errorDark: '#b71c1c',
    errorMain: '#d32f2f',
    background: '#000',
    primary: '#0D47A1',
    white: '#fff',
    text: '#000',
    success: '#388e3c',
    warning: '#d27619',
  },
};

const App: FC = () => {
  const { jwtToken } = useAuthStore();
  const { baseUrl } = useConfigStore();
  const { isInitialized, initialize } = useRfidReader();
  const { hasPermission, requestPermission } = useCameraPermission();
  const { client } = useClient({ baseUrl, jwtToken });

  useEffect(() => {
    const init = async () => {
      try {
        if (!hasPermission) {
          await requestPermission();
        }
        if (!isInitialized) {
          await initialize();
        }
        await AsyncStorage.getItem('config-storage');
      } catch (error) {
        console.error('Error initializing state:', error);
      }
    };

    init().finally(async () => {
      await BootSplash.hide({ fade: true });
    });
  }, [hasPermission, initialize, isInitialized, requestPermission]);

  return (
    <ApolloProvider client={client}>
      <PaperProvider theme={theme}>
        <StatusBar backgroundColor="#000" />
        <KeepAwake />
        <AppContainer />
      </PaperProvider>
    </ApolloProvider>
  );
};

export default App;
