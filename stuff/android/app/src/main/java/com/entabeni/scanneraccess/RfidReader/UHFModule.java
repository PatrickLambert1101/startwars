package com.entabeni.scanneraccess.RfidReader;

import com.entabeni.scanneraccess.RfidReader.RfidExceptions.RfidInitializationException;
import com.entabeni.scanneraccess.RfidReader.RfidExceptions.RfidOperationException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import android.util.Log;

public class UHFModule extends ReactContextBaseJavaModule {
    private static final String TAG = "FlatUHFModule";
    private final RfidManager rfidManager;
    private final ScanningService scanningService;
    private final CallbackHandler callbackHandler;
    private final CompositeDisposable disposables = new CompositeDisposable();

    public UHFModule(ReactApplicationContext reactContext) {
        super(reactContext);
        rfidManager = RfidManager.getInstance();
        scanningService = new ScanningService(rfidManager);
        callbackHandler = new CallbackHandler(reactContext);
    }

    @Override
    public String getName() {
        return "UHFModule";
    }

    @ReactMethod
    public void initialize(Promise promise) {
        try {
            rfidManager.initialize();
            promise.resolve(null);
        } catch (RfidInitializationException e) {
            Log.e(TAG, "RFID initialization failed", e);
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void setOutputPower(int power, Promise promise) {
        try {
            rfidManager.setOutputPower(power);
            promise.resolve(null);
        } catch (RfidOperationException e) {
            Log.e(TAG, "Setting output power failed", e);
            promise.reject("POWER_SET_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startScanning(Promise promise) {
        disposables.add(
                scanningService.startScanning()
                        .observeOn(AndroidSchedulers.mainThread())
                        .subscribe(
                                tag -> callbackHandler.sendSuccessToJS("onTagScanned", (String) tag),
                                error -> {
                                    Log.e(TAG, "Scanning error", error);
                                    callbackHandler.sendErrorToJS("onScanError", error.getMessage());
                                },
                                () -> Log.d(TAG, "Scanning completed")
                        )
        );
        promise.resolve(null);
    }

    @ReactMethod
    public void stopScanning(Promise promise) {
        scanningService.stopScanning();
        disposables.clear();
        promise.resolve(null);
    }

    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(Integer count) {}
}