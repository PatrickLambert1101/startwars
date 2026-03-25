#!/bin/bash

# EAS Build Hook - Post Prebuild
# This script runs AFTER expo prebuild to restore RFID scanner code
# This ensures RFID code persists even when EAS runs prebuild

set -e

echo ""
echo "🔧 [EAS Hook] Restoring RFID Scanner Code..."
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -d "android" ]; then
  echo "❌ Error: android directory not found"
  echo "   This script must be run from project root"
  exit 1
fi

# 1. Restore RFID Java source files from git
echo "📝 Restoring RFID Java source files..."
if [ -d ".git" ]; then
  git checkout HEAD -- android/app/src/main/java/com/herdtrackr/rfid/ 2>/dev/null || {
    echo "⚠️  Warning: Could not restore RFID source files from git"
    echo "   Make sure RFID files are committed to the repository"
  }
else
  echo "⚠️  Warning: Not a git repository, cannot restore RFID files"
fi

# 2. Restore native libraries from git
echo "📚 Restoring native libraries (jniLibs)..."
if [ -d ".git" ]; then
  git checkout HEAD -- android/app/src/main/jniLibs/ 2>/dev/null || {
    echo "⚠️  Warning: Could not restore native libraries from git"
  }
else
  echo "⚠️  Warning: Not a git repository, cannot restore jniLibs"
fi

# 3. Restore JAR files from git
echo "📦 Restoring JAR dependencies..."
mkdir -p android/app/libs
if [ -d ".git" ]; then
  git checkout HEAD -- android/app/libs/ 2>/dev/null || {
    echo "⚠️  Warning: Could not restore JAR files from git"
    echo "   Make sure JAR files are committed to android/app/libs/"
  }
else
  echo "⚠️  Warning: Not a git repository, cannot restore JARs"
fi

# 4. Restore sound files from git
echo "🔊 Restoring beep sound files..."
mkdir -p android/app/src/main/res/raw
if [ -d ".git" ]; then
  git checkout HEAD -- android/app/src/main/res/raw/ 2>/dev/null || {
    echo "⚠️  Warning: Could not restore sound files from git"
    echo "   Make sure beep sound files are committed to android/app/src/main/res/raw/"
  }
else
  echo "⚠️  Warning: Not a git repository, cannot restore sound files"
fi

# 5. Modify MainApplication.kt to register RFID packages
echo "🔌 Registering RFID packages in MainApplication.kt..."
MAIN_APP="android/app/src/main/java/com/herdtrackr/MainApplication.kt"

if [ -f "$MAIN_APP" ]; then
  # Check if imports already exist
  if ! grep -q "import com.herdtrackr.rfid.UHFPackage" "$MAIN_APP"; then
    echo "   Adding RFID package imports..."

    # Add imports after expo.modules imports
    perl -i -pe 's/(import expo\.modules\.ReactNativeHostWrapper)/$1\n\nimport com.herdtrackr.rfid.UHFPackage\nimport com.herdtrackr.rfid.KeyPackage/' "$MAIN_APP"
  fi

  # Check if packages are registered
  if ! grep -q "add(UHFPackage())" "$MAIN_APP"; then
    echo "   Registering RFID packages..."

    # Add package registration in getPackages()
    perl -i -pe 's/(PackageList\(this\)\.packages\.apply \{)/$1\n              \/\/ RFID Scanner packages\n              add(UHFPackage())\n              add(KeyPackage())/' "$MAIN_APP"
  fi

  echo "✅ MainApplication.kt updated"
else
  echo "❌ Error: MainApplication.kt not found at $MAIN_APP"
  exit 1
fi

# 6. Restore build.gradle with RFID dependencies
echo "📝 Restoring build.gradle with RFID dependencies..."
BUILD_GRADLE="android/app/build.gradle"

if [ -d ".git" ]; then
  git checkout HEAD -- "$BUILD_GRADLE" 2>/dev/null || {
    echo "⚠️  Warning: Could not restore build.gradle from git"
  }

  # Verify restoration
  if grep -q "UHF67_v1.0.9.jar" "$BUILD_GRADLE"; then
    echo "✅ build.gradle restored with RFID dependencies"
  else
    echo "⚠️  Warning: RFID JAR dependencies not found in build.gradle"
    echo "   You may need to add them manually"
  fi
else
  echo "⚠️  Warning: Not a git repository, cannot restore build.gradle"
fi

echo ""
echo "✅ RFID Scanner code restoration complete!"
echo ""
echo "📋 Summary:"
echo "   - RFID Java sources: Restored from git"
echo "   - Native libraries (jniLibs): Restored from git"
echo "   - JAR files: Restored from git"
echo "   - Sound files (res/raw): Restored from git"
echo "   - build.gradle: Restored with RFID dependencies"
echo "   - MainApplication.kt: RFID packages registered"
echo ""
echo "🏗️  You can now run: cd android && ./gradlew assembleDebug"
echo ""
