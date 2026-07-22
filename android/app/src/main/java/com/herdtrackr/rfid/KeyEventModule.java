package com.herdtrackr.rfid;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/** Converts the scanner firmware's trigger broadcast into React Native events. */
public final class KeyEventModule extends ReactContextBaseJavaModule {
    private static final String TAG = "KeyEventModule";
    private static final String RFID_KEY_ACTION = "android.rfid.FUN_KEY";
    private static final long DEBOUNCE_MS = 100;

    private final ReactApplicationContext reactContext;
    private boolean receiverRegistered;
    private boolean keyIsDown;
    private long lastKeyDownAt;

    public KeyEventModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        registerKeyReceiver();
    }

    @NonNull
    @Override
    public String getName() {
        return "KeyEventModule";
    }

    private final BroadcastReceiver keyReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            int keyCode = intent.getIntExtra("keyCode", intent.getIntExtra("keycode", 0));
            boolean keyDown = intent.getBooleanExtra("keydown", false);
            long now = System.currentTimeMillis();

            WritableMap params = Arguments.createMap();
            params.putInt("keyCode", keyCode);
            params.putDouble("timestamp", now);

            if (keyDown) {
                if (!keyIsDown && now - lastKeyDownAt >= DEBOUNCE_MS) {
                    keyIsDown = true;
                    lastKeyDownAt = now;
                    params.putString("action", "KEY_DOWN");
                    sendEvent("onKeyDown", params);
                }
            } else if (keyIsDown) {
                keyIsDown = false;
                params.putString("action", "KEY_UP");
                sendEvent("onKeyUp", params);
            }
        }
    };

    private void registerKeyReceiver() {
        try {
            IntentFilter filter = new IntentFilter(RFID_KEY_ACTION);
            Context applicationContext = reactContext.getApplicationContext();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // The vendor firmware sends the trigger broadcast from outside this app.
                applicationContext.registerReceiver(keyReceiver, filter, Context.RECEIVER_EXPORTED);
            } else {
                applicationContext.registerReceiver(keyReceiver, filter);
            }
            receiverRegistered = true;
        } catch (Exception error) {
            Log.e(TAG, "Unable to register RFID trigger receiver", error);
        }
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        if (!reactContext.hasActiveReactInstance()) {
            return;
        }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required by NativeEventEmitter.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required by NativeEventEmitter.
    }

    @Override
    public void onCatalystInstanceDestroy() {
        if (receiverRegistered) {
            try {
                reactContext.getApplicationContext().unregisterReceiver(keyReceiver);
            } catch (Exception error) {
                Log.w(TAG, "Unable to unregister RFID trigger receiver", error);
            }
            receiverRegistered = false;
        }
        super.onCatalystInstanceDestroy();
    }
}
