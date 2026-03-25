package com.herdtrackr.rfid;

import android.media.AudioManager;
import android.media.ToneGenerator;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * Native module to play simple beep sounds using Android ToneGenerator
 */
public class BeepModule extends ReactContextBaseJavaModule {
    private static final String TAG = "🔊 BeepModule";
    private ToneGenerator toneGenerator;

    public BeepModule(ReactApplicationContext reactContext) {
        super(reactContext);
        Log.d(TAG, "📦 BeepModule created");

        try {
            // Initialize ToneGenerator with DTMF tone at 100% volume
            toneGenerator = new ToneGenerator(AudioManager.STREAM_MUSIC, 100);
            Log.d(TAG, "✅ ToneGenerator initialized");
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to initialize ToneGenerator", e);
        }
    }

    @Override
    public String getName() {
        return "BeepModule";
    }

    @ReactMethod
    public void playBeep() {
        if (toneGenerator != null) {
            try {
                // Play DTMF '5' tone for 200ms (nice short beep)
                toneGenerator.startTone(ToneGenerator.TONE_DTMF_5, 200);
                Log.d(TAG, "🔊 Beep played");
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to play beep", e);
            }
        } else {
            Log.w(TAG, "⚠️ ToneGenerator not initialized");
        }
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        if (toneGenerator != null) {
            toneGenerator.release();
            toneGenerator = null;
            Log.d(TAG, "🔇 ToneGenerator released");
        }
    }
}
