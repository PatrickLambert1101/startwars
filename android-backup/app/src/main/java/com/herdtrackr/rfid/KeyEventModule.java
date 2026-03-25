package com.herdtrackr.rfid;

import android.util.Log;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class KeyEventModule extends ReactContextBaseJavaModule {
    private static final String TAG = "🟣 KeyEventModule";
    private final ReactApplicationContext reactContext;

    public KeyEventModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        Log.d(TAG, "📦 KeyEventModule created");
    }

    @NonNull
    @Override
    public String getName() {
        return "KeyEventModule";
    }

    public void sendKeyDownEvent() {
        if (reactContext.hasActiveReactInstance()) {
            WritableMap params = Arguments.createMap();
            params.putString("action", "KEY_DOWN");
            params.putLong("timestamp", System.currentTimeMillis());

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onHardwareButtonPress", params);

            Log.d(TAG, "📤 Hardware button event sent");
        } else {
            Log.w(TAG, "⚠️ Cannot send key event, no active React instance");
        }
    }

    public void sendKeyUpEvent() {
        if (reactContext.hasActiveReactInstance()) {
            WritableMap params = Arguments.createMap();
            params.putString("action", "KEY_UP");
            params.putLong("timestamp", System.currentTimeMillis());

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onHardwareButtonRelease", params);

            Log.d(TAG, "📤 Hardware button release event sent");
        }
    }
}
