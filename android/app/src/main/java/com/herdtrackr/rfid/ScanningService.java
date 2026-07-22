package com.herdtrackr.rfid;

import android.util.Log;
import cn.pda.serialport.Tools;
import com.uhf.api.cls.Reader.TAGINFO;
import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java.util.List;

/** Runs inventory work away from the React Native/UI thread. */
public final class ScanningService {
    private static final String TAG = "ScanningService";
    private static final short INVENTORY_DURATION_MS = 150;
    private static final long PAUSE_BETWEEN_INVENTORIES_MS = 75;

    private final RfidManager rfidManager;
    private volatile boolean scanning;

    public ScanningService(RfidManager rfidManager) {
        this.rfidManager = rfidManager;
    }

    public Observable<String> startScanning() {
        return Observable.<String>create(emitter -> {
            scanning = true;
            rfidManager.clearInventoryFilter();

            while (scanning && !emitter.isDisposed()) {
                try {
                    List<TAGINFO> tags = rfidManager.inventory(INVENTORY_DURATION_MS);
                    if (tags != null) {
                        for (TAGINFO tag : tags) {
                            if (tag == null || tag.EpcId == null || tag.EpcId.length == 0) {
                                continue;
                            }

                            String epc = Tools.Bytes2HexString(tag.EpcId, tag.EpcId.length);
                            if (epc != null && !epc.trim().isEmpty()) {
                                scanning = false;
                                emitter.onNext(epc.trim().toUpperCase());
                                break;
                            }
                        }
                    }

                    if (scanning) {
                        Thread.sleep(PAUSE_BETWEEN_INVENTORIES_MS);
                    }
                } catch (InterruptedException error) {
                    Thread.currentThread().interrupt();
                    scanning = false;
                } catch (Exception error) {
                    scanning = false;
                    if (!emitter.isDisposed()) {
                        emitter.onError(error);
                    }
                    return;
                }
            }

            if (!emitter.isDisposed()) {
                emitter.onComplete();
            }
        }).subscribeOn(Schedulers.io());
    }

    public void stopScanning() {
        scanning = false;
        try {
            rfidManager.stopInventory();
        } catch (RfidOperationException error) {
            Log.w(TAG, "Unable to stop RFID inventory cleanly", error);
        }
    }

    public boolean isScanning() {
        return scanning;
    }

    public void cleanup() {
        stopScanning();
    }
}
