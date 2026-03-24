# UHF RFID Scanner Integration Skill

## Overview

This skill provides comprehensive knowledge about integrating UHF RFID (Ultra High Frequency Radio-Frequency Identification) scanners in React Native Android applications. The implementation is based on the New-Access-Scanner project which uses hardware-specific UHF readers for access control and asset tracking.

## Architecture

The UHF RFID integration follows a layered architecture:

```
┌─────────────────────────────────────────┐
│   React Native Layer (TypeScript)      │
│   - useRfidReader hook                  │
│   - useScanner hook                     │
│   - Event listeners                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Native Bridge (Java)                  │
│   - UHFModule (ReactContextBaseJavaModule) │
│   - UHFPackage (ReactPackage)           │
│   - CallbackHandler                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Business Logic Layer (Java)           │
│   - RfidManager (Singleton)             │
│   - ScanningService (RxJava3)           │
│   - Exception Hierarchy                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Vendor SDK Layer (JAR)                │
│   - uhfcom13_v15.jar                    │
│   - UHF67_v1.0.9.jar                    │
│   - UhfReader interface                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Native Libraries (.so)                │
│   - libuhf.so                           │
│   - libjni_rfid_driver.so               │
│   - Hardware communication              │
└─────────────────────────────────────────┘
```

## Core Components

### 1. Native Libraries (.so files)

Located in `android/app/src/main/jniLibs/` for multiple architectures:
- **armeabi-v7a** (32-bit ARM)
- **arm64-v8a** (64-bit ARM)
- **armeabi** (legacy ARM)

**Key Libraries:**
- `libuhf.so` - Core UHF RFID hardware interface
- `libjni_rfid_driver.so` - JNI bridge for hardware communication
- `libSerialPort.so` - Serial port communication
- `libdevapi.so` - Device API for hardware control

### 2. JAR Dependencies

Located in `android/app/libs/`:

```gradle
implementation files('libs/uhfcom13_v15.jar')      // UHF communication protocol
implementation files('libs/DeviceAPIver20150204.jar') // Device hardware API
implementation files('libs/IGLBarDecoder.jar')     // Barcode decoder
implementation files('libs/SerialPort.jar')        // Serial port utilities
implementation files('libs/reader(1).jar')         // RFID reader interface
implementation files('libs/logutil-1.5.1.1.jar')   // Logging utilities
```

### 3. Gradle Configuration

**Root `build.gradle`:**
```gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 23
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "26.1.10909125"
        kotlinVersion = "1.9.22"
    }
}
```

**App `build.gradle`:**
```gradle
android {
    sourceSets {
        main {
            jniLibs.srcDirs = ['src/main/jniLibs']
        }
    }
}

dependencies {
    implementation 'io.reactivex.rxjava3:rxjava:3.0.4'
    implementation 'io.reactivex.rxjava3:rxandroid:3.0.0'
    // ... JAR files
}
```

### 4. Java Implementation

#### RfidManager (Singleton Pattern)

**Location:** `android/app/src/main/java/com/entabeni/scanneraccess/RfidReader/RfidManager.java`

**Key Methods:**
```java
public class RfidManager {
    private static RfidManager instance;
    private UhfReader uhfReader;
    private boolean isInitialized = false;

    // Initialize UHF reader with default power (18-27 range)
    public void initialize() throws RfidInitializationException

    // Set transmission power (18-27 dBm)
    public void setOutputPower(int power) throws RfidOperationException

    // Perform real-time inventory scan
    public List<TagModel> inventoryRealTime() throws RfidOperationException

    // Stop continuous scanning
    public void stopInventoryMulti() throws RfidOperationException

    // Release hardware resources
    public void release()
}
```

**UhfReader SDK Interface (from uhfcom13_v15.jar):**
```java
import com.android.hdhe.uhf.reader.UhfReader;
import com.android.hdhe.uhf.readerInterface.TagModel;

// TagModel contains:
// - byte[] mEpcBytes - EPC (Electronic Product Code) data
// - RSSI signal strength
// - Read count
```

#### ScanningService (RxJava3 Observable Pattern)

**Location:** `android/app/src/main/java/com/entabeni/scanneraccess/RfidReader/ScanningService.java`

**Features:**
- Continuous scanning using RxJava3 Observables
- Throttling (500ms) to prevent duplicate reads
- Distinct until changed - only emit when tag changes
- Background threading with Schedulers.io()
- Auto-stop on first tag detection

```java
public Observable<Object> startScanning() {
    return Observable.create(emitter -> {
        isScanning = true;
        while (isScanning && !emitter.isDisposed()) {
            List<TagModel> tags = rfidManager.inventoryRealTime();
            if (tags != null && !tags.isEmpty()) {
                for (TagModel tag : tags) {
                    byte[] epcData = tag.getmEpcBytes();
                    String epcHex = Tools.Bytes2HexString(epcData, epcData.length);
                    emitter.onNext(epcHex);
                    stopScanning(); // Auto-stop after first tag
                }
            }
            Thread.sleep(100); // Prevent system overload
        }
        emitter.onComplete();
    }).subscribeOn(Schedulers.io())
      .throttleFirst(500, TimeUnit.MILLISECONDS)
      .distinctUntilChanged();
}
```

#### UHFModule (React Native Bridge)

**Location:** `android/app/src/main/java/com/entabeni/scanneraccess/RfidReader/UHFModule.java`

**React Methods:**
```java
@ReactMethod
public void initialize(Promise promise)

@ReactMethod
public void setOutputPower(int power, Promise promise)

@ReactMethod
public void startScanning(Promise promise)

@ReactMethod
public void stopScanning(Promise promise)
```

**Event Emissions:**
- `onTagScanned` - Emitted when RFID tag is read
- `onScanError` - Emitted on scanning errors

#### CallbackHandler

**Location:** `android/app/src/main/java/com/entabeni/scanneraccess/RfidReader/CallbackHandler.java`

Sends events from Java to JavaScript using React Native's DeviceEventEmitter:

```java
public void sendSuccessToJS(String eventName, String data)
public void sendErrorToJS(String eventName, String errorMessage)
```

#### Exception Hierarchy

```
RfidException (base)
├── RfidInitializationException - Hardware initialization failures
└── RfidOperationException - Runtime operation errors
```

### 5. Hardware Button Integration (KeyEventModule)

**Location:** `android/app/src/main/java/com/entabeni/scanneraccess/KeyEvent/KeyEventModule.java`

Listens for hardware scan button presses via Android broadcast receiver:

```java
private static final String ACTION_RFID_FUN_KEY = "android.rfid.FUN_KEY";

// Events emitted:
// - onKeyDown: Scan button pressed → start scanning
// - onKeyUp: Scan button released → stop scanning
```

**Key Features:**
- Debouncing (100ms delay) to prevent double-triggers
- State tracking (isKeyUp) to ensure proper press/release cycles
- Broadcast receiver for `android.rfid.FUN_KEY` intent

### 6. React Native Integration

#### TypeScript Type Definitions

**Location:** `New-Access-Scanner/src/services/nativeModules/UHFModule/types.ts`

```typescript
type UHFModuleInterface = {
  initialize: () => void;
  setOutputPower: (power: number) => void;
  startScanning: () => void;
  stopScanning: () => void;
  addListener: (event: string) => void;
  removeListeners: (count: number) => void;
};

export const UHFReader: UHFModuleInterface = NativeModules.UHFModule;
```

#### useRfidReader Hook

**Location:** `New-Access-Scanner/src/hooks/useRfidReader/useRfidReader.ts`

**API:**
```typescript
const {
  initialize,           // Initialize hardware
  setOutputPower,       // Set RF power (18-27)
  startScanning,        // Begin RFID scan
  stopScanning,         // End RFID scan
  isInitialized,        // Initialization state
  isScanning,           // Scanning state
  scannedTag,           // Latest tag: { data: string }
  error                 // Error message
} = useRfidReader();
```

**Features:**
- Emulator detection (skips hardware calls on emulators)
- Event listeners for:
  - Hardware button (KeyEventModule)
  - Volume up button (emulator testing)
  - Tag scanned events
  - Error events
- Sound feedback (beep on initialization)
- Automatic cleanup on unmount

#### useScanner Hook (Higher-Level Abstraction)

**Location:** `New-Access-Scanner/src/hooks/useScanner/useScanner.ts`

**Purpose:** Simplified scanning interface with navigation integration

```typescript
const {
  isScanning,
  scannedTag,
  error,
  startScanning,
  stopScanning
} = useScanner({ navigation, destination });

// Auto-navigates to destination screen with scanned tag data
```

### 7. Package Registration

**Location:** `android/app/src/main/java/com/entabeni/scanneraccess/MainApplication.kt`

```kotlin
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        add(KeyEventModule())
        add(UHFPackage())
    }
```

## Implementation Guide

### Step 1: Add Native Dependencies

1. Copy `.so` files to `android/app/src/main/jniLibs/` for each architecture
2. Copy vendor JAR files to `android/app/libs/`
3. Update `build.gradle` to include JARs and configure jniLibs path

### Step 2: Implement Java Layer

1. Create exception hierarchy (RfidException base class)
2. Implement RfidManager singleton (wraps UhfReader SDK)
3. Implement ScanningService with RxJava3
4. Create UHFModule extending ReactContextBaseJavaModule
5. Create UHFPackage implementing ReactPackage
6. Implement CallbackHandler for JS events
7. Optional: Create KeyEventModule for hardware button support

### Step 3: Register Native Modules

1. Add UHFPackage to MainApplication's getPackages()
2. Add KeyEventModule if using hardware buttons

### Step 4: TypeScript Integration

1. Define TypeScript types for native module
2. Create NativeModules bridge
3. Implement useRfidReader hook with event listeners
4. Optional: Create higher-level useScanner hook

### Step 5: Usage in Components

```typescript
import { useRfidReader } from '@project/hooks';

function ScanScreen() {
  const {
    initialize,
    isInitialized,
    scannedTag,
    error
  } = useRfidReader();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (scannedTag) {
      console.log('Scanned:', scannedTag.data);
      // Process tag...
    }
  }, [scannedTag]);

  return (
    <View>
      {scannedTag && <Text>{scannedTag.data}</Text>}
      {error && <Text>Error: {error}</Text>}
    </View>
  );
}
```

## Key Technical Details

### Power Settings
- Range: 18-27 dBm
- Default: 18 dBm (set in RfidManager.initialize())
- Higher power = longer read range, more battery drain
- Adjustable via setOutputPower()

### Tag Data Format
- EPC (Electronic Product Code) as hex string
- Converted from byte array using Tools.Bytes2HexString()
- Example: "E28011700000020B1234ABCD"

### Threading Model
- Scanning occurs on RxJava Schedulers.io() thread pool
- Events dispatched to Android main thread via AndroidSchedulers.mainThread()
- React Native bridge is thread-safe

### Performance Optimizations
- 500ms throttle prevents duplicate reads
- distinctUntilChanged() filters repeated tags
- 100ms sleep in scan loop prevents CPU overload
- Auto-stop on first tag detection

### Error Handling
- Try-catch blocks wrap all hardware operations
- Promises reject with error codes: "INIT_ERROR", "POWER_SET_ERROR"
- Error events emitted via "onScanError"

## Common Issues and Solutions

### Issue: "Failed to get UhfReader instance"
**Cause:** Hardware not initialized or incompatible device
**Solution:**
- Verify .so files are present for device architecture
- Check device has UHF hardware support
- Ensure proper permissions in AndroidManifest.xml

### Issue: Tags not scanning
**Cause:** Power too low, hardware button not working, or no event listeners
**Solution:**
- Increase power with setOutputPower(27)
- Verify KeyEventModule is registered and receiving intents
- Check event listeners are attached before scanning

### Issue: Duplicate tag reads
**Cause:** Throttling/distinctUntilChanged not working
**Solution:**
- Verify RxJava3 operators are applied correctly
- Implement additional debouncing in React component

### Issue: Memory leaks
**Cause:** Event listeners not cleaned up
**Solution:**
- Always call subscription.remove() in useEffect cleanup
- Call disposables.clear() in stopScanning()

## Dependencies

### React Native
```json
{
  "react-native": "0.74.3",
  "react-native-device-info": "11.1.0"
}
```

### Android
```gradle
dependencies {
    implementation 'io.reactivex.rxjava3:rxjava:3.0.4'
    implementation 'io.reactivex.rxjava3:rxandroid:3.0.0'
}
```

### Vendor SDKs
- **uhfcom13_v15.jar** - UHF communication protocol (version 15)
- **UHF67_v1.0.9.jar** - Alternative UHF SDK (version 1.0.9)
- **DeviceAPIver20150204.jar** - Hardware device API (2015-02-04)

## Testing

### Emulator Support
The implementation includes emulator detection:
```typescript
const isEmulator = await DeviceInfo.isEmulator();
if (!isEmulator) {
  await UHFReader.initialize();
}
```

For testing on emulators, use volume up button simulation:
- Volume up press → start scanning
- Volume up release → stop scanning

### Real Device Testing
1. Deploy APK to compatible Android handheld with UHF hardware
2. Press hardware scan button to trigger scanning
3. Hold near UHF RFID tag (ISO 18000-6C / EPC Gen2)
4. Verify tag hex string appears in app

## Security Considerations

1. **Hardware Access:** UHF scanner requires system-level hardware access
2. **Permissions:** Minimal permissions required (no special permissions in manifest)
3. **Data Validation:** Always validate scanned tag format before processing
4. **Native Code:** Binary .so files should be verified for integrity

## Architecture Patterns Used

1. **Singleton Pattern:** RfidManager ensures single hardware instance
2. **Bridge Pattern:** UHFModule bridges React Native ↔ Java
3. **Observer Pattern:** RxJava3 Observable for scan events
4. **Factory Pattern:** UHFPackage creates native modules
5. **Repository Pattern:** RfidManager abstracts hardware SDK

## Best Practices

1. Always initialize before scanning
2. Always stop scanning before app goes to background
3. Release resources (rfidManager.release()) when done
4. Handle errors gracefully with user feedback
5. Test on actual hardware (emulator can't simulate RF)
6. Set appropriate power levels (higher isn't always better)
7. Implement proper cleanup in React hooks
8. Use TypeScript for type safety across bridge

## Further Reading

- UHF RFID: ISO 18000-6C / EPC Gen2 standard
- React Native Native Modules: https://reactnative.dev/docs/native-modules-android
- RxJava3 Documentation: https://github.com/ReactiveX/RxJava
- Android Broadcast Receivers: https://developer.android.com/guide/components/broadcasts

## Support Hardware

This implementation is designed for Android handheld devices with integrated UHF RFID readers, typically used in:
- Warehouse management
- Asset tracking
- Access control systems
- Inventory management
- Livestock tracking (example: cattle with RFID ear tags)

Common manufacturers: Chainway, Urovo, Zebra, Honeywell, Newland

---

**Last Updated:** Based on New-Access-Scanner project analysis (March 2025)
**Skill Version:** 1.0.0
**Maintainer:** Extracted via deep dive analysis
