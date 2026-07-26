package com.example.mywebview.urb.commands.intent

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultLauncher
import androidx.appcompat.app.AppCompatActivity
import androidx.core.net.toUri
import com.example.mywebview.app.location.MapLocationPickerActivity
import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider
import org.json.JSONObject

class IntentOpenCommand(
    private val activity: AppCompatActivity,
    private val strings: UrbStringProvider,
) : UrbCommand {
    override val name = "intent:open"
    override val expectsResponse = false

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        val target = IntentTarget.from(request.payload)
            ?: throw IllegalArgumentException(strings.get(R.string.urb_intent_target_invalid))
        val intent = target.intentFor(activity, request.payload)

        activity.startActivity(intent)
    }
}

class IntentOpenForResultCommand(
    private val activity: AppCompatActivity,
    private val launcher: ActivityResultLauncher<Intent>,
    private val strings: UrbStringProvider,
) : UrbCommand {
    override val name = "intent:openForResult"
    override val expectsResponse = true

    private var pendingResponder: UrbResponder? = null

    @SuppressLint("QueryPermissionsNeeded")
    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder ?: return

        if (pendingResponder != null) {
            responder.error("INTENT_BUSY", strings.get(R.string.urb_intent_busy))
            return
        }

        val target = IntentTarget.from(request.payload)
        if (target == null) {
            responder.error("INTENT_INVALID_TARGET", strings.get(R.string.urb_intent_target_invalid))
            return
        }

        if (!target.supportsResult) {
            responder.error(
                "INTENT_TARGET_UNSUPPORTED_MODE",
                strings.get(R.string.urb_intent_unsupported_result_mode),
            )
            return
        }

        val intent = try {
            target.intentFor(activity, request.payload)
        } catch (error: IllegalArgumentException) {
            responder.error("INTENT_INVALID_PAYLOAD", error.message ?: strings.get(R.string.urb_intent_payload_invalid))
            return
        }

        if (intent.resolveActivity(activity.packageManager) == null) {
            responder.error("INTENT_ACTIVITY_NOT_FOUND", strings.get(R.string.urb_intent_activity_not_found))
            return
        }

        pendingResponder = responder

        try {
            launcher.launch(intent)
        } catch (error: ActivityNotFoundException) {
            pendingResponder = null
            responder.error("INTENT_ACTIVITY_NOT_FOUND", strings.get(R.string.urb_intent_activity_not_found))
        } catch (error: RuntimeException) {
            pendingResponder = null
            responder.error("INTENT_LAUNCH_FAILED", error.message ?: strings.get(R.string.urb_intent_launch_failed))
        }
    }

    fun onIntentResult(result: ActivityResult) {
        val responder = pendingResponder ?: return
        pendingResponder = null

        if (result.resultCode != Activity.RESULT_OK) {
            responder.error("INTENT_CANCELLED", strings.get(R.string.urb_intent_cancelled))
            return
        }

        responder.success(
            JSONObject()
                .put("resultCode", "ok")
                .put("extras", jsonExtras(result.data?.extras)),
        )
    }
}

private enum class IntentTarget(
    val targetName: String,
    val supportsResult: Boolean,
) {
    APP_SETTINGS("appSettings", false) {
        override fun intentFor(context: Context, payload: JSONObject?): Intent {
            return Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                "package:${context.packageName}".toUri(),
            )
        }
    },
    MAP_LOCATION_PICKER("mapLocationPicker", true) {
        override fun intentFor(context: Context, payload: JSONObject?): Intent {
            val extras = payload?.optJSONObject("extras")
            val latitude = extras?.optDouble("latitude", 0.0) ?: 0.0
            val longitude = extras?.optDouble("longitude", 0.0) ?: 0.0
            val accuracyMeters = extras
                ?.takeIf { it.has("accuracyMeters") }
                ?.optDouble("accuracyMeters", Double.NaN)
                ?.takeIf { it.isFinite() }
                ?.toFloat()

            return MapLocationPickerActivity.intent(
                context = context,
                latitude = latitude,
                longitude = longitude,
                accuracyMeters = accuracyMeters,
            )
        }
    };

    abstract fun intentFor(context: Context, payload: JSONObject?): Intent

    companion object {
        fun from(payload: JSONObject?): IntentTarget? {
            val target = payload?.optString("target")?.trim().orEmpty()
            return entries.firstOrNull { it.targetName == target }
        }
    }
}

private fun jsonExtras(bundle: Bundle?): JSONObject {
    val json = JSONObject()
    if (bundle == null) return json

    for (key in bundle.keySet()) {
        when (val value = bundle.valueFor(key)) {
            null -> json.put(key, JSONObject.NULL)
            is String -> json.put(key, value)
            is Int -> json.put(key, value)
            is Long -> json.put(key, value)
            is Float -> json.put(key, value.toDouble())
            is Double -> json.put(key, value)
            is Boolean -> json.put(key, value)
        }
    }

    return json
}

private fun Bundle.valueFor(key: String): Any? {
    @Suppress("DEPRECATION")
    return get(key)
}
