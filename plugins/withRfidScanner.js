const { withAppBuildGradle, withMainApplication, withMainActivity } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for UHF RFID Scanner Integration
 * This plugin automatically injects all RFID native code during prebuild
 */
function withRfidScanner(config) {
  // 1. Modify app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    const { modResults } = config;
    let gradle = modResults.contents;

    // Add RxJava dependencies
    if (!gradle.includes('io.reactivex.rxjava3')) {
      gradle = gradle.replace(
        /dependencies \{/,
        `dependencies {
    // RxJava3 for RFID scanning service
    implementation 'io.reactivex.rxjava3:rxjava:3.1.5'
    implementation 'io.reactivex.rxjava3:rxandroid:3.0.2'

    // UHF RFID Scanner JAR dependencies
    implementation files('libs/uhfcom13_v15.jar')
    implementation files('libs/DeviceAPIver20150204.jar')
    implementation files('libs/IGLBarDecoder.jar')
    implementation files('libs/SerialPort.jar')
    implementation files('libs/reader(1).jar')
    implementation files('libs/logutil-1.5.1.1.jar')
    implementation files('libs/ModuleAPI_J.jar')
    implementation files('libs/jxl.jar')
`
      );
    }

    // Add BuildConfig field to defaultConfig
    if (!gradle.includes('ENABLE_VERBOSE_RFID_LOGS')) {
      gradle = gradle.replace(
        /(defaultConfig \{[\s\S]*?buildConfigField[^\n]+\n)/,
        `$1        // Enable verbose RFID logging in debug builds only
        buildConfigField "boolean", "ENABLE_VERBOSE_RFID_LOGS", "false"
`
      );

      // Add BuildConfig override to debug buildType
      gradle = gradle.replace(
        /(buildTypes \{[\s\S]*?debug \{[\s\S]*?signingConfig[^\n]+\n)/,
        `$1            // Enable verbose RFID logging in debug builds
            buildConfigField "boolean", "ENABLE_VERBOSE_RFID_LOGS", "true"
`
      );
    }

    // Add jniLibs configuration
    if (!gradle.includes('jniLibs.srcDirs')) {
      gradle = gradle.replace(
        /(buildTypes \{[\s\S]*?\n    \})/,
        `$1
    // Configure native library paths for UHF RFID scanner
    sourceSets {
        main {
            jniLibs.srcDirs = ['src/main/jniLibs']
        }
    }
`
      );
    }

    modResults.contents = gradle;
    return config;
  });

  // 2. Modify MainActivity
  config = withMainActivity(config, (config) => {
    const { modResults } = config;
    let mainActivity = modResults.contents;

    // Add imports
    if (!mainActivity.includes('com.herdtrackr.rfid.KeyEventModule')) {
      mainActivity = mainActivity.replace(
        /(import android\.os\.Bundle)/,
        `$1
import android.util.Log
import android.view.KeyEvent
import com.herdtrackr.rfid.KeyEventModule`
      );
    }

    // Add companion object with TAG
    if (!mainActivity.includes('companion object')) {
      mainActivity = mainActivity.replace(
        /(class MainActivity[^{]*\{)/,
        `$1
    companion object {
        private const val TAG = "🟡 MainActivity"
    }
`
      );
    }

    // Add getKeyEventModule method
    if (!mainActivity.includes('getKeyEventModule')) {
      mainActivity = mainActivity.replace(
        /(override fun createReactActivityDelegate[\s\S]*?\n    \})/,
        `$1

    /**
     * Get KeyEventModule from React Native context
     */
    private fun getKeyEventModule(): KeyEventModule? {
        return try {
            reactInstanceManager?.currentReactContext?.getNativeModule(KeyEventModule::class.java)
        } catch (e: Exception) {
            Log.w(TAG, "KeyEventModule not available yet", e)
            null
        }
    }

    /**
     * Handle hardware key down events (scan button)
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        Log.v(TAG, "⬇️  onKeyDown() - KeyCode: \$keyCode")

        when (keyCode) {
            137, // Chafon C6 scanner trigger button
            KeyEvent.KEYCODE_F5,
            KeyEvent.KEYCODE_F6,
            KeyEvent.KEYCODE_VOLUME_UP -> {
                Log.d(TAG, "🎯 SCANNER BUTTON PRESSED (KeyCode: \$keyCode)")

                getKeyEventModule()?.let {
                    Log.d(TAG, "📤 Forwarding to KeyEventModule...")
                    it.sendKeyDownEvent()
                    return true
                } ?: run {
                    Log.w(TAG, "⚠️  KeyEventModule not available yet")
                }
            }
        }

        return super.onKeyDown(keyCode, event)
    }

    /**
     * Handle hardware key up events (scan button release)
     */
    override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        Log.v(TAG, "⬆️  onKeyUp() - KeyCode: \$keyCode")

        when (keyCode) {
            137,
            KeyEvent.KEYCODE_F5,
            KeyEvent.KEYCODE_F6,
            KeyEvent.KEYCODE_VOLUME_UP -> {
                Log.d(TAG, "🎯 SCANNER BUTTON RELEASED (KeyCode: \$keyCode)")

                getKeyEventModule()?.let {
                    Log.d(TAG, "📤 Forwarding to KeyEventModule...")
                    it.sendKeyUpEvent()
                    return true
                } ?: run {
                    Log.w(TAG, "⚠️  KeyEventModule not available yet")
                }
            }
        }

        return super.onKeyUp(keyCode, event)
    }
`
      );
    }

    modResults.contents = mainActivity;
    return config;
  });

  // 3. Modify MainApplication
  config = withMainApplication(config, (config) => {
    const { modResults } = config;
    let mainApp = modResults.contents;

    // Add imports
    if (!mainApp.includes('com.herdtrackr.rfid.UHFPackage')) {
      mainApp = mainApp.replace(
        /(import android\.content\.res\.Configuration)/,
        `$1
import android.util.Log
import com.herdtrackr.rfid.KeyPackage
import com.herdtrackr.rfid.UHFPackage`
      );
    }

    // Add companion object
    if (!mainApp.includes('companion object')) {
      mainApp = mainApp.replace(
        /(class MainApplication[^{]*\{)/,
        `$1
    companion object {
        private const val TAG = "🟡 MainApplication"
    }
`
      );
    }

    // Add RFID packages registration
    if (!mainApp.includes('add(UHFPackage())')) {
      mainApp = mainApp.replace(
        /(override fun getPackages\(\): List<ReactPackage> =[\s\S]*?PackageList\(this\)\.packages\.apply \{)/,
        `$1
                    Log.d(TAG, "")
                    Log.d(TAG, "══════════════════════════════════════════════════")
                    Log.d(TAG, "📦 REGISTERING CUSTOM NATIVE MODULES")
                    Log.d(TAG, "══════════════════════════════════════════════════")
                    Log.d(TAG, "")

                    // Add RFID scanner packages
                    add(UHFPackage())
                    add(KeyPackage())

                    Log.d(TAG, "✅ Registered UHFPackage")
                    Log.d(TAG, "✅ Registered KeyPackage")
                    Log.d(TAG, "")`
      );
    }

    modResults.contents = mainApp;
    return config;
  });

  // 4. Copy RFID Java source files
  config = withCopyRfidSources(config);

  return config;
}

/**
 * Copy RFID Java source files to the correct location
 */
function withCopyRfidSources(config) {
  return require('@expo/config-plugins').withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidRoot = path.join(projectRoot, 'android');
      const rfidSourceDir = path.join(androidRoot, 'app', 'src', 'main', 'java', 'com', 'herdtrackr', 'rfid');

      // Create rfid directory
      if (!fs.existsSync(rfidSourceDir)) {
        fs.mkdirSync(rfidSourceDir, { recursive: true });
      }

      // Define all RFID Java files
      const rfidFiles = {
        'RfidException.java': getRfidExceptionSource(),
        'RfidInitializationException.java': getRfidInitExceptionSource(),
        'RfidOperationException.java': getRfidOpExceptionSource(),
        'RfidManager.java': getRfidManagerSource(),
        'ScanningService.java': getScanningServiceSource(),
        'CallbackHandler.java': getCallbackHandlerSource(),
        'UHFModule.java': getUHFModuleSource(),
        'UHFPackage.java': getUHFPackageSource(),
        'KeyEventModule.java': getKeyEventModuleSource(),
        'KeyPackage.java': getKeyPackageSource(),
      };

      // Write all files
      for (const [filename, content] of Object.entries(rfidFiles)) {
        const filePath = path.join(rfidSourceDir, filename);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Created ${filename}`);
      }

      console.log(`\n✅ All RFID Java files copied to ${rfidSourceDir}\n`);

      return config;
    },
  ]);
}

// Source code generators for each Java file
function getRfidExceptionSource() {
  return `package com.herdtrackr.rfid;

/**
 * Base exception class for RFID operations
 */
public class RfidException extends Exception {
    public RfidException(String message) {
        super(message);
    }

    public RfidException(String message, Throwable cause) {
        super(message, cause);
    }
}
`;
}

function getRfidInitExceptionSource() {
  return `package com.herdtrackr.rfid;

/**
 * Exception thrown when RFID hardware initialization fails
 */
public class RfidInitializationException extends RfidException {
    public RfidInitializationException(String message) {
        super(message);
    }

    public RfidInitializationException(String message, Throwable cause) {
        super(message, cause);
    }
}
`;
}

function getRfidOpExceptionSource() {
  return `package com.herdtrackr.rfid;

/**
 * Exception thrown when RFID operations fail during runtime
 */
public class RfidOperationException extends RfidException {
    public RfidOperationException(String message) {
        super(message);
    }

    public RfidOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
`;
}

function getRfidManagerSource() {
  // This would be very long - I'll create a separate file for each
  return fs.readFileSync(path.join(__dirname, '..', 'android-templates', 'RfidManager.java'), 'utf8');
}

function getScanningServiceSource() {
  return fs.readFileSync(path.join(__dirname, '..', 'android-templates', 'ScanningService.java'), 'utf8');
}

function getCallbackHandlerSource() {
  return fs.readFileSync(path.join(__dirname, '..', 'android-templates', 'CallbackHandler.java'), 'utf8');
}

function getUHFModuleSource() {
  return fs.readFileSync(path.join(__dirname, '..', 'android-templates', 'UHFModule.java'), 'utf8');
}

function getUHFPackageSource() {
  return fs.readFileSync(path.join(__dirname, '..', 'android-templates', 'UHFPackage.java'), 'utf8');
}

function getKeyEventModuleSource() {
  return fs.readFileSync(path.join(__dirname, '..', 'android-templates', 'KeyEventModule.java'), 'utf8');
}

function getKeyPackageSource() {
  return fs.readFileSync(path.join(__dirname, '..', 'android-templates', 'KeyPackage.java'), 'utf8');
}

module.exports = withRfidScanner;
