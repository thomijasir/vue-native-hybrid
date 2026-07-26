package com.example.mywebview.urb.commands.device

import android.content.Context
import android.content.pm.PackageInfo
import android.os.Build
import com.example.mywebview.BuildConfig
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import java.util.Locale
import java.util.TimeZone
import org.json.JSONObject

class DeviceInfoCommand(
    private val context: Context,
) : UrbCommand {
    override val name = "device:info"
    override val expectsResponse = true

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)

        responder?.success(
            JSONObject()
                .put("platform", "android")
                .put("osName", "Android")
                .put("osVersion", Build.VERSION.RELEASE.orEmpty())
                .put("sdkInt", Build.VERSION.SDK_INT)
                .put("manufacturer", Build.MANUFACTURER.orEmpty())
                .put("model", Build.MODEL.orEmpty())
                .put("brand", Build.BRAND.orEmpty())
                .put("device", Build.DEVICE.orEmpty())
                .put("appId", BuildConfig.APPLICATION_ID)
                .put("appVersionName", packageInfo.versionName.orEmpty())
                .put("appVersionCode", packageInfo.versionCodeCompat())
                .put("buildType", if (BuildConfig.DEBUG) "debug" else "release")
                .put("locale", Locale.getDefault().toLanguageTag())
                .put("timeZone", TimeZone.getDefault().id),
        )
    }

    @Suppress("DEPRECATION")
    private fun PackageInfo.versionCodeCompat(): Long {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            longVersionCode
        } else {
            versionCode.toLong()
        }
    }
}
