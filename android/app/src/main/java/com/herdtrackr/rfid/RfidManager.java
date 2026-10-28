package com.herdtrackr.rfid;

import android.util.Log;
import com.android.hdhe.uhf.reader.UhfReader;
import com.android.hdhe.uhf.readerInterface.TagModel;
import java.util.List;

/** Owns the vendor UHF reader and its RF configuration. */
public final class RfidManager {
    private static final String TAG = "RfidManager";
    public static final int MIN_READ_POWER_DBM = 5;
    public static final int MAX_READ_POWER_DBM = 30;
    public static final int DEFAULT_READ_POWER_DBM = 18;
    private static final int MAX_INITIALIZATION_ATTEMPTS = 3;

    private static RfidManager instance;
    private UhfReader reader;
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
            reader = UhfReader.getInstance();
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
            // The C6 firmware can reject a power command immediately after the
            // serial reader opens even though inventory is ready.  Keep the
            // usable connection and let an explicit Settings change report a
            // power error without preventing scans.
            Log.w(TAG, "UHF reader connected, but initial power configuration was not accepted", error);
        }

        Log.i(TAG, "UHF reader initialized at " + readPowerDbm + " dBm read power");
    }

    public synchronized void setReadPower(int powerDbm) throws RfidOperationException {
        requireInitialized();
        validateReadPower(powerDbm);

        try {
            if (!reader.setOutputPower(powerDbm)) {
                throw new RfidOperationException("C6 SDK rejected read power " + powerDbm);
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

    public List<TagModel> inventory(short durationMs) throws RfidOperationException {
        requireInitialized();
        try {
            return reader.inventoryRealTime();
        } catch (Exception error) {
            throw new RfidOperationException("RFID inventory failed", error);
        }
    }

    public void stopInventory() throws RfidOperationException {
        requireInitialized();
        try {
            reader.stopInventoryMulti();
        } catch (Exception error) {
            throw new RfidOperationException("Unable to stop RFID inventory", error);
        }
    }

    public void clearInventoryFilter() {
        if (reader != null) {
            int result = reader.unSelect();
            if (result != 0) {
                Log.w(TAG, "C6 SDK did not clear the inventory filter: " + result);
            }
        }
    }

    public synchronized void release() {
        if (reader != null) {
            try {
                reader.stopInventoryMulti();
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
