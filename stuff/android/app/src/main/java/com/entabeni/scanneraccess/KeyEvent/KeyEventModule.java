package com.entabeni.scanneraccess.KeyEvent;

import static android.content.Context.RECEIVER_EXPORTED;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class KeyEventModule extends ReactContextBaseJavaModule {

  private static final String TAG = "KeyEventModule";
  private static final String KEY_DOWN_EVENT = "onKeyDown";
  private static final String KEY_UP_EVENT = "onKeyUp";
  private static final String ACTION_RFID_FUN_KEY = "android.rfid.FUN_KEY";
  private static final long KEY_PRESS_DELAY = 100; // milliseconds

  private final ReactApplicationContext reactContext;
  private long lastKeyPressTime = 0;
  private boolean isKeyUp = true;

  private final BroadcastReceiver keyReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
      int keyCode = intent.getIntExtra("keyCode", intent.getIntExtra("keycode", 0));
      boolean isKeyDown = intent.getBooleanExtra("keydown", false);
      long currentTime = System.currentTimeMillis();

      if (isKeyUp && isKeyDown && currentTime - lastKeyPressTime > KEY_PRESS_DELAY) {
        isKeyUp = false;
        lastKeyPressTime = currentTime;
        Log.d(TAG, "Key down: " + keyCode);
        sendKeyEvent(KEY_DOWN_EVENT, keyCode);
      } else if (isKeyDown) {
        lastKeyPressTime = currentTime;
      } else {
        isKeyUp = true;
        Log.d(TAG, "Key up: " + keyCode);
        sendKeyEvent(KEY_UP_EVENT, keyCode);
      }
    }
  };

  public KeyEventModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    initializeKeyEventReceiver();
  }

  private void initializeKeyEventReceiver() {
    IntentFilter filter = new IntentFilter(ACTION_RFID_FUN_KEY);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      reactContext.registerReceiver(keyReceiver, filter, RECEIVER_EXPORTED);
    }
    Log.d(TAG, "KeyEvent receiver initialized");
  }

  private void sendKeyEvent(String eventName, int keyCode) {
    WritableMap params = Arguments.createMap();
    params.putInt("keyCode", keyCode);
    sendEvent(eventName, params);
  }

  private void sendEvent(String eventName, WritableMap params) {
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
  }

  @NonNull
  @Override
  public String getName() {
    return "KeyEventModule";
  }
}