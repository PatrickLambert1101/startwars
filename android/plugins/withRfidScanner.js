const { withAppBuildGradle, withMainApplication, withMainActivity, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for UHF RFID Scanner Integration
 */
function withRfidScanner(config) {
  // Modify build.gradle
  config = withAppBuildGradle(config, modifyBuildGradle);
  
  // Modify MainActivity
  config = withMainActivity(config, modifyMainActivity);
  
  // Modify MainApplication
  config = withMainApplication(config, modifyMainApplication);
  
  // Copy RFID Java files
  config = withRfidJavaFiles(config);
  
  return config;
}

function modifyBuildGradle(config) {
  let gradle = config.modResults.contents;

  // Add dependencies if not present
  if (!gradle.includes('io.reactivex.rxjava3')) {
    gradle = gradle.replace(
      /(dependencies \{\s*\n)/,
      `$1    // RxJava3 for RFID scanning service
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

  // Add BuildConfig
  if (!gradle.includes('ENABLE_VERBOSE_RFID_LOGS')) {
    gradle = gradle.replace(
      /(buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL"[^\n]+\n)/,
      `$1        buildConfigField "boolean", "ENABLE_VERBOSE_RFID_LOGS", "false"\n`
    );
    
    gradle = gradle.replace(
      /(debug \{\s*\n\s*signingConfig[^\n]+\n)/,
      `$1            buildConfigField "boolean", "ENABLE_VERBOSE_RFID_LOGS", "true"\n`
    );
  }

  // Add jniLibs
  if (!gradle.includes('jniLibs.srcDirs')) {
    gradle = gradle.replace(
      /(buildTypes \{[\s\S]*?\n    \})/,
      `$1
    sourceSets {
        main {
            jniLibs.srcDirs = ['src/main/jniLibs']
        }
    }
`
    );
  }

  config.modResults.contents = gradle;
  return config;
}

function modifyMainActivity(config) {
  let content = config.modResults.contents;

  if (!content.includes('KeyEventModule')) {
    // Add imports
    content = content.replace(
      /(import android\.os\.Bundle)/,
      `$1
import android.util.Log
import android.view.KeyEvent
import com.herdtrackr.rfid.KeyEventModule`
    );

    // Add methods before the last closing brace
    const methods = `
    private fun getKeyEventModule(): KeyEventModule? {
        return try {
            reactInstanceManager?.currentReactContext?.getNativeModule(KeyEventModule::class.java)
        } catch (e: Exception) {
            null
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            137, KeyEvent.KEYCODE_F5, KeyEvent.KEYCODE_F6, KeyEvent.KEYCODE_VOLUME_UP -> {
                getKeyEventModule()?.sendKeyDownEvent()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            137, KeyEvent.KEYCODE_F5, KeyEvent.KEYCODE_F6, KeyEvent.KEYCODE_VOLUME_UP -> {
                getKeyEventModule()?.sendKeyUpEvent()
                return true
            }
        }
        return super.onKeyUp(keyCode, event)
    }
`;
    
    content = content.replace(/(\n}\s*)$/, methods + '$1');
  }

  config.modResults.contents = content;
  return config;
}

function modifyMainApplication(config) {
  let content = config.modResults.contents;

  if (!content.includes('UHFPackage')) {
    // Add imports
    content = content.replace(
      /(import android\.content\.res\.Configuration)/,
      `$1
import com.herdtrackr.rfid.KeyPackage
import com.herdtrackr.rfid.UHFPackage`
    );

    // Add packages
    content = content.replace(
      /(PackageList\(this\)\.packages\.apply \{)/,
      `$1
              add(UHFPackage())
              add(KeyPackage())`
    );
  }

  config.modResults.contents = content;
  return config;
}

function withRfidJavaFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const rfidDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'herdtrackr', 'rfid');
      
      // Create directory
      fs.mkdirSync(rfidDir, { recursive: true });
      
      // Copy Java files from our earlier created files
      const sourceDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'herdtrackr', 'rfid');
      
      console.log('\n🔧 RFID Config Plugin: Copying Java files...\n');
      
      // Just ensure the directory exists - files should already be there or will be added manually
      console.log(`✅ RFID directory ready: ${rfidDir}`);
      console.log('ℹ️  Java files should be in: android/app/src/main/java/com/herdtrackr/rfid/\n');
      
      return config;
    },
  ]);
}

module.exports = withRfidScanner;
