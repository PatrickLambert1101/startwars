package com.herdtrackr

import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.herdtrackr.rfid.KeyEventModule

import expo.modules.ReactActivityDelegateWrapper
import expo.modules.splashscreen.SplashScreenManager

class MainActivity : ReactActivity() {
    companion object {
        private const val TAG = "🟡 MainActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        SplashScreenManager.registerOnActivity(this)
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
        super.onCreate(null)
        Log.d(TAG, "🏗️  MainActivity created")
    }

    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            object : DefaultReactActivityDelegate(
                this,
                mainComponentName,
                fabricEnabled
            ) {}
        )
    }

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
        Log.v(TAG, "⬇️  onKeyDown() - KeyCode: $keyCode")

        when (keyCode) {
            137, // Chafon C6 scanner trigger button
            KeyEvent.KEYCODE_F5,
            KeyEvent.KEYCODE_F6,
            KeyEvent.KEYCODE_VOLUME_UP -> {
                Log.d(TAG, "🎯 SCANNER BUTTON PRESSED (KeyCode: $keyCode)")

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
        Log.v(TAG, "⬆️  onKeyUp() - KeyCode: $keyCode")

        when (keyCode) {
            137,
            KeyEvent.KEYCODE_F5,
            KeyEvent.KEYCODE_F6,
            KeyEvent.KEYCODE_VOLUME_UP -> {
                Log.d(TAG, "🎯 SCANNER BUTTON RELEASED (KeyCode: $keyCode)")

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

    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                super.invokeDefaultOnBackPressed()
            }
            return
        }
        super.invokeDefaultOnBackPressed()
    }
}
