package com.entabeni.scanneraccess.RfidReader;

import java.util.List;
import android.util.Log;
import com.android.hdhe.uhf.reader.UhfReader;
import com.android.hdhe.uhf.readerInterface.TagModel;
import com.entabeni.scanneraccess.RfidReader.RfidExceptions.RfidInitializationException;
import com.entabeni.scanneraccess.RfidReader.RfidExceptions.RfidOperationException;

public class RfidManager {
    private static final String TAG = "RfidManager";
    private static RfidManager instance;
    private UhfReader uhfReader;
    private boolean isInitialized = false;

    private RfidManager() {}

    public static synchronized RfidManager getInstance() {
        if (instance == null) {
            instance = new RfidManager();
        }
        return instance;
    }

    public void initialize() throws RfidInitializationException {
        if (isInitialized) {
            Log.d(TAG, "RFID Manager already initialized");
            return;
        }
        Log.d(TAG,"Attempting Initialization");
        try {
            uhfReader = UhfReader.getInstance();
            if (uhfReader == null) {
                throw new RfidInitializationException("Failed to get UhfReader instance");
            }
            uhfReader.setOutputPower(18); // Range: 18 - 27
            isInitialized = true;
            Log.d(TAG, "RFID Manager initialized successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error initializing RFID Manager", e);
            throw new RfidInitializationException("Failed to initialize RFID Manager: " + e.getMessage());
        }
    }

    public void setOutputPower(int power) throws RfidOperationException {
        checkInitialization();
        try {
            uhfReader.setOutputPower(power);
            Log.d(TAG, "Output power set to " + power);
        } catch (Exception e) {
            Log.e(TAG, "Error setting output power", e);
            throw new RfidOperationException("Failed to set output power: " + e.getMessage());
        }
    }

    public List<TagModel> inventoryRealTime() throws RfidOperationException {
        checkInitialization();
        try {
            return uhfReader.inventoryRealTime();
        } catch (Exception e) {
            Log.e(TAG, "Error during inventory real time", e);
            throw new RfidOperationException("Failed to perform inventory: " + e.getMessage());
        }
    }

    public void stopInventoryMulti() throws RfidOperationException {
        checkInitialization();
        try {
            uhfReader.stopInventoryMulti();
            Log.d(TAG, "Inventory multi stopped");
        } catch (Exception e) {
            Log.e(TAG, "Error stopping inventory multi", e);
            throw new RfidOperationException("Failed to stop inventory: " + e.getMessage());
        }
    }

    public void release() {
        if (uhfReader != null) {
            try {
                uhfReader.close();
                Log.d(TAG, "RFID Manager resources released");
            } catch (Exception e) {
                Log.e(TAG, "Error releasing RFID Manager resources", e);
            }
        }
        isInitialized = false;
        instance = null;
    }

    private void checkInitialization() throws RfidOperationException {
        if (!isInitialized) {
            throw new RfidOperationException("RFID Manager is not initialized");
        }
    }
}