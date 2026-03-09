package com.entabeni.scanneraccess.RfidReader;


import io.reactivex.rxjava3.annotations.NonNull;
import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import com.android.hdhe.uhf.readerInterface.TagModel;
import com.entabeni.scanneraccess.RfidReader.RfidExceptions.RfidOperationException;

import cn.pda.serialport.Tools;
import android.util.Log;

import java.util.List;
import java.util.concurrent.TimeUnit;

public class ScanningService {
    private static final String TAG = "ScanningService";
    private final RfidManager rfidManager;
    private boolean isScanning = false;

    public ScanningService(RfidManager rfidManager) {
        this.rfidManager = rfidManager;
    }

    public @NonNull Observable<Object> startScanning() {
        return Observable.create(emitter -> {
                    isScanning = true;
                    try {
                        while (isScanning && !emitter.isDisposed()) {
                            List<TagModel> tags = rfidManager.inventoryRealTime();
                            if (tags != null && !tags.isEmpty()) {
                                for (TagModel tag : tags) {
                                    byte[] epcData = tag.getmEpcBytes();
                                    String epcHex = Tools.Bytes2HexString(epcData, epcData.length);
                                    if (epcHex != null && !epcHex.isEmpty()) {
                                        stopScanning();
                                    }
                                    emitter.onNext(epcHex);
                                }
                            }
                            // Add a small delay to prevent overwhelming the system
                            Thread.sleep(100);
                        }
                    } catch (InterruptedException e) {
                        Log.d(TAG, "Scanning interrupted", e);
                        // Restore the interrupt status
                        Thread.currentThread().interrupt();
                    } finally {
                        stopScanning();
                    }
                    emitter.onComplete();
                }).subscribeOn(Schedulers.io())
                .throttleFirst(500, TimeUnit.MILLISECONDS) // Limit emission rate
                .distinctUntilChanged(); // Only emit when the tag changes
    }

    public void stopScanning() {
        isScanning = false;
        try {
            rfidManager.stopInventoryMulti();
            Log.d(TAG, "Scanning stopped");
        } catch (RfidOperationException e) {
            throw new RuntimeException(e);
        }
    }
}