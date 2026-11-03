package com.herdtrackr.rfid;

import android.util.Log;
import com.handheld.uhfr.UHFRManager;
import com.uhf.api.cls.Reader;
import java.util.Arrays;
import java.util.List;

/** Owns the vendor UHF reader and its RF configuration. */
public final class RfidManager {
    private static final String TAG = "RfidManager";
    public static final int MIN_READ_POWER_DBM = 5;
    public static final int MAX_READ_POWER_DBM = 30;
    public static final int DEFAULT_READ_POWER_DBM = 30;
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
        configureReaderRegion();

        try {
            if (!reader.setGen2session(0)) {
                Log.w(TAG, "C6 SDK rejected Gen2 session 0; keeping the reader's current session");
            }
        } catch (Exception error) {
            Log.w(TAG, "Unable to configure Gen2 session 0; keeping the reader's current session", error);
        }

        try {
            setReadPower(readPowerDbm);
        } catch (RfidOperationException error) {
            // The C6 firmware can reject a power command immediately after the
            // serial reader opens even though inventory is ready.  Keep the
            // usable connection and let an explicit Settings change report a
            // power error without preventing scans.
            Log.w(TAG, "UHF reader connected, but initial power configuration was not accepted", error);
        }

        logReaderConfiguration("initialization");
    }

    public synchronized void setReadPower(int powerDbm) throws RfidOperationException {
        requireInitialized();
        validateReadPower(powerDbm);

        try {
            Reader.READER_ERR result = reader.setPower(powerDbm, powerDbm);
            if (result != Reader.READER_ERR.MT_OK_ERR) {
                throw new RfidOperationException("C6 SDK rejected read power " + powerDbm);
            }

            int[] reportedPower = reader.getPower();
            if (reportedPower != null && reportedPower.length > 0) {
                readPowerDbm = reportedPower[0];
            } else {
                readPowerDbm = powerDbm;
            }
            Log.i(
                TAG,
                "RFID read power requested " + powerDbm + " dBm; hardware reported " +
                    (reportedPower == null ? "unavailable" : Arrays.toString(reportedPower))
            );
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
        if (reader != null) {
            try {
                int[] reportedPower = reader.getPower();
                if (reportedPower != null && reportedPower.length > 0) {
                    readPowerDbm = reportedPower[0];
                }
            } catch (Exception error) {
                Log.w(TAG, "Unable to read power back from the UHF reader", error);
            }
        }
        return readPowerDbm;
    }

    private void logReaderConfiguration(String reason) {
        try {
            Log.i(
                TAG,
                "RFID configuration after " + reason +
                    ": hardware=" + reader.getHardware() +
                    ", region=" + reader.getRegion() +
                    ", frequencies=" + Arrays.toString(reader.getFrequencyPoints()) +
                    ", power=" + Arrays.toString(reader.getPower()) +
                    ", Gen2 session=" + reader.getGen2session() +
                    ", Q=" + reader.getQvalue() +
                    ", target=" + reader.getTarget()
            );
        } catch (Exception error) {
            Log.w(TAG, "Unable to read back the UHF reader configuration", error);
        }
    }

    private void configureReaderRegion() {
        try {
            Reader.READER_ERR regionResult = reader.setRegion(Reader.Region_Conf.RG_NA);
            if (regionResult != Reader.READER_ERR.MT_OK_ERR) {
                Log.w(TAG, "C6 SDK rejected its supported 915-928 MHz UHF profile");
            } else {
                Log.i(TAG, "C6 915-928 MHz UHF profile applied");
            }
        } catch (Exception error) {
            Log.w(TAG, "Unable to configure the C6 UHF region", error);
        }
    }

    public List<Reader.TAGINFO> inventory(short durationMs) throws RfidOperationException {
        requireInitialized();
        try {
            // tagInventoryRealTime() only drains tags from an async inventory
            // that has already been started. Our service performs bounded,
            // synchronous inventory cycles, so use the SDK call that actually
            // starts RF inventory for the requested time and returns its tags.
            return reader.tagInventoryByTimer(durationMs);
        } catch (LinkageError error) {
            // Vendor SDK linkage failures (for example a missing companion
            // class) are Errors rather than Exceptions. Convert them into the
            // normal scanner error path instead of crashing the process on the
            // Rx worker thread.
            throw new RfidOperationException("RFID SDK is incomplete or incompatible", error);
        } catch (Exception error) {
            throw new RfidOperationException("RFID inventory failed", error);
        }
    }

    public void stopInventory() throws RfidOperationException {
        requireInitialized();
        try {
            reader.stopTagInventory();
        } catch (Exception error) {
            throw new RfidOperationException("Unable to stop RFID inventory", error);
        }
    }

    public void clearInventoryFilter() {
        if (reader != null) {
            boolean cleared = reader.setCancleInventoryFilter();
            if (!cleared) {
                Log.w(TAG, "C6 SDK did not clear the inventory filter");
            }
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
