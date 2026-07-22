package com.herdtrackr.rfid;

import android.util.Log;
import com.handheld.uhfr.UHFRManager;
import com.uhf.api.cls.Reader.READER_ERR;
import com.uhf.api.cls.Reader.TAGINFO;
import java.util.List;

/** Owns the vendor UHF reader and its RF configuration. */
public final class RfidManager {
    private static final String TAG = "RfidManager";
    public static final int MIN_READ_POWER_DBM = 5;
    public static final int MAX_READ_POWER_DBM = 30;
    public static final int DEFAULT_READ_POWER_DBM = 18;
    private static final int DEFAULT_WRITE_POWER_DBM = 18;
    private static final int MAX_INITIALIZATION_ATTEMPTS = 3;

    private static RfidManager instance;
    private UHFRManager reader;
    private boolean initialized;
    private int readPowerDbm = DEFAULT_READ_POWER_DBM;

    private RfidManager() {}

    public static synchronized RfidManager getInstance() {
        if (instance == null) {
            instance = new RfidManager();
        }
        return instance;
    }

    public synchronized void initialize() throws RfidInitializationException {
        if (initialized && reader != null) {
            return;
        }

        for (int attempt = 1; attempt <= MAX_INITIALIZATION_ATTEMPTS && reader == null; attempt++) {
            reader = UHFRManager.getInstance();
            if (reader == null && attempt < MAX_INITIALIZATION_ATTEMPTS) {
                try {
                    Thread.sleep(100);
                } catch (InterruptedException error) {
                    Thread.currentThread().interrupt();
                    throw new RfidInitializationException("RFID initialization was interrupted", error);
                }
            }
        }

        if (reader == null) {
            throw new RfidInitializationException("Unable to connect to the UHF reader");
        }

        initialized = true;
        try {
            setReadPower(readPowerDbm);
        } catch (RfidOperationException error) {
            initialized = false;
            reader.close();
            reader = null;
            throw new RfidInitializationException("Unable to configure RFID read power", error);
        }

        Log.i(TAG, "UHF reader initialized at " + readPowerDbm + " dBm read power");
    }

    public synchronized void setReadPower(int powerDbm) throws RfidOperationException {
        requireInitialized();
        validateReadPower(powerDbm);

        try {
            int writePowerDbm = DEFAULT_WRITE_POWER_DBM;
            int[] currentPower = reader.getPower();
            if (currentPower != null && currentPower.length > 1) {
                writePowerDbm = currentPower[1];
            }

            READER_ERR result = reader.setPower(powerDbm, writePowerDbm);
            if (result != READER_ERR.MT_OK_ERR) {
                throw new RfidOperationException("Vendor SDK rejected read power " + powerDbm + ": " + result);
            }

            readPowerDbm = powerDbm;
            Log.i(TAG, "RFID read power set to " + powerDbm + " dBm");
        } catch (RfidOperationException error) {
            throw error;
        } catch (Exception error) {
            throw new RfidOperationException("Unable to set RFID read power to " + powerDbm, error);
        }
    }

    /** Backwards-compatible name used by older native callers. */
    public void setOutputPower(int powerDbm) throws RfidOperationException {
        setReadPower(powerDbm);
    }

    public synchronized int getReadPower() {
        return readPowerDbm;
    }

    public List<TAGINFO> inventory(short durationMs) throws RfidOperationException {
        requireInitialized();
        try {
            return reader.tagInventoryByTimer(durationMs);
        } catch (Exception error) {
            throw new RfidOperationException("RFID inventory failed", error);
        }
    }

    public void stopInventory() throws RfidOperationException {
        requireInitialized();
        try {
            if (!reader.stopTagInventory()) {
                Log.w(TAG, "Vendor SDK did not acknowledge inventory stop");
            }
        } catch (Exception error) {
            throw new RfidOperationException("Unable to stop RFID inventory", error);
        }
    }

    public void clearInventoryFilter() {
        if (reader != null && !reader.setCancleInventoryFilter()) {
            Log.w(TAG, "Vendor SDK did not clear the inventory filter");
        }
    }

    public synchronized void release() {
        if (reader != null) {
            try {
                reader.stopTagInventory();
            } catch (Exception error) {
                Log.w(TAG, "Unable to stop inventory while releasing the reader", error);
            }
            try {
                reader.close();
            } catch (Exception error) {
                Log.w(TAG, "Unable to close the reader cleanly", error);
            }
        }
        reader = null;
        initialized = false;
    }

    public synchronized boolean isInitialized() {
        return initialized && reader != null;
    }

    private void requireInitialized() throws RfidOperationException {
        if (!isInitialized()) {
            throw new RfidOperationException("RFID reader is not initialized");
        }
    }

    private static void validateReadPower(int powerDbm) throws RfidOperationException {
        if (powerDbm < MIN_READ_POWER_DBM || powerDbm > MAX_READ_POWER_DBM) {
            throw new RfidOperationException(
                "Read power must be between " + MIN_READ_POWER_DBM + " and " + MAX_READ_POWER_DBM + " dBm"
            );
        }
    }
}
