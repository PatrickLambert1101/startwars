package com.herdtrackr.rfid;

import android.util.Log;
import com.android.hdhe.uhf.reader.UhfReader;
import com.android.hdhe.uhf.readerInterface.TagModel;
import com.herdtrackr.BuildConfig;
import java.util.List;

public class RfidManager {
    private static final String TAG = "🔵 RfidManager";
    private static final boolean VERBOSE = BuildConfig.ENABLE_VERBOSE_RFID_LOGS;
    private static RfidManager instance;
    private UhfReader uhfReader;
    private boolean isInitialized = false;
    private static final int DEFAULT_POWER = 18;
    private static final int MIN_POWER = 18;
    private static final int MAX_POWER = 27;

    private RfidManager() {
        if (VERBOSE) Log.d(TAG, "📦 RfidManager constructor");
    }

    public static synchronized RfidManager getInstance() {
        if (instance == null) instance = new RfidManager();
        return instance;
    }

    public void initialize() throws RfidInitializationException {
        Log.d(TAG, "🚀 STARTING RFID INITIALIZATION");
        try {
            uhfReader = UhfReader.getInstance();
            if (uhfReader == null) {
                throw new RfidInitializationException("Failed to get UhfReader instance");
            }
            setOutputPower(DEFAULT_POWER);
            isInitialized = true;
            Log.d(TAG, "✅ RFID INITIALIZATION COMPLETE");
        } catch (RfidOperationException e) {
            throw new RfidInitializationException("Failed to set power", e);
        } catch (Exception e) {
            throw new RfidInitializationException("Unexpected error", e);
        }
    }

    private void checkInitialization() throws RfidOperationException {
        if (!isInitialized || uhfReader == null) {
            throw new RfidOperationException("RFID not initialized");
        }
    }

    public void setOutputPower(int power) throws RfidOperationException {
        checkInitialization();
        if (power < MIN_POWER || power > MAX_POWER) {
            throw new RfidOperationException("Invalid power: " + power);
        }
        try {
            uhfReader.setOutputPower(power);
            Log.d(TAG, "✅ Power set to " + power);
        } catch (Exception e) {
            throw new RfidOperationException("Failed to set power", e);
        }
    }

    public List<TagModel> inventoryRealTime() throws RfidOperationException {
        checkInitialization();
        try {
            return uhfReader.inventoryRealTime();
        } catch (Exception e) {
            throw new RfidOperationException("Scan failed", e);
        }
    }

    public void stopInventoryMulti() throws RfidOperationException {
        checkInitialization();
        try {
            uhfReader.stopInventoryMulti();
        } catch (Exception e) {
            throw new RfidOperationException("Stop failed", e);
        }
    }

    public void release() {
        Log.d(TAG, "🧹 RELEASING RFID");
        try {
            // UhfReader doesn't have a release() method - just clear reference
            uhfReader = null;
        } catch (Exception e) {
            Log.e(TAG, "Error releasing", e);
        } finally {
            uhfReader = null;
            isInitialized = false;
        }
    }

    public boolean isInitialized() {
        return isInitialized;
    }
}
