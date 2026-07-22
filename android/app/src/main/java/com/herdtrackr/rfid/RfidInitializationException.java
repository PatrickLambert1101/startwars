package com.herdtrackr.rfid;

public class RfidInitializationException extends RfidException {
    public RfidInitializationException(String message) {
        super(message);
    }
    public RfidInitializationException(String message, Throwable cause) {
        super(message, cause);
    }
}
