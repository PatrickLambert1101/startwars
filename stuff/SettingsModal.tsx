import React, { FC, useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  Switch,
} from 'react-native';
import { SettingsModalProps } from './types';
import {
  useLocalConfigStore,
  useAuthStore,
  useSettingsStore,
} from '@project/stores';
import { Slider, ChangeSettings } from '@project/components';
import { useToast } from '@project/hooks';

const thumbSliderCSS = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#fff',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
  elevation: 3,
  borderWidth: 2,
  borderColor: '#eee',
};

const trackSliderCSS = {
  height: 10,
  borderRadius: 8,
  backgroundColor: '#fff',
};

export const SettingsModal: FC<SettingsModalProps> = ({
  navigation,
  visible = false,
  onClose,
}) => {
  const { readerPower, setReaderPower, ttsEnabled, setTtsEnabled } =
    useLocalConfigStore();
  const { userName, clearAuth } = useAuthStore();
  const {
    selectedLocation,
    selectedGate,
    selectedLane,
    setSelectedLocation,
    setSelectedGate,
    setSelectedLane,
  } = useSettingsStore();

  const [sliderValue, setSliderValue] = useState(Number(readerPower) || 1);
  const [localLocation, setLocalLocation] = useState(selectedLocation);
  const [localGate, setLocalGate] = useState(selectedGate);
  const [localLane, setLocalLane] = useState(selectedLane);
  const { showSuccessToast } = useToast();

  useEffect(() => {
    setSliderValue(Number(readerPower) || 1);
    setLocalLocation(selectedLocation);
    setLocalGate(selectedGate);
    setLocalLane(selectedLane);
  }, [readerPower, selectedLocation, selectedGate, selectedLane]);

  const handleSave = () => {
    setReaderPower(String(sliderValue));
    setSelectedLocation(localLocation);
    setSelectedGate(localGate);
    setSelectedLane(localLane);
    showSuccessToast('Settings successfully saved!');
    onClose?.();
  };

  const handleLogout = () => {
    clearAuth();
    showSuccessToast('Logged Out!');
    onClose?.();
    navigation?.navigate('LogIn');
  };

  const handleCancel = () => {
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}>
      <Pressable
        className="flex-1 justify-center items-center bg-black/70"
        onPress={handleCancel}>
        <View
          className="bg-black rounded-2xl p-6 w-11/12 max-w-xl shadow-xl border border-zinc-800"
          onStartShouldSetResponder={() => true}>
          <Text className="text-white text-2xl font-bold text-center mb-8">
            Account Settings
          </Text>
          <Text className="text-white text-base text-center mb-1">
            Change Reader Power
          </Text>
          <Text className="text-white text-base text-center mb-2">
            {sliderValue}
          </Text>
          <Slider
            value={sliderValue}
            minimumValue={1}
            maximumValue={26}
            step={1}
            onValueChange={setSliderValue}
            onSlidingComplete={() => {}}
            thumbTintColor="#fff"
            minimumTrackTintColor="#fff"
            maximumTrackTintColor="#fff"
            trackStyle={trackSliderCSS}
            thumbStyle={thumbSliderCSS}
          />
          <View className="flex-row items-center justify-center my-6">
            <Text className="text-white text-base mr-4">
              Enable Text To Speech
            </Text>
            <View style={{ transform: [{ scale: 1.5 }] }}>
              <Switch
                value={ttsEnabled}
                onValueChange={setTtsEnabled}
                trackColor={{ false: '#fff', true: '#fff' }}
                thumbColor={ttsEnabled ? '#3f3939' : '#3f3939'}
                ios_backgroundColor="#fff"
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-white text-lg font-semibold mb-1">
              Current User:
            </Text>
            <Text className="text-white text-base">{userName}</Text>
          </View>
          <ChangeSettings
            localSelectedLocation={localLocation}
            localSelectedGate={localGate}
            localSelectedLane={localLane}
            onLocationChange={setLocalLocation}
            onGateChange={setLocalGate}
            onLaneChange={setLocalLane}
          />
          <View className="flex-row justify-between mt-8 space-x-2">
            <TouchableOpacity
              className="flex-1 bg-gray-700 py-3 rounded-lg mr-2"
              onPress={handleCancel}>
              <Text className="text-white text-center font-bold">CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-blue-700 py-3 rounded-lg mx-2"
              onPress={handleSave}>
              <Text className="text-white text-center font-bold">SAVE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-gray-700 py-3 rounded-lg ml-2"
              onPress={handleLogout}>
              <Text className="text-white text-center font-bold">LOGOUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};
