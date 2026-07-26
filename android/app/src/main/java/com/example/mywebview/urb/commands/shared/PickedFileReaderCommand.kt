package com.example.mywebview.urb.commands.shared

import android.database.Cursor
import android.net.Uri
import android.provider.OpenableColumns
import android.webkit.MimeTypeMap
import androidx.appcompat.app.AppCompatActivity
import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbConstants
import com.example.mywebview.urb.resources.UrbResourceStore
import com.example.mywebview.urb.core.UrbStringProvider
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.time.Instant
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID

class PickedFileReaderCommand(
    private val activity: AppCompatActivity,
    private val resourceStore: UrbResourceStore,
    private val strings: UrbStringProvider,
) {
    private val imageCompressor = ImageCompressor(strings)

    fun registerUris(
        uris: List<Uri>,
        cacheFolderName: String,
        compressionOptions: ImageCompressionOptions = ImageCompressionOptions(enabled = false),
    ): JSONArray {
        val items = JSONArray()
        val createdAt = DateTimeFormatter.ISO_INSTANT.format(Instant.now())

        uris.forEachIndexed { index, uri ->
            val metadata = metadataFor(uri)
            val fileName = metadata.fileName.ifBlank {
                "urb-file-${System.currentTimeMillis()}-${index + 1}"
            }
            val mimeType = metadata.mimeType.ifBlank { DEFAULT_MIME_TYPE }
            require(metadata.size <= 0L || metadata.size <= MAX_FILE_BYTES) {
                "Selected file is too large"
            }
            val file = copyToCache(
                uri = uri,
                cacheFolderName = cacheFolderName,
                fileName = fileName,
                index = index,
            )
            val processedFile = processFile(
                file = file,
                fileName = fileName,
                mimeType = mimeType,
                compressionOptions = compressionOptions,
            )
            val token = resourceStore.register(
                UrbResourceStore.Resource(
                    file = processedFile.file,
                    fileName = processedFile.fileName,
                    mimeType = processedFile.mimeType,
                    createdAt = createdAt,
                    expiresAtMillis = System.currentTimeMillis() + RESOURCE_TTL_MILLIS,
                ),
            )

            items.put(
                JSONObject()
                    .put("resourceUrl", "${UrbConstants.APP_ASSET_ORIGIN}${UrbConstants.RESOURCE_PATH_PREFIX}$token")
                    .put("fileName", processedFile.fileName)
                    .put("mimeType", processedFile.mimeType)
                    .put("size", processedFile.file.length())
                    .put("createdAt", createdAt),
            )
        }

        return items
    }

    private fun copyToCache(
        uri: Uri,
        cacheFolderName: String,
        fileName: String,
        index: Int,
    ): File {
        val directory = File(activity.cacheDir, cacheFolderName).apply {
            mkdirs()
        }
        val file = File(
            directory,
            "${System.currentTimeMillis()}-${index + 1}-${UUID.randomUUID()}-${sanitizeFileName(fileName)}",
        )

        activity.contentResolver.openInputStream(uri)?.use { input ->
            file.outputStream().use { output ->
                val buffer = ByteArray(COPY_BUFFER_BYTES)
                var totalBytes = 0L
                while (true) {
                    val read = input.read(buffer)
                    if (read == -1) break
                    totalBytes += read
                    require(totalBytes <= MAX_FILE_BYTES) {
                        "Selected file is too large"
                    }
                    output.write(buffer, 0, read)
                }
            }
        } ?: throw IllegalStateException(strings.get(R.string.urb_selected_file_open_failed))

        return file
    }

    private fun processFile(
        file: File,
        fileName: String,
        mimeType: String,
        compressionOptions: ImageCompressionOptions,
    ): ProcessedImageFile {
        if (!compressionOptions.enabled || !mimeType.startsWith("image/")) {
            return ProcessedImageFile(
                file = file,
                fileName = fileName,
                mimeType = mimeType,
            )
        }

        val compressed = imageCompressor.compress(
            source = file,
            outputDirectory = file.parentFile ?: activity.cacheDir,
            fileName = fileName,
            options = compressionOptions,
        )
        file.delete()
        return compressed
    }

    private fun metadataFor(uri: Uri): PickedFileMetadata {
        val resolver = activity.contentResolver
        var fileName = ""
        var size = -1L

        resolver.query(uri, null, null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                fileName = cursor.stringValue(OpenableColumns.DISPLAY_NAME).orEmpty()
                size = cursor.longValue(OpenableColumns.SIZE) ?: -1L
            }
        }

        val mimeType = resolver.getType(uri)
            ?: fileName.substringAfterLast('.', "")
                .takeIf { it.isNotBlank() }
                ?.lowercase(Locale.US)
                ?.let { extension ->
                    MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
                }
            ?: DEFAULT_MIME_TYPE

        return PickedFileMetadata(
            fileName = sanitizeFileName(fileName),
            mimeType = mimeType,
            size = size,
        )
    }

    private fun Cursor.stringValue(columnName: String): String? {
        val index = getColumnIndex(columnName)
        return if (index >= 0 && !isNull(index)) getString(index) else null
    }

    private fun Cursor.longValue(columnName: String): Long? {
        val index = getColumnIndex(columnName)
        return if (index >= 0 && !isNull(index)) getLong(index) else null
    }

    private fun sanitizeFileName(fileName: String): String {
        val cleaned = fileName
            .trim()
            .replace(Regex("[^A-Za-z0-9._-]+"), "-")
            .trim('-', '.', '_')

        return cleaned.ifBlank { "urb-file" }
    }

    private data class PickedFileMetadata(
        val fileName: String,
        val mimeType: String,
        val size: Long,
    )

    private companion object {
        const val DEFAULT_MIME_TYPE = "application/octet-stream"
        const val RESOURCE_TTL_MILLIS = 60_000L
        const val MAX_FILE_BYTES = 20L * 1024L * 1024L
        const val COPY_BUFFER_BYTES = 8 * 1024
    }
}
