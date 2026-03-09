package com.entabeni.scanneraccess.RfidReader;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import android.util.Log;

public class CallbackHandler {
    private static final String TAG = "CallbackHandler";
    private final ReactContext reactContext;

    public CallbackHandler(ReactContext reactContext) {
        this.reactContext = reactContext;
    }

    public void sendSuccessToJS(String eventName, String data) {
        WritableMap params = Arguments.createMap();
        params.putString("data", data);
        sendEventToJS(eventName, params);
    }

    public void sendErrorToJS(String eventName, String errorMessage) {
        WritableMap params = Arguments.createMap();
        params.putString("error", errorMessage);
        sendEventToJS(eventName, params);
    }

    private void sendEventToJS(String eventName, WritableMap params) {
        try {
            reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
        } catch (Exception e) {
            Log.e(TAG, "Error sending event to JavaScript", e);
        }
    }
}