package com.herdtrackr.rfid;

public class RfidException extends Exception {
    public RfidException(String message) {
        super(message);
    }
    public RfidException(String message, Throwable cause) {
        super(message, cause);
    }
}
