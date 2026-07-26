package com.example.mywebview.urb.commands.shared

import org.json.JSONObject

data class ImageCompressionOptions(
    val enabled: Boolean = true,
    val quality: Int = DEFAULT_QUALITY,
    val maxWidth: Int = DEFAULT_MAX_DIMENSION,
    val maxHeight: Int = DEFAULT_MAX_DIMENSION,
) {
    companion object {
        const val DEFAULT_QUALITY = 82
        const val DEFAULT_MAX_DIMENSION = 1920
        private const val MAX_DIMENSION_LIMIT = 8192

        fun fromPayload(payload: JSONObject?): ImageCompressionOptions {
            val compression = payload?.opt("compression") ?: return ImageCompressionOptions()

            if (compression is Boolean) {
                return if (compression) ImageCompressionOptions() else ImageCompressionOptions(enabled = false)
            }

            if (compression !is JSONObject) {
                return ImageCompressionOptions()
            }

            return ImageCompressionOptions(
                enabled = true,
                quality = compression.optPositiveInt("quality", DEFAULT_QUALITY).coerceIn(1, 100),
                maxWidth = compression.optPositiveInt("maxWidth", DEFAULT_MAX_DIMENSION)
                    .coerceAtMost(MAX_DIMENSION_LIMIT),
                maxHeight = compression.optPositiveInt("maxHeight", DEFAULT_MAX_DIMENSION)
                    .coerceAtMost(MAX_DIMENSION_LIMIT),
            )
        }

        private fun JSONObject.optPositiveInt(name: String, defaultValue: Int): Int {
            val value = optInt(name, defaultValue)
            return if (value > 0) value else defaultValue
        }
    }
}
