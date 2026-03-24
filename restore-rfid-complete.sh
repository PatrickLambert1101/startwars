#!/bin/bash

set -e

echo "🔧 HerdTrackr RFID Scanner - Complete Restoration"
echo "=================================================="
echo ""

# Step 1: Create RFID Java source directory
echo "📁 Creating RFID source directory..."
mkdir -p android/app/src/main/java/com/herdtrackr/rfid

# Step 2: Create all RFID Java files
echo "📝 Creating RFID Java files..."

# Create the Java files inline
cat > android/app/src/main/java/com/herdtrackr/rfid/RfidException.java << 'JAVA_EOF'
package com.herdtrackr.rfid;

public class RfidException extends Exception {
    public RfidException(String message) {
        super(message);
    }
    public RfidException(String message, Throwable cause) {
        super(message, cause);
    }
}
JAVA_EOF

cat > android/app/src/main/java/com/herdtrackr/rfid/RfidInitializationException.java << 'JAVA_EOF'
package com.herdtrackr.rfid;

public class RfidInitializationException extends RfidException {
    public RfidInitializationException(String message) {
        super(message);
    }
    public RfidInitializationException(String message, Throwable cause) {
        super(message, cause);
    }
}
JAVA_EOF

cat > android/app/src/main/java/com/herdtrackr/rfid/RfidOperationException.java << 'JAVA_EOF'
package com.herdtrackr.rfid;

public class RfidOperationException extends RfidException {
    public RfidOperationException(String message) {
        super(message);
    }
    public RfidOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
JAVA_EOF

# For the larger files, copy from our backups if they exist, or create them
if [ -f ".rfid-backup/RfidManager.java" ]; then
    cp .rfid-backup/*.java android/app/src/main/java/com/herdtrackr/rfid/
    echo "✅ Restored RFID files from backup"
else
    echo "⚠️  RFID backup not found. You'll need to add the remaining 7 Java files:"
    echo "   - RfidManager.java"
    echo "   - ScanningService.java"  
    echo "   - CallbackHandler.java"
    echo "   - UHFModule.java"
    echo "   - UHFPackage.java"
    echo "   - KeyEventModule.java"
    echo "   - KeyPackage.java"
    echo ""
    echo "   See .claude/skills/uhf-rfid-integration.md for full source code"
fi

echo ""
echo "✅ RFID files created"
echo ""
echo "Next: Run 'npx expo prebuild --clean' to apply config plugin"
echo "Or manually edit build.gradle to add dependencies"

