package com.example.mywebview.urb.commands.location

import android.content.Intent
import androidx.activity.result.ActivityResultLauncher
import androidx.appcompat.app.AppCompatActivity
import com.example.mywebview.R
import com.example.mywebview.app.location.MapLocationPickerActivity
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider
import java.time.Instant
import java.time.format.DateTimeFormatter
import org.json.JSONObject

class LocationPickCommand(
    private val activity: AppCompatActivity,
    private val launcher: ActivityResultLauncher<Intent>,
    private val locationReader: PlatformLocationReader,
    private val strings: UrbStringProvider,
) : UrbCommand {
    override val name = "location:pick"
    override val expectsResponse = true

    private var pendingPick: UrbResponder? = null

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder ?: return

        if (pendingPick != null) {
            responder.error("LOCATION_PICKER_BUSY", strings.get(R.string.urb_location_picker_busy))
            return
        }

        val options = LocationRequestOptions.from(request)
        if (!locationReader.hasPermission(options.accuracy)) {
            responder.error("LOCATION_PERMISSION_DENIED", strings.get(R.string.urb_location_permission_denied))
            return
        }

        pendingPick = responder

        val initialLocation = initialLocationFromPayload(request)
        if (initialLocation != null) {
            launchPicker(initialLocation)
            return
        }

        locationReader.currentLocation(options) { result ->
            launchPicker(
                result.getOrNull()?.toPickedCoordinates()
                    ?: PickedCoordinates(DEFAULT_LATITUDE, DEFAULT_LONGITUDE, null),
            )
        }
    }

    fun onPickerResult(resultCode: Int, data: Intent?) {
        val responder = pendingPick ?: return
        pendingPick = null

        if (resultCode != AppCompatActivity.RESULT_OK || data == null) {
            responder.error("LOCATION_PICKER_CANCELLED", strings.get(R.string.urb_location_picker_cancelled))
            return
        }

        val latitude = data.getDoubleExtra(MapLocationPickerActivity.EXTRA_LATITUDE, Double.NaN)
        val longitude = data.getDoubleExtra(MapLocationPickerActivity.EXTRA_LONGITUDE, Double.NaN)

        if (!latitude.isFinite() || !longitude.isFinite()) {
            responder.error("LOCATION_PICKER_INVALID_RESULT", strings.get(R.string.urb_location_picker_invalid_result))
            return
        }

        responder.success(
            JSONObject()
                .put("latitude", latitude)
                .put("longitude", longitude)
                .put("pickedAt", DateTimeFormatter.ISO_INSTANT.format(Instant.now())),
        )
    }

    private fun launchPicker(initialLocation: PickedCoordinates) {
        try {
            launcher.launch(
                MapLocationPickerActivity.intent(
                    context = activity,
                    latitude = initialLocation.latitude,
                    longitude = initialLocation.longitude,
                    accuracyMeters = initialLocation.accuracyMeters,
                ),
            )
        } catch (error: RuntimeException) {
            val responder = pendingPick ?: return
            pendingPick = null
            responder.error(
                "LOCATION_PICKER_FAILED",
                error.message ?: strings.get(R.string.urb_location_picker_open_failed),
            )
        }
    }

    private fun initialLocationFromPayload(request: UrbRequest): PickedCoordinates? {
        val initialLocation = request.payload?.optJSONObject("initialLocation") ?: return null
        val latitude = initialLocation.optDouble("latitude", Double.NaN)
        val longitude = initialLocation.optDouble("longitude", Double.NaN)
        val accuracyMeters = initialLocation.optDouble("accuracyMeters", Double.NaN)

        if (!latitude.isFinite() || !longitude.isFinite()) return null

        return PickedCoordinates(
            latitude = latitude,
            longitude = longitude,
            accuracyMeters = accuracyMeters.takeIf { it.isFinite() }?.toFloat(),
        )
    }

    private companion object {
        const val DEFAULT_LATITUDE = 0.0
        const val DEFAULT_LONGITUDE = 0.0
    }
}
