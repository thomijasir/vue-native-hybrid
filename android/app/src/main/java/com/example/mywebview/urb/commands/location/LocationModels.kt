package com.example.mywebview.urb.commands.location

import android.location.Location
import java.time.Instant
import java.time.format.DateTimeFormatter
import org.json.JSONObject

enum class LocationAccuracy {
    FINE,
    COARSE,
}

data class UrbNativeLocation(
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Float?,
    val provider: String,
    val timeMillis: Long,
) {
    fun toJson(): JSONObject {
        return JSONObject()
            .put("latitude", latitude)
            .put("longitude", longitude)
            .put("provider", provider.ifBlank { "unknown" })
            .put("capturedAt", DateTimeFormatter.ISO_INSTANT.format(Instant.ofEpochMilli(timeMillis)))
            .apply {
                accuracyMeters?.let { put("accuracyMeters", it.toDouble()) }
            }
    }

    fun toPickedCoordinates(): PickedCoordinates {
        return PickedCoordinates(latitude, longitude, accuracyMeters)
    }
}

data class PickedCoordinates(
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Float?,
)

fun Location.toNativeLocation(): UrbNativeLocation {
    return UrbNativeLocation(
        latitude = latitude,
        longitude = longitude,
        accuracyMeters = if (hasAccuracy()) accuracy else null,
        provider = provider ?: "unknown",
        timeMillis = time.takeIf { it > 0L } ?: System.currentTimeMillis(),
    )
}
