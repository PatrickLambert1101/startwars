package com.entabeni.scanneraccess.RfidReader.RfidExceptions;

import com.entabeni.scanneraccess.RfidReader.RfidExceptions.RfidException;

public class RfidInitializationException extends RfidException {
    public RfidInitializationException(String message) {
        super(message);
    }

    public RfidInitializationException(String message, Throwable cause) {
        super(message, cause);
    }
}
