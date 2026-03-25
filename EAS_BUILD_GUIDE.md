# HerdTrackr RFID - EAS Build Guide

## ✅ Current Status

**Local Android Build:** ✅ SUCCESSFUL
**APK Size:** 314 MB
**All RFID Code:** ✅ Committed to Git

### What's Included:

- ✅ 10 RFID Java files (`android/app/src/main/java/com/herdtrackr/rfid/`)
- ✅ 9 JAR files (`android/app/libs/*.jar`)
- ✅ 52 Native libraries (`android/app/src/main/jniLibs/*/*.so`)
- ✅ MainActivity with hardware button support
- ✅ MainApplication with UHFPackage & KeyPackage registration
- ✅ build.gradle with RxJava3 and JAR dependencies

---

## 🚀 Building with EAS

### Quick Start (Recommended)

Since all RFID files are committed to git, EAS builds should "just work":

```bash
# Build preview APK
eas build --platform android --profile preview

# Build production AAB
eas build --platform android --profile production
```

### What Happens During EAS Build:

1. EAS checks out your git repository
2. Runs `npx expo prebuild` (regenerates android folder from git)
3. All committed files (RFID Java, JARs, .so files) are restored from git
4. Gradle builds the APK/AAB with all RFID code included

---

## 🔍 Verification Checklist

After your EAS build completes:

### 1. Download and inspect the APK:

```bash
# Download from EAS
eas build:download --platform android --profile preview

# Verify RFID native libraries
unzip -l app.apk | grep -E "(libuhf|libjni_rfid|libDeviceAPI)"

# Should show:
# ✅ lib/arm64-v8a/libuhf.so
# ✅ lib/arm64-v8a/libjni_rfid_driver.so
# ✅ lib/arm64-v8a/libDeviceAPI.so
# ✅ lib/armeabi-v7a/libuhf.so (32-bit)
# etc.
```

### 2. Install on device and check logs:

```bash
# Install APK
adb install -r app.apk

# Watch logs for RFID initialization
adb logcat | grep -E "🟡|🔵|🟢|🔴|🟣|UHF|RFID"

# You should see:
# 🟡 MainApplication: REGISTERING CUSTOM NATIVE MODULES
# ✅ Registered UHFPackage
# ✅ Registered KeyPackage
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find symbol" errors during EAS build

**Cause:** JAR files or native libraries missing from git
**Fix:** Verify all files are committed:

```bash
git ls-files android/app/libs/*.jar              # Should show 9 JARs
git ls-files android/app/src/main/jniLibs/       # Should show 52 .so files
git ls-files android/app/src/main/java/com/herdtrackr/rfid/  # Should show 10 .java files
```

### Issue: UHFReader not found at runtime

**Cause:** JAR files not included in APK
**Fix:** Check build.gradle has:

```gradle
dependencies {
    implementation files('libs/uhfcom13_v15.jar')
    implementation files('libs/DeviceAPIver20150204.jar')
    // ... all 9 JARs
}
```

### Issue: Native library not found (UnsatisfiedLinkError)

**Cause:** .so files not in jniLibs folder
**Fix:** Verify folder structure:

```
android/app/src/main/jniLibs/
├── arm64-v8a/
│   ├── libuhf.so
│   ├── libjni_rfid_driver.so
│   └── ...
├── armeabi-v7a/
│   ├── libuhf.so
│   └── ...
```

### Issue: KeyEventModule or UHFModule not registered

**Cause:** MainActivity/MainApplication customizations lost
**Check:**

```bash
# Verify imports in MainApplication.kt
grep -E "UHFPackage|KeyPackage" android/app/src/main/java/com/herdtrackr/MainApplication.kt

# Should show:
# import com.herdtrackr.rfid.UHFPackage
# import com.herdtrackr.rfid.KeyPackage
# add(UHFPackage())
# add(KeyPackage())
```

---

## 📦 Build Configuration

### Current eas.json settings:

```json
{
  "build": {
    "base": {
      "node": "20.18.1",
      "env": {
        "NPM_CONFIG_LEGACY_PEER_DEPS": "true"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### Build Profiles:

- **preview:** Builds APK for testing (faster)
- **production:** Builds AAB for Play Store (slower, optimized)

---

## 🎯 Testing on Device

### Prerequisites:

- Chafon C6 RFID scanner device running Android
- USB debugging enabled
- ADB installed

### Installation:

```bash
# Install from EAS
eas build:download --platform android --profile preview
adb install -r app.apk

# Or install directly from EAS URL
adb install -r https://expo.dev/artifacts/eas/...
```

### Testing RFID:

1. Open app
2. Navigate to screen with RFID scanning
3. Press hardware scan button (keyCode 137)
4. Scan an RFID tag
5. Check logs for tag detection:

```bash
adb logcat | grep "🟢 ScanningService"
# Should show: ✅ Tag found: <EPC_HEX>
```

---

## 🔄 Updating RFID Code

If you need to modify RFID code in the future:

1. **Edit files locally**
2. **Test build:**
   ```bash
   cd android && ./gradlew assembleDebug
   ```
3. **Commit changes:**
   ```bash
   git add android/app/src/main/java/com/herdtrackr/rfid/
   git commit -m "Update RFID implementation"
   git push
   ```
4. **Build with EAS:**
   ```bash
   eas build --platform android --profile preview
   ```

---

## 📚 Additional Resources

- **RFID Architecture:** See `.claude/skills/uhf-rfid-integration.md`
- **Implementation Details:** See `.claude/skills/uhf-implementation-comparison.md`
- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Android Native Modules:** https://reactnative.dev/docs/native-modules-android

---

## ✨ Summary

Everything is set up correctly! Your RFID code is:

- ✅ Committed to git
- ✅ Properly structured
- ✅ Builds successfully locally
- ✅ Ready for EAS builds

**Next step:** Just run `eas build` and it should work! 🚀
