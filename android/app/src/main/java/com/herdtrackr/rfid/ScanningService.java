package com.herdtrackr.rfid;

import android.util.Log;
import com.android.hdhe.uhf.readerInterface.TagModel;
import java.util.List;
import java.util.concurrent.TimeUnit;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;

public class ScanningService {
    private static final String TAG = "🟢 ScanningService";
    private static final int SCAN_INTERVAL_MS = 100;
    private static final int THROTTLE_MS = 500;
    private final RfidManager rfidManager;
    private final CompositeDisposable disposables = new CompositeDisposable();
    private volatile boolean isScanning = false;

    public ScanningService(RfidManager rfidManager) {
        this.rfidManager = rfidManager;
    }

    public Observable<Object> startScanning() {
        Log.d(TAG, "🎯 START SCANNING");
        return Observable.create(emitter -> {
            isScanning = true;
            while (isScanning && !emitter.isDisposed()) {
                try {
                    List<TagModel> tags = rfidManager.inventoryRealTime();
                    if (tags != null && !tags.isEmpty()) {
                        for (TagModel tag : tags) {
                            byte[] epcData = tag.getmEpcBytes();
                            if (epcData != null && epcData.length > 0) {
                                String epcHex = bytesToHex(epcData);
                                if (epcHex != null && !epcHex.isEmpty()) {
                                    Log.d(TAG, "✅ Tag found: " + epcHex);
                                    stopScanning();
                                    emitter.onNext(epcHex);
                                    break;
                                }
                            }
                        }
                    }
                    Thread.sleep(SCAN_INTERVAL_MS);
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
                rfidManager.stopInventoryMulti();
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

    private static String bytesToHex(byte[] bytes) {
        if (bytes == null || bytes.length == 0) return "";
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }
}
