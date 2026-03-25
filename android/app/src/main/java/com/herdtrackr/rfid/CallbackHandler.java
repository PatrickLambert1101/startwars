package com.herdtrackr.rfid;

import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class CallbackHandler {
    private static final String TAG = "🟡 CallbackHandler";
    private final ReactApplicationContext reactContext;

    public CallbackHandler(ReactApplicationContext reactContext) {
        this.reactContext = reactContext;
    }

    public void sendEvent(String eventName, WritableMap params) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
            Log.d(TAG, "📤 Event sent: " + eventName);
        } else {
            Log.w(TAG, "⚠️ Cannot send event, no active React instance");
        }
    }

    public void sendTagScanned(String epc) {
        WritableMap params = Arguments.createMap();
        params.putString("epc", epc);
        sendEvent("onTagScanned", params);
    }

    public void sendError(String message, String details) {
        WritableMap params = Arguments.createMap();
        params.putString("message", message);
        params.putString("details", details);
        sendEvent("onError", params);
    }

    public void sendInitialized() {
        WritableMap params = Arguments.createMap();
        params.putBoolean("success", true);
        sendEvent("onInitialized", params);
    }

    public void sendScanningStarted() {
        WritableMap params = Arguments.createMap();
        sendEvent("onScanningStarted", params);
    }

    public void sendScanningStopped() {
        WritableMap params = Arguments.createMap();
        sendEvent("onScanningStopped", params);
    }
}
