package com.entabeni.scanneraccess.RfidReader.RfidExceptions;

public class RfidException extends Exception {
    public RfidException(String message) {
        super(message);
    }

    public RfidException(String message, Throwable cause) {
        super(message, cause);
    }
}
