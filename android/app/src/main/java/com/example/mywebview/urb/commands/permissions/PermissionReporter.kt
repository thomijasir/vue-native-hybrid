package com.example.mywebview.urb.commands.permissions

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.mywebview.urb.core.UrbRequest
import org.json.JSONArray
import org.json.JSONObject

class PermissionReporter(
    private val activity: AppCompatActivity,
) {
    fun parseNames(request: UrbRequest, allowMissingNames: Boolean): List<String>? {
        val payload = request.payload ?: return if (allowMissingNames) allNames() else null
        if (!payload.has("names")) return if (allowMissingNames) allNames() else null

        val namesJson = payload.optJSONArray("names") ?: return null
        val names = mutableListOf<String>()

        for (index in 0 until namesJson.length()) {
            val name = namesJson.optString(index).trim()
            if (!catalog.containsKey(name)) return null
            if (!names.contains(name)) names.add(name)
        }

        return names
    }

    fun statesFor(names: List<String>): JSONArray {
        val result = JSONArray()
        names.forEach { name ->
            result.put(stateFor(name))
        }
        return result
    }

    fun requestableAndroidPermissions(names: List<String>): List<String> {
        val permissions = mutableListOf<String>()

        names.forEach { name ->
            val spec = catalog[name] ?: return@forEach
            spec.permissionsForSdk().forEach { permission ->
                if (
                    isPermissionDeclared(permission) &&
                    ContextCompat.checkSelfPermission(activity, permission) !=
                    PackageManager.PERMISSION_GRANTED &&
                    !permissions.contains(permission)
                ) {
                    permissions.add(permission)
                }
            }
        }

        return permissions
    }

    private fun stateFor(name: String): JSONObject {
        val spec = catalog.getValue(name)
        val permissions = spec.permissionsForSdk()
        val declaredPermissions = permissions.filter(::isPermissionDeclared)
        val status = when {
            permissions.isEmpty() -> "notRequired"
            declaredPermissions.size != permissions.size -> "notDeclared"
            spec.isGranted(activity, permissions) -> "granted"
            else -> "denied"
        }

        return JSONObject()
            .put("name", name)
            .put("status", status)
            .put("granted", status == "granted" || status == "notRequired")
            .put("shouldShowRationale", shouldShowRationale(declaredPermissions))
            .put("androidPermissions", JSONArray(permissions))
    }

    private fun shouldShowRationale(permissions: List<String>): Boolean {
        return permissions.any { permission ->
            ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
        }
    }

    private fun isPermissionDeclared(permission: String): Boolean {
        val requestedPermissions = activity.packageManager
            .getPackageInfo(activity.packageName, PackageManager.GET_PERMISSIONS)
            .requestedPermissions

        return requestedPermissions?.contains(permission) == true
    }

    private fun allNames(): List<String> = catalog.keys.toList()

    private val catalog = linkedMapOf(
        "camera" to PermissionSpec(permissionsForSdk = {
            listOf(Manifest.permission.CAMERA)
        }),
        "microphone" to PermissionSpec(permissionsForSdk = {
            listOf(Manifest.permission.RECORD_AUDIO)
        }),
        "contacts" to PermissionSpec(permissionsForSdk = {
            listOf(Manifest.permission.READ_CONTACTS)
        }),
        "phone" to PermissionSpec(permissionsForSdk = {
            listOf(Manifest.permission.READ_PHONE_STATE)
        }),
        "location:coarse" to PermissionSpec(permissionsForSdk = {
            listOf(Manifest.permission.ACCESS_COARSE_LOCATION)
        }),
        "location:fine" to PermissionSpec(
            permissionsForSdk = {
                listOf(
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                    Manifest.permission.ACCESS_FINE_LOCATION,
                )
            },
            isGranted = { activity, _ ->
                ContextCompat.checkSelfPermission(
                    activity,
                    Manifest.permission.ACCESS_FINE_LOCATION,
                ) == PackageManager.PERMISSION_GRANTED
            },
        ),
        "notifications" to PermissionSpec(permissionsForSdk = {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                listOf(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                emptyList()
            }
        }),
        "photos" to PermissionSpec(permissionsForSdk = {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                listOf(
                    Manifest.permission.READ_MEDIA_IMAGES,
                    Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED,
                )
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                listOf(Manifest.permission.READ_MEDIA_IMAGES)
            } else {
                listOf(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }),
        "nearby:bluetooth" to PermissionSpec(permissionsForSdk = {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                listOf(
                    Manifest.permission.BLUETOOTH_SCAN,
                    Manifest.permission.BLUETOOTH_CONNECT,
                )
            } else {
                emptyList()
            }
        }),
        "nearby:wifi" to PermissionSpec(permissionsForSdk = {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                listOf(Manifest.permission.NEARBY_WIFI_DEVICES)
            } else {
                listOf(Manifest.permission.ACCESS_FINE_LOCATION)
            }
        }),
    )
}

private class PermissionSpec(
    val permissionsForSdk: () -> List<String>,
    val isGranted: (AppCompatActivity, List<String>) -> Boolean = { activity, permissions ->
        permissions.all { permission ->
            ContextCompat.checkSelfPermission(activity, permission) ==
                PackageManager.PERMISSION_GRANTED
        }
    },
)
