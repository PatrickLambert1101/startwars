package com.herdtrackr.rfid;

import android.util.Log;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.AsyncTask;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * KeyEventModule using BroadcastReceiver for android.rfid.FUN_KEY intent
 * Based on working implementation from Rental-Scanner-v2
 */
public class KeyEventModule extends ReactContextBaseJavaModule {
    private static final String TAG = "🟣 KeyEventModule";
    private final ReactApplicationContext reactContext;
    private static KeyEventModule instance;
    private DeviceEventManagerModule.RCTDeviceEventEmitter eventEmitter = null;

    // Key event debouncing
    private long startTime = 0;
    private boolean keyUpFlag = true;
    private static final long DEBOUNCE_MS = 100;

    public KeyEventModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        instance = this;
        Log.d(TAG, "📦 KeyEventModule created");
        new InitTask().execute();
    }

    public static KeyEventModule getInstance() {
        return instance;
    }

    @NonNull
    @Override
    public String getName() {
        return "KeyEventModule";
    }

    /**
     * BroadcastReceiver for android.rfid.FUN_KEY intent
     * This is how the RFID scanner hardware sends button press events
     */
    private final BroadcastReceiver keyReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            int keyCode = intent.getIntExtra("keyCode", 0);

            // Try alternate key name (some devices use lowercase)
            if (keyCode == 0) {
                keyCode = intent.getIntExtra("keycode", 0);
            }

            boolean keyDown = intent.getBooleanExtra("keydown", false);

            Log.d(TAG, "📻 Broadcast received - keyCode: " + keyCode + ", keyDown: " + keyDown);

            // Get event emitter if not already initialized
            if (eventEmitter == null) {
                eventEmitter = reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
            }

            WritableMap params = Arguments.createMap();
            params.putInt("keyCode", keyCode);
            params.putLong("timestamp", System.currentTimeMillis());

            // Debounced key down event
            if (keyUpFlag && keyDown && System.currentTimeMillis() - startTime > DEBOUNCE_MS) {
                keyUpFlag = false;
                startTime = System.currentTimeMillis();
                params.putString("action", "KEY_DOWN");
                sendEvent("onKeyDown", params);
                Log.d(TAG, "📤 onKeyDown event sent to JS");
            }
            // Track subsequent key down events but don't send duplicates
            else if (keyDown) {
                startTime = System.currentTimeMillis();
                Log.v(TAG, "⏭️  Ignoring duplicate KEY_DOWN (debounced)");
            }
            // Key up event
            else {
                keyUpFlag = true;
                params.putString("action", "KEY_UP");
                sendEvent("onKeyUp", params);
                Log.d(TAG, "📤 onKeyUp event sent to JS");
            }
        }
    };

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        try {
            if (reactContext.hasActiveReactInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
            } else {
                Log.w(TAG, "⚠️ Cannot send " + eventName + " event, no active React instance");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error sending " + eventName + " event", e);
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for NativeEventEmitter
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for NativeEventEmitter
    }

    /**
     * Initialize and register the broadcast receiver for RFID button events
     */
    public class InitTask extends AsyncTask<String, Integer, Boolean> {
        @Override
        protected void onPreExecute() {
            super.onPreExecute();
            Log.d(TAG, "🔧 Initializing KeyEvent module - registering BroadcastReceiver");
            try {
                IntentFilter filter = new IntentFilter();
                filter.addAction("android.rfid.FUN_KEY");
                reactContext.getApplicationContext().registerReceiver(keyReceiver, filter);
                Log.d(TAG, "✅ BroadcastReceiver registered for android.rfid.FUN_KEY");
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to register BroadcastReceiver", e);
            }
        }

        @Override
        protected Boolean doInBackground(String... params) {
            return true;
        }

        @Override
        protected void onPostExecute(Boolean result) {
            super.onPostExecute(result);
            if (result) {
                Log.d(TAG, "✅ KeyEvent module initialization complete");
            } else {
                Log.e(TAG, "❌ KeyEvent module initialization failed");
            }
        }
    }

    @Override
    public void onCatalystInstanceDestroy() {
        Log.d(TAG, "🧹 Cleaning up KeyEventModule");
        try {
            if (keyReceiver != null) {
                reactContext.getApplicationContext().unregisterReceiver(keyReceiver);
                Log.d(TAG, "✅ BroadcastReceiver unregistered");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error unregistering receiver", e);
        }
        super.onCatalystInstanceDestroy();
    }
}
