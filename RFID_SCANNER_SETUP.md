# RFID Scanner Integration Complete

This document summarizes the RFID UHF scanner integration that has been completed for the HerdTrackr app.

## What Was Done

### 1. Logo Integration
- **Logo file**: Copied from `stuff/logo.png` to `assets/images/herd-logo.png`
- **Landing page**: Updated `app/screens/LandingScreen.tsx` to use the new logo image (replaces HerdTrackrLogo icon component)
  - Hero section logo (80x80)
  - Bottom CTA logo (60x60)
- **Splash screen**: Updated `app.json` expo-splash-screen config to use `herd-logo.png` with white background

### 2. React Native Services & Hooks Created

#### Services (`app/services/`)
Created native module TypeScript wrappers:
- `nativeModules/UHFModule/` - UHF RFID reader module interface
- `nativeModules/KeyEventModule/` - Hardware key event listener (for scanner trigger button)
- `nativeModules/VolumeUpEventModule/` - Volume button event listener (for emulator testing)
- `nativeModules/index.ts` - Exports all native modules

#### Hooks (`app/hooks/`)
Created React hooks for RFID scanner functionality:

**`useRfidReader/`** - Core RFID scanner hook
- `types.ts` - TypeScript interfaces for the hook
- `useRfidReader.ts` - Main hook implementation
- Features:
  - `initialize()` - Initialize the UHF reader
  - `setOutputPower(power)` - Set RFID reader power (18-27 range)
  - `startScanning()` - Start scanning for tags
  - `stopScanning()` - Stop scanning
  - `isInitialized`, `isScanning`, `scannedTag`, `error` - State values
  - Event listeners for hardware triggers and tag scanning

**`useScanner/`** - High-level scanner hook
- `useScanner.ts` - Simplified scanner interface
- Features:
  - Automatically initializes the reader
  - Optionally navigates to a destination screen when a tag is scanned
  - Returns scanning state and tag data

### 3. Android Native Modules

#### JAR Libraries Copied (`android/app/libs/`)
- `DeviceAPIver20150204.jar` - Device API library
- `IGLBarDecoder.jar` - Barcode decoder
- `SerialPort.jar` - Serial port communication
- `uhfcom13_v15.jar` - UHF communication library
- `logutil-1.5.1.1.jar` - Logging utilities
- `reader(1).jar` - RFID reader SDK
- `ModuleAPI_J.jar` - Module API
- `UHF67_v1.0.9.jar` - UHF67 device library
- `jxl.jar` - Excel library

#### Java Native Modules (`android/app/src/main/java/com/herdtrackr/`)

**KeyEvent/** - Hardware key event module
- `KeyEventModule.java` - Listens for RFID scanner trigger button
- `KeyEventPackage.java` - React Native package registration
- Broadcasts events: `onKeyDown`, `onKeyUp`

**RfidReader/** - RFID scanning functionality
- `UHFModule.java` - React Native bridge for UHF reader
- `UHFPackage.java` - Package registration
- `RfidManager.java` - Singleton managing UHF reader lifecycle
- `ScanningService.java` - Background scanning service with RxJava
- `CallbackHandler.java` - Event emitter for scan results
- `RfidExceptions/` - Custom exception classes
  - `RfidException.java`
  - `RfidInitializationException.java`
  - `RfidOperationException.java`

#### MainApplication Updated
- Added imports for `KeyEventPackage` and `UHFPackage`
- Registered both packages in `getPackages()`

#### build.gradle Updated
- Added RxJava dependencies (3.0.4 for rxjava, 3.0.0 for rxandroid)
- Added all JAR library implementations

## How to Use the RFID Scanner

### Basic Usage Example

```typescript
import { useRfidReader } from "@/hooks/useRfidReader"

function MyComponent() {
  const {
    initialize,
    isInitialized,
    isScanning,
    scannedTag,
    error,
    startScanning,
    stopScanning,
  } = useRfidReader()

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [initialize, isInitialized])

  useEffect(() => {
    if (scannedTag) {
      console.log("Scanned tag:", scannedTag.data)
      // Do something with the scanned tag
    }
  }, [scannedTag])

  return (
    <View>
      {isScanning && <Text>Scanning...</Text>}
      {scannedTag && <Text>Tag: {scannedTag.data}</Text>}
      {error && <Text>Error: {error}</Text>}
    </View>
  )
}
```

### Simple Scanner with Navigation

```typescript
import { useScanner } from "@/hooks/useScanner"

function ScanScreen({ navigation }) {
  const { isScanning, scannedTag, error } = useScanner({
    navigation,
    destination: "CattleDetails", // Navigate here when tag is scanned
  })

  return (
    <View>
      {isScanning && <Text>Pull trigger to scan...</Text>}
      {error && <Text>Error: {error}</Text>}
    </View>
  )
}
```

## Hardware Triggers

The scanner responds to:
1. **Hardware trigger button** - Press to start scanning, release to stop
2. **Volume up button** (emulator) - Can be used for testing on devices without RFID hardware

## Technical Details

### RFID Reader Specs
- **Type**: UHF RFID Reader
- **Power range**: 18-27 (configurable)
- **Protocol**: EPC Gen2 UHF
- **Interface**: Serial port communication

### Event Flow
1. User presses hardware trigger button
2. `KeyEventModule` broadcasts `onKeyDown` event
3. `useRfidReader` hook starts scanning via `UHFReader.startScanning()`
4. `ScanningService` continuously scans for tags using RxJava Observable
5. When tag detected, `onTagScanned` event emitted with tag data
6. User releases trigger button
7. `KeyEventModule` broadcasts `onKeyUp` event
8. Hook stops scanning

### Platform Support
- **Android**: Full RFID support with native modules
- **iOS**: Hooks are safe to use (return mock/empty data)
- **Web/Emulator**: Volume button can simulate trigger for testing

## Building the App

Since native modules were added, you'll need to rebuild the Android app:

```bash
# Build Android
npx expo run:android

# Or build APK
cd android && ./gradlew assembleRelease
```

## Next Steps

You can now:
1. Create screens that use the scanner (e.g., cattle check-in, inventory scanning)
2. Test the scanner with actual RFID UHF tags
3. Adjust power settings based on read range requirements
4. Add sound/vibration feedback on successful scans
5. Implement batch scanning for multiple cattle

## Files Modified/Created

### Modified:
- `app/screens/LandingScreen.tsx` - Added logo image
- `app.json` - Updated splash screen config
- `android/app/src/main/java/com/herdtrackr/MainApplication.kt` - Registered native modules
- `android/app/build.gradle` - Added dependencies

### Created:
- `assets/images/herd-logo.png` - Logo file
- `app/services/nativeModules/` - Native module wrappers (6 files)
- `app/hooks/useRfidReader/` - RFID reader hook (3 files)
- `app/hooks/useScanner/` - Scanner hook (2 files)
- `android/app/libs/` - 9 JAR libraries
- `android/app/src/main/java/com/herdtrackr/KeyEvent/` - Key event module (2 files)
- `android/app/src/main/java/com/herdtrackr/RfidReader/` - RFID reader module (6 files)
- `android/app/src/main/java/com/herdtrackr/RfidReader/RfidExceptions/` - Exception classes (3 files)

Total: ~30 new files, 4 modified files
