package cn.pda.serialport;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/** Lets the vendor UHF67 SDK use the C6's devapi/uhf serial driver. */
public final class SerialPort {
    private com.android.hdhe.uhf.reader.SerialPort delegate;

    public SerialPort() {
        // UHF67 creates a power-only helper before it opens the real port.
        // The C6 driver powers the module after the port is opened.
    }

    public SerialPort(int port, int baudRate, int flags) throws IOException {
        delegate = new com.android.hdhe.uhf.reader.SerialPort(port, baudRate, flags);
        delegate.psampoweron();
    }

    public InputStream getInputStream() {
        return delegate.getInputStream();
    }

    public OutputStream getOutputStream() {
        return delegate.getOutputStream();
    }

    public void close(int port) {
        delegate.close(port);
    }

    public void power_5Von() {
        if (delegate != null) delegate.psampoweron();
    }

    public void power_5Voff() {
        if (delegate != null) delegate.psampoweroff();
    }
}
