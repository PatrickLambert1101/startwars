package com.herdtrackr.rfid;

import android.util.Log;
import com.uhf.api.cls.Reader.TAGINFO;
import cn.pda.serialport.Tools;
import java.util.List;
import java.util.concurrent.TimeUnit;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;

/**
 * RFID Scanning Service for Trigger Hand Scanner
 * Based on working implementation from Rental-Scanner-v2
 */
public class ScanningService {
    private static final String TAG = "🟢 ScanningService";
    private static final short INVENTORY_TIMER = 150;  // 150ms timer for tagInventoryByTimer
    private static final int THROTTLE_MS = 500;
    private final RfidManager rfidManager;
    private final CompositeDisposable disposables = new CompositeDisposable();
    private volatile boolean isScanning = false;

    public ScanningService(RfidManager rfidManager) {
        this.rfidManager = rfidManager;
    }

    public Observable<Object> startScanning() {
        Log.d(TAG, "🎯 START SCANNING (Using tagInventoryByTimer with 150ms timer)");
        return Observable.create(emitter -> {
            isScanning = true;

            // Cancel any previous inventory filter before starting
            try {
                rfidManager.setCancelInventoryFilter();
            } catch (Exception e) {
                Log.w(TAG, "Could not cancel inventory filter: " + e.getMessage());
            }

            while (isScanning && !emitter.isDisposed()) {
                try {
                    // Use tagInventoryByTimer - THE CORRECT METHOD for trigger scanners
                    List<TAGINFO> tags = rfidManager.tagInventoryByTimer(INVENTORY_TIMER);

                    // Log exactly what the hardware returns
                    Log.d(TAG, "📊 tagInventoryByTimer() returned: " + (tags == null ? "NULL" : "List with " + tags.size() + " items"));

                    if (tags != null && !tags.isEmpty()) {
                        Log.d(TAG, "📡 Found " + tags.size() + " tag(s)");
                        for (int i = 0; i < tags.size(); i++) {
                            TAGINFO tag = tags.get(i);
                            Log.d(TAG, "  [" + i + "] Processing tag...");

                            byte[] epcData = tag.EpcId;
                            Log.d(TAG, "  [" + i + "] EPC data: " + (epcData == null ? "NULL" : "byte[" + epcData.length + "]"));

                            if (epcData != null && epcData.length > 0) {
                                String epcHex = Tools.Bytes2HexString(epcData, epcData.length);
                                Log.d(TAG, "  [" + i + "] EPC hex: " + (epcHex == null || epcHex.isEmpty() ? "EMPTY" : epcHex));

                                if (epcHex != null && !epcHex.isEmpty()) {
                                    // Filter for tags starting with 'E' (like in working implementation)
                                    if (epcHex.toLowerCase().startsWith("e")) {
                                        Log.d(TAG, "✅ Tag found: " + epcHex);
                                        stopScanning();
                                        emitter.onNext(epcHex);
                                        break;
                                    } else {
                                        Log.d(TAG, "  [" + i + "] ⏭️  Skipping tag (doesn't start with 'E'): " + epcHex);
                                    }
                                } else {
                                    Log.w(TAG, "  [" + i + "] ⚠️ EPC converted to empty string");
                                }
                            } else {
                                Log.w(TAG, "  [" + i + "] ⚠️ EPC data is null or empty");
                            }
                        }
                    } else {
                        Log.v(TAG, "🔍 No tags detected in this cycle (tags is " + (tags == null ? "null" : "empty list") + ")");
                    }

                    // Small delay between scans
                    Thread.sleep(100);
                } catch (RfidOperationException e) {
                    Log.e(TAG, "❌ Scan error: " + e.getMessage());
                    emitter.onError(e);
                    stopScanning();
                    break;
                } catch (InterruptedException e) {
                    break;
                } catch (Exception e) {
                    Log.e(TAG, "❌ Unexpected error: " + e.getMessage());
                    emitter.onError(e);
                    stopScanning();
                    break;
                }
            }
            if (!emitter.isDisposed()) emitter.onComplete();
            Log.d(TAG, "🏁 SCANNING STOPPED");
        }).subscribeOn(Schedulers.io())
          .observeOn(AndroidSchedulers.mainThread())
          .throttleFirst(THROTTLE_MS, TimeUnit.MILLISECONDS)
          .distinctUntilChanged();
    }

    public void stopScanning() {
        if (isScanning) {
            Log.d(TAG, "🛑 STOP SCANNING");
            isScanning = false;
            try {
                rfidManager.stopTagInventory();
            } catch (RfidOperationException e) {
                Log.e(TAG, "Error stopping", e);
            }
            disposables.clear();
        }
    }

    public boolean isScanning() {
        return isScanning;
    }

    public void cleanup() {
        stopScanning();
    }
}
