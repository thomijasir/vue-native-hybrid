package com.example.mywebview.urb.commands.media

import android.net.Uri
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia.VisualMediaType
import androidx.activity.result.ActivityResultLauncher
import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider
import com.example.mywebview.urb.commands.shared.ImageCompressionOptions
import com.example.mywebview.urb.commands.shared.PickedFileReaderCommand
import org.json.JSONObject

class MediaPickCommand(
    private val singleLauncher: ActivityResultLauncher<PickVisualMediaRequest>,
    private val multipleLauncher: ActivityResultLauncher<PickVisualMediaRequest>,
    private val fileReader: PickedFileReaderCommand,
    private val strings: UrbStringProvider,
) : UrbCommand {
    override val name = "media:pick"
    override val expectsResponse = true

    private var pendingPick: PendingMediaPick? = null

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder ?: return

        if (pendingPick != null) {
            responder.error("MEDIA_PICKER_BUSY", strings.get(R.string.urb_media_picker_busy))
            return
        }

        val options = parseOptions(request)
        if (options == null) {
            responder.error("MEDIA_PICKER_INVALID_PAYLOAD", strings.get(R.string.urb_media_picker_invalid_payload))
            return
        }

        pendingPick = PendingMediaPick(options, responder)

        try {
            val pickerRequest = PickVisualMediaRequest.Builder()
                .setMediaType(options.mediaType)
                .build()

            if (options.multiple) {
                multipleLauncher.launch(pickerRequest)
            } else {
                singleLauncher.launch(pickerRequest)
            }
        } catch (error: RuntimeException) {
            pendingPick = null
            responder.error(
                "MEDIA_PICKER_FAILED",
                error.message ?: strings.get(R.string.urb_media_picker_open_failed),
            )
        }
    }

    fun onSingleMediaResult(uri: Uri?) {
        if (uri == null) {
            completeCancelled()
            return
        }

        completeWithUris(listOf(uri))
    }

    fun onMultipleMediaResult(uris: List<Uri>) {
        if (uris.isEmpty()) {
            completeCancelled()
            return
        }

        completeWithUris(uris)
    }

    private fun completeWithUris(uris: List<Uri>) {
        val pick = pendingPick ?: return
        pendingPick = null

        if (uris.size > pick.options.maxItems) {
            pick.responder.error(
                "MEDIA_PICKER_TOO_MANY_FILES",
                strings.get(R.string.urb_media_picker_too_many_files),
            )
            return
        }

        try {
            pick.responder.success(
                JSONObject()
                    .put(
                        "items",
                        fileReader.registerUris(
                            uris = uris,
                            cacheFolderName = CACHE_FOLDER_NAME,
                            compressionOptions = pick.options.compressionOptions,
                        ),
                    ),
            )
        } catch (error: RuntimeException) {
            pick.responder.error(
                "MEDIA_PICKER_UNREADABLE_URI",
                error.message ?: strings.get(R.string.urb_media_picker_read_failed),
            )
        }
    }

    private fun completeCancelled() {
        val pick = pendingPick ?: return
        pendingPick = null
        pick.responder.error("MEDIA_PICKER_CANCELLED", strings.get(R.string.urb_media_picker_cancelled))
    }

    private fun parseOptions(request: UrbRequest): MediaPickOptions? {
        val payload = request.payload
        val multiple = payload?.optBoolean("multiple", false) ?: false
        val maxItems = clampMaxItems(payload?.optInt("maxItems", DEFAULT_MAX_ITEMS) ?: DEFAULT_MAX_ITEMS)
        val mediaTypeName = payload?.optString("type", "imageAndVideo") ?: "imageAndVideo"
        val mediaType = when (mediaTypeName) {
            "image" -> ActivityResultContracts.PickVisualMedia.ImageOnly
            "video" -> ActivityResultContracts.PickVisualMedia.VideoOnly
            "imageAndVideo" -> ActivityResultContracts.PickVisualMedia.ImageAndVideo
            else -> return null
        }

        return MediaPickOptions(
            multiple = multiple,
            maxItems = if (multiple) maxItems else 1,
            mediaType = mediaType,
            compressionOptions = ImageCompressionOptions.fromPayload(payload),
        )
    }

    private fun clampMaxItems(maxItems: Int): Int {
        return maxItems.coerceIn(MIN_MAX_ITEMS, MAX_MAX_ITEMS)
    }

    private data class PendingMediaPick(
        val options: MediaPickOptions,
        val responder: UrbResponder,
    )

    private data class MediaPickOptions(
        val multiple: Boolean,
        val maxItems: Int,
        val mediaType: VisualMediaType,
        val compressionOptions: ImageCompressionOptions,
    )

    private companion object {
        const val CACHE_FOLDER_NAME = "urb-media"
        const val DEFAULT_MAX_ITEMS = 10
        const val MIN_MAX_ITEMS = 1
        const val MAX_MAX_ITEMS = 20
    }
}
