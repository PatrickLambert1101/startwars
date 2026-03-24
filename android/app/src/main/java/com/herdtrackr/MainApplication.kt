package com.herdtrackr

import android.app.Application
import android.content.res.Configuration
import android.util.Log

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost
import com.herdtrackr.rfid.KeyPackage
import com.herdtrackr.rfid.UHFPackage

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {
    companion object {
        private const val TAG = "🟡 MainApplication"
    }

    override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
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
                    Log.d(TAG, "")
                }

            override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        }
    )

    override val reactHost: ReactHost
        get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()

        Log.d(TAG, "🏁 MainApplication onCreate()")

        DefaultNewArchitectureEntryPoint.releaseLevel = try {
            ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
        } catch (e: IllegalArgumentException) {
            ReleaseLevel.STABLE
        }

        loadReactNative(this)
        ApplicationLifecycleDispatcher.onApplicationCreate(this)

        Log.d(TAG, "✅ MainApplication initialized")
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }
}
