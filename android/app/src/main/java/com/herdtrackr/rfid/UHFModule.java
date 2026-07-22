package com.herdtrackr.rfid;

import android.util.Log;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import io.reactivex.rxjava3.disposables.Disposable;

public class UHFModule extends ReactContextBaseJavaModule {
    private static final String TAG = "🔴 UHFModule";
    private final RfidManager rfidManager;
    private final ScanningService scanningService;
    private final CallbackHandler callbackHandler;
    private Disposable scanningDisposable;

    public UHFModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.rfidManager = RfidManager.getInstance();
        this.scanningService = new ScanningService(rfidManager);
        this.callbackHandler = new CallbackHandler(reactContext);
        Log.d(TAG, "📦 UHFModule created");
    }

    @NonNull
    @Override
    public String getName() {
        return "UHFReader";
    }

    @ReactMethod
    public void initialize(Promise promise) {
        Log.d(TAG, "🚀 initialize() called");
        try {
            rfidManager.initialize();
            callbackHandler.sendInitialized();
            promise.resolve(true);
            Log.d(TAG, "✅ Initialization complete");
        } catch (RfidInitializationException e) {
            Log.e(TAG, "❌ Initialization failed", e);
            String message = "Failed to initialize RFID: " + e.getMessage();
            callbackHandler.sendError(message, e.toString());
            promise.reject("INIT_ERROR", message, e);
        }
    }

    @ReactMethod
    public void startScanning(Promise promise) {
        Log.d(TAG, "🎯 startScanning() called");
        if (scanningDisposable != null && !scanningDisposable.isDisposed()) {
            Log.w(TAG, "⚠️ Already scanning");
            promise.reject("ALREADY_SCANNING", "Scanning already in progress");
            return;
        }

        try {
            scanningDisposable = scanningService.startScanning()
                .subscribe(
                    epc -> {
                        Log.d(TAG, "📡 Tag scanned: " + epc);
                        callbackHandler.sendTagScanned(epc.toString());
                    },
                    error -> {
                        Log.e(TAG, "❌ Scanning error", error);
                        callbackHandler.sendError("Scanning failed", error.getMessage());
                        scanningDisposable = null;
                    },
                    () -> {
                        Log.d(TAG, "🏁 Scanning completed");
                        callbackHandler.sendScanningStopped();
                        scanningDisposable = null;
                    }
                );
            callbackHandler.sendScanningStarted();
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to start scanning", e);
            promise.reject("SCAN_ERROR", "Failed to start scanning", e);
        }
    }

    @ReactMethod
    public void stopScanning(Promise promise) {
        Log.d(TAG, "🛑 stopScanning() called");
        try {
            if (scanningDisposable != null && !scanningDisposable.isDisposed()) {
                scanningDisposable.dispose();
                scanningDisposable = null;
            }
            scanningService.stopScanning();
            callbackHandler.sendScanningStopped();
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to stop scanning", e);
            promise.reject("STOP_ERROR", "Failed to stop scanning", e);
        }
    }

    @ReactMethod
    public void setPower(int power, Promise promise) {
        Log.d(TAG, "setPower(" + power + " dBm) called");
        try {
            rfidManager.setReadPower(power);
            promise.resolve(true);
        } catch (RfidOperationException e) {
            Log.e(TAG, "❌ Failed to set power", e);
            promise.reject("POWER_ERROR", "Failed to set power", e);
        }
    }

    @ReactMethod
    public void getPower(Promise promise) {
        promise.resolve(rfidManager.getReadPower());
    }

    @ReactMethod
    public void isInitialized(Promise promise) {
        boolean initialized = rfidManager.isInitialized();
        Log.d(TAG, "❓ isInitialized() = " + initialized);
        promise.resolve(initialized);
    }

    @ReactMethod
    public void isScanning(Promise promise) {
        boolean scanning = scanningService.isScanning();
        Log.d(TAG, "❓ isScanning() = " + scanning);
        promise.resolve(scanning);
    }

    /** Required by React Native's NativeEventEmitter contract. */
    @ReactMethod
    public void addListener(String eventName) {
        // Events are emitted by CallbackHandler while JavaScript is subscribed.
    }

    /** Required by React Native's NativeEventEmitter contract. */
    @ReactMethod
    public void removeListeners(Integer count) {
        // The scanning lifecycle is controlled explicitly by start/stopScanning.
    }

    @Override
    public void onCatalystInstanceDestroy() {
        Log.d(TAG, "🧹 onCatalystInstanceDestroy");
        if (scanningDisposable != null) {
            scanningDisposable.dispose();
        }
        scanningService.cleanup();
        rfidManager.release();
        super.onCatalystInstanceDestroy();
    }
}
