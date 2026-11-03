package cn.pda.serialport;

/** Pure-Java helpers required by the vendor's UHF67 protocol probe. */
public final class Tools {
    private static final char[] HEX = "0123456789ABCDEF".toCharArray();

    private Tools() {}

    public static byte[] HexString2Bytes(String value) {
        int length = value.length();
        byte[] result = new byte[length / 2];
        for (int index = 0; index < length; index += 2) {
            result[index / 2] = (byte) Integer.parseInt(value.substring(index, index + 2), 16);
        }
        return result;
    }

    public static String Bytes2HexString(byte[] bytes, int length) {
        if (bytes == null || length <= 0) return "";
        int safeLength = Math.min(length, bytes.length);
        char[] result = new char[safeLength * 2];
        for (int index = 0; index < safeLength; index++) {
            int value = bytes[index] & 0xFF;
            result[index * 2] = HEX[value >>> 4];
            result[index * 2 + 1] = HEX[value & 0x0F];
        }
        return new String(result);
    }
}
