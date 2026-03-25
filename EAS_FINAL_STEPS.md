# Final Steps for EAS Build - RFID Integration

## ✅ What We Discovered

**Problem:** `expo prebuild --clean` deletes all RFID custom code (Java files, JARs, native libs)

**Solution:** Use a post-prebuild hook that runs `git restore android/` to restore everything from git

---

## 🚀 You're Ready! Here's What to Do:

### 1. **Commit Everything**

```bash
# Add the updated app.json (plugin removed)
git add app.json

# Add the EAS build hook
git add .eas/build/post-prebuild.sh

# Commit
git commit -m "Configure EAS build with RFID post-prebuild hook"

# Push
git push origin main
```

### 2. **Build with EAS**

```bash
# For testing (faster, builds APK):
eas build --platform android --profile preview

# For production (slower, builds AAB for Play Store):
eas build --platform android --profile production
```

### 3. **What Happens During EAS Build:**

1. EAS checks out your code from git
2. Runs `npx expo prebuild` (deletes RFID files)
3. **Runs `.eas/build/post-prebuild.sh` hook** → Restores RFID files from git
4. Gradle builds APK/AAB with all RFID code

---

## 📋 Verification Checklist

After EAS build completes:

### Check Build Logs

Look for this in the EAS build logs:

```
🔧 POST-PREBUILD HOOK: Restoring RFID files from git...
📥 Running: git restore android/
✅ Found 10 RFID Java files
✅ Found 9 JAR files
✅ All RFID files restored successfully
✅ POST-PREBUILD HOOK COMPLETE
```

### Download and Test APK

```bash
# Download APK
eas build:download --platform android --profile preview

# Verify RFID libraries in APK
unzip -l app.apk | grep -E "(libuhf|libjni_rfid)"

# Should show:
# ✅ lib/arm64-v8a/libuhf.so
# ✅ lib/arm64-v8a/libjni_rfid_driver.so
# ✅ lib/armeabi-v7a/libuhf.so
# ✅ lib/armeabi-v7a/libjni_rfid_driver.so
```

---

## 🎯 Key Files

### Required for EAS Build:

1. **`.eas/build/post-prebuild.sh`** ✅ (Created)
   - Restores RFID files from git after prebuild
   - Must be executable (`chmod +x`)

2. **All RFID files in git:** ✅ (Already committed)
   - 10 Java files in `android/app/src/main/java/com/herdtrackr/rfid/`
   - 9 JAR files in `android/app/libs/`
   - 52 .so files in `android/app/src/main/jniLibs/`
   - MainActivity.kt and MainApplication.kt with RFID setup
   - build.gradle with dependencies

3. **app.json** ✅ (Plugin removed - not needed)
   - The config plugin was trying to inject files from templates
   - Since files are in git, we don't need the plugin
   - Just use the post-prebuild hook instead

---

## 🔧 Troubleshooting

### If EAS Build Fails with "Cannot find symbol UhfReader"

**Cause:** Post-prebuild hook didn't run or failed

**Fix:**
1. Check EAS build logs for hook output
2. Verify `.eas/build/post-prebuild.sh` exists and is executable
3. Verify all RFID files are committed to git: `git ls-files android/app/src/main/java/com/herdtrackr/rfid/`

### If Hook Fails with "RFID files not found"

**Cause:** Files not committed to git

**Fix:**
```bash
git add android/app/src/main/java/com/herdtrackr/rfid/
git add android/app/libs/
git add android/app/src/main/jniLibs/
git add android/app/src/main/java/com/herdtrackr/MainActivity.kt
git add android/app/src/main/java/com/herdtrackr/MainApplication.kt
git commit -m "Add all RFID files"
git push
```

---

## 📊 Build Status

### Local Build: ✅ SUCCESS
- APK size: 314 MB
- All RFID code included
- Native libraries: ✅
- Build time: ~3 minutes

### EAS Build: Ready for Testing
- Post-prebuild hook: ✅ Created
- All files committed: ✅
- Configuration: ✅ Complete

---

## 🎉 Summary

You're all set! The key insight is:

1. **`expo prebuild --clean` DELETES custom code** (this is normal)
2. **But since files are in git, we can restore them** with `git restore android/`
3. **The post-prebuild hook automates this** for EAS builds

Just **commit, push, and run `eas build`**! 🚀
