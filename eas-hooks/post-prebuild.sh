#!/bin/bash

# EAS Build Hook - Post Prebuild
# This script runs AFTER expo prebuild to inject RFID scanner code
# This ensures RFID code persists even when EAS runs prebuild

set -e

echo ""
echo "🔧 [EAS Hook] Injecting RFID Scanner Code..."
echo "=============================================="
echo ""

RFID_DIR="android/app/src/main/java/com/herdtrackr/rfid"

# Create RFID directory
mkdir -p "$RFID_DIR"

echo "📁 Created directory: $RFID_DIR"
echo ""
echo "📝 Creating RFID Java files..."

# Note: The full Java source files need to be added here
# For now, we'll create a marker file
cat > "$RFID_DIR/README.txt" << 'TXT'
RFID Java source files should be placed here.
See .claude/skills/ for full implementation.
TXT

echo "✅ RFID directory prepared"
echo ""
echo "⚠️  NOTE: Full RFID Java files need to be committed to repo"
echo "   or added to this hook script for EAS builds to work"
echo ""
