package com.example.mywebview.urb.commands.shared

import android.graphics.Bitmap
import android.graphics.ImageDecoder
import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbStringProvider
import java.io.File
import java.util.Locale
import java.util.UUID
import kotlin.math.roundToInt

class ImageCompressor(
    private val strings: UrbStringProvider,
) {
    fun compress(
        source: File,
        outputDirectory: File,
        fileName: String,
        options: ImageCompressionOptions,
    ): ProcessedImageFile {
        val outputFileName = jpegFileName(fileName)
        val outputFile = File(
            outputDirectory,
            "compressed-${System.currentTimeMillis()}-${UUID.randomUUID()}-$outputFileName",
        )

        val sourceImage = ImageDecoder.createSource(source)
        val bitmap = ImageDecoder.decodeBitmap(sourceImage) { decoder, info, _ ->
            val targetSize = targetSize(
                width = info.size.width,
                height = info.size.height,
                maxWidth = options.maxWidth,
                maxHeight = options.maxHeight,
            )
            decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
            decoder.isMutableRequired = false
            decoder.setTargetSize(targetSize.width, targetSize.height)
        }

        outputFile.outputStream().use { output ->
            if (!bitmap.compress(Bitmap.CompressFormat.JPEG, options.quality, output)) {
                outputFile.delete()
                throw IllegalStateException(strings.get(R.string.urb_image_compress_failed))
            }
        }

        return ProcessedImageFile(
            file = outputFile,
            fileName = outputFileName,
            mimeType = JPEG_MIME_TYPE,
        )
    }

    private fun targetSize(
        width: Int,
        height: Int,
        maxWidth: Int,
        maxHeight: Int,
    ): ImageSize {
        if (width <= 0 || height <= 0) {
            return ImageSize(1, 1)
        }

        val scale = minOf(
            maxWidth.toFloat() / width.toFloat(),
            maxHeight.toFloat() / height.toFloat(),
            1f,
        )

        return ImageSize(
            width = (width * scale).roundToInt().coerceAtLeast(1),
            height = (height * scale).roundToInt().coerceAtLeast(1),
        )
    }

    private fun jpegFileName(fileName: String): String {
        val baseName = fileName
            .substringBeforeLast('.', fileName)
            .ifBlank { "urb-image" }
            .lowercase(Locale.US)

        return "$baseName.jpg"
    }

    private data class ImageSize(
        val width: Int,
        val height: Int,
    )

    private companion object {
        const val JPEG_MIME_TYPE = "image/jpeg"
    }
}
