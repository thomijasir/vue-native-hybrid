package com.example.mywebview.urb.commands.location

import com.example.mywebview.urb.core.UrbRequest

data class LocationRequestOptions(
    val accuracy: LocationAccuracy,
    val timeoutMs: Long,
) {
    companion object {
        fun from(request: UrbRequest): LocationRequestOptions {
            val payload = request.payload
            val accuracy = when (payload?.optString("accuracy", "fine")) {
                "coarse" -> LocationAccuracy.COARSE
                else -> LocationAccuracy.FINE
            }
            val timeoutMs = payload
                ?.optLong("timeoutMs", DEFAULT_TIMEOUT_MS)
                ?.coerceIn(MIN_TIMEOUT_MS, MAX_TIMEOUT_MS)
                ?: DEFAULT_TIMEOUT_MS

            return LocationRequestOptions(
                accuracy = accuracy,
                timeoutMs = timeoutMs,
            )
        }

        private const val DEFAULT_TIMEOUT_MS = 10_000L
        private const val MIN_TIMEOUT_MS = 1_000L
        private const val MAX_TIMEOUT_MS = 30_000L
    }
}
