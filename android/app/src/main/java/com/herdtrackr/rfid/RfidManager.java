package com.herdtrackr.rfid;

import android.util.Log;
import com.handheld.uhfr.UHFRManager;
import com.uhf.api.cls.Reader.TAGINFO;
import java.util.List;

/**
 * RFID Manager for Trigger Hand Scanner (UHFRManager)
 * Based on working implementation from Rental-Scanner-v2
 */
public class RfidManager {
    private static final String TAG = "🔵 RfidManager";
    private static RfidManager instance;
    private UHFRManager mReader;
    private boolean isInitialized = false;
    private static final int DEFAULT_POWER = 27;  // Maximum power for better range
    private static final int MIN_POWER = 5;
    private static final int MAX_POWER = 30;
    private static final int MAX_RETRIES = 3;

    private RfidManager() {
        Log.d(TAG, "📦 RfidManager constructor");
    }

    public static synchronized RfidManager getInstance() {
        if (instance == null) instance = new RfidManager();
        return instance;
    }

    public void initialize() throws RfidInitializationException {
        Log.d(TAG, "🚀 STARTING TRIGGER SCANNER INITIALIZATION");
        try {
            mReader = UHFRManager.getInstance();
            if (mReader == null) {
                retryInitialization();
            }
            if (mReader == null) {
                throw new RfidInitializationException("Failed to get UHFRManager instance after retries");
            }
            isInitialized = true;
            setOutputPower(DEFAULT_POWER);
            Log.d(TAG, "✅ TRIGGER SCANNER INITIALIZATION COMPLETE");
        } catch (RfidOperationException e) {
            isInitialized = false;
            throw new RfidInitializationException("Failed to set power", e);
        } catch (Exception e) {
            isInitialized = false;
            throw new RfidInitializationException("Unexpected error", e);
        }
    }

    private void retryInitialization() {
        for (int i = 0; i < MAX_RETRIES; i++) {
            Log.d(TAG, "Retry initialization attempt: " + (i + 1));
            mReader = UHFRManager.getInstance();
            if (mReader != null) {
                Log.d(TAG, "✅ Got UHFRManager on retry " + (i + 1));
                break;
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private void checkInitialization() throws RfidOperationException {
        if (!isInitialized || mReader == null) {
            throw new RfidOperationException("RFID not initialized");
        }
    }

    public void setOutputPower(int power) throws RfidOperationException {
        checkInitialization();
        if (power < MIN_POWER || power > MAX_POWER) {
            throw new RfidOperationException("Invalid power: " + power + " (must be " + MIN_POWER + "-" + MAX_POWER + ")");
        }
        try {
            mReader.setPower(power, power);
            Log.d(TAG, "✅ Power set to " + power);
        } catch (Exception e) {
            throw new RfidOperationException("Failed to set power", e);
        }
    }

    /**
     * Scan for RFID tags using tagInventoryByTimer
     * This is the CORRECT method for trigger scanners
     * @param timer Timer in milliseconds (e.g., 150)
     * @return List of TAGINFO objects
     */
    public List<TAGINFO> tagInventoryByTimer(short timer) throws RfidOperationException {
        checkInitialization();
        try {
            return mReader.tagInventoryByTimer(timer);
        } catch (Exception e) {
            throw new RfidOperationException("Scan failed", e);
        }
    }

    public void stopTagInventory() throws RfidOperationException {
        checkInitialization();
        try {
            if (!mReader.stopTagInventory()) {
                Log.w(TAG, "⚠️ stopTagInventory returned false");
            }
        } catch (Exception e) {
            throw new RfidOperationException("Stop failed", e);
        }
    }

    public void setCancelInventoryFilter() {
        if (mReader != null) {
            try {
                mReader.setCancleInventoryFilter();
                Log.d(TAG, "✅ Cancelled inventory filter");
            } catch (Exception e) {
                Log.e(TAG, "Error cancelling inventory filter", e);
            }
        }
    }

    public void release() {
        Log.d(TAG, "🧹 RELEASING RFID");
        try {
            if (mReader != null) {
                mReader.stopTagInventory();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping during release", e);
        } finally {
            mReader = null;
            isInitialized = false;
        }
    }

    public boolean isInitialized() {
        return isInitialized;
    }
}
