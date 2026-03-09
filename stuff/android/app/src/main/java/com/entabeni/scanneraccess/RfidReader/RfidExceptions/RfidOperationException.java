package com.entabeni.scanneraccess.RfidReader.RfidExceptions;

public class RfidOperationException extends RfidException {
    public RfidOperationException(String message) {
        super(message);
    }

    public RfidOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}