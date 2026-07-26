package com.example.mywebview.urb.commands.camera

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.result.ActivityResultLauncher
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.example.mywebview.BuildConfig
import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbConstants
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.resources.UrbResourceStore
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider
import com.example.mywebview.urb.commands.shared.ImageCompressionOptions
import com.example.mywebview.urb.commands.shared.ImageCompressor
import com.example.mywebview.urb.commands.shared.ProcessedImageFile
import org.json.JSONObject
import java.io.File
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Locale

class CameraTakePictureCommand(
    private val activity: AppCompatActivity,
    private val launcher: ActivityResultLauncher<Uri>,
    private val resourceStore: UrbResourceStore,
    private val strings: UrbStringProvider,
) : UrbCommand {
    override val name = "camera:capture"
    override val expectsResponse = true

    private var pendingCapture: PendingCapture? = null
    private val imageCompressor = ImageCompressor(strings)

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        if (responder == null) return

        if (pendingCapture != null) {
            responder.error("CAMERA_BUSY", strings.get(R.string.urb_camera_busy))
            return
        }

        if (
            ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            responder.error(
                "CAMERA_PERMISSION_DENIED",
                strings.get(R.string.urb_camera_permission_denied),
            )
            return
        }

        val createdAt = Instant.now()
        val compressionOptions = ImageCompressionOptions.fromPayload(request.payload)
        val fileName = createFileName(createdAt)
        val file = File(cameraDirectory(), fileName)
        val uri = FileProvider.getUriForFile(
            activity,
            "${BuildConfig.APPLICATION_ID}.fileprovider",
            file,
        )

        pendingCapture = PendingCapture(
            file = file,
            fileName = fileName,
            mimeType = MIME_TYPE,
            createdAt = DateTimeFormatter.ISO_INSTANT.format(createdAt),
            compressionOptions = compressionOptions,
            responder = responder,
        )

        try {
            launcher.launch(uri)
        } catch (error: RuntimeException) {
            pendingCapture = null
            file.delete()
            responder.error("CAMERA_FAILED", error.message ?: strings.get(R.string.urb_camera_open_failed))
        }
    }

    fun onCameraResult(success: Boolean) {
        val capture = pendingCapture ?: return
        pendingCapture = null

        if (!success || !capture.file.exists()) {
            capture.file.delete()
            capture.responder.error("CAMERA_CANCELLED", strings.get(R.string.urb_camera_cancelled))
            return
        }

        val processedFile = try {
            processCapture(capture)
        } catch (error: RuntimeException) {
            capture.file.delete()
            capture.responder.error(
                "CAMERA_UNREADABLE_IMAGE",
                error.message ?: strings.get(R.string.urb_camera_process_failed),
            )
            return
        }

        val token = resourceStore.register(
            UrbResourceStore.Resource(
                file = processedFile.file,
                fileName = processedFile.fileName,
                mimeType = processedFile.mimeType,
                createdAt = capture.createdAt,
                expiresAtMillis = System.currentTimeMillis() + RESOURCE_TTL_MILLIS,
            ),
        )

        capture.responder.success(
            JSONObject()
                .put("resourceUrl", "${UrbConstants.APP_ASSET_ORIGIN}${UrbConstants.RESOURCE_PATH_PREFIX}$token")
                .put("fileName", processedFile.fileName)
                .put("mimeType", processedFile.mimeType)
                .put("size", processedFile.file.length())
                .put("createdAt", capture.createdAt),
        )
    }

    private fun processCapture(capture: PendingCapture): ProcessedImageFile {
        if (!capture.compressionOptions.enabled) {
            require(capture.file.length() <= MAX_FILE_BYTES) {
                strings.get(R.string.urb_camera_process_failed)
            }
            return ProcessedImageFile(
                file = capture.file,
                fileName = capture.fileName,
                mimeType = capture.mimeType,
            )
        }

        val compressed = imageCompressor.compress(
            source = capture.file,
            outputDirectory = capture.file.parentFile ?: cameraDirectory(),
            fileName = capture.fileName,
            options = capture.compressionOptions,
        )
        capture.file.delete()
        require(compressed.file.length() <= MAX_FILE_BYTES) {
            strings.get(R.string.urb_camera_process_failed)
        }
        return compressed
    }

    private fun cameraDirectory(): File {
        return File(activity.cacheDir, "urb-camera").apply {
            mkdirs()
        }
    }

    private fun createFileName(createdAt: Instant): String {
        val timestamp = DateTimeFormatter
            .ofPattern("yyyyMMdd-HHmmss", Locale.US)
            .withZone(ZoneOffset.UTC)
            .format(createdAt)

        return "urb-camera-$timestamp.jpg"
    }

    private data class PendingCapture(
        val file: File,
        val fileName: String,
        val mimeType: String,
        val createdAt: String,
        val compressionOptions: ImageCompressionOptions,
        val responder: UrbResponder,
    )

    private companion object {
        const val MIME_TYPE = "image/jpeg"
        const val RESOURCE_TTL_MILLIS = 60_000L
        const val MAX_FILE_BYTES = 20L * 1024L * 1024L
    }
}
