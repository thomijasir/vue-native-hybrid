package com.example.mywebview.urb.commands.documents

import android.net.Uri
import androidx.activity.result.ActivityResultLauncher
import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider
import com.example.mywebview.urb.commands.shared.PickedFileReaderCommand
import org.json.JSONObject

class DocumentsPickCommand(
    private val singleLauncher: ActivityResultLauncher<Array<String>>,
    private val multipleLauncher: ActivityResultLauncher<Array<String>>,
    private val fileReader: PickedFileReaderCommand,
    private val strings: UrbStringProvider,
) : UrbCommand {
    override val name = "document:pick"
    override val expectsResponse = true

    private var pendingPick: PendingDocumentsPick? = null

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder ?: return

        if (pendingPick != null) {
            responder.error("DOCUMENT_PICKER_BUSY", strings.get(R.string.urb_document_picker_busy))
            return
        }

        val options = parseOptions(request)
        if (options == null) {
            responder.error("DOCUMENT_PICKER_INVALID_PAYLOAD", strings.get(R.string.urb_document_picker_invalid_payload))
            return
        }

        pendingPick = PendingDocumentsPick(options, responder)

        try {
            if (options.multiple) {
                multipleLauncher.launch(options.mimeTypes.toTypedArray())
            } else {
                singleLauncher.launch(options.mimeTypes.toTypedArray())
            }
        } catch (error: RuntimeException) {
            pendingPick = null
            responder.error(
                "DOCUMENT_PICKER_FAILED",
                error.message ?: strings.get(R.string.urb_document_picker_open_failed),
            )
        }
    }

    fun onSingleDocumentResult(uri: Uri?) {
        if (uri == null) {
            completeCancelled()
            return
        }

        completeWithUris(listOf(uri))
    }

    fun onMultipleDocumentsResult(uris: List<Uri>) {
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
                "DOCUMENT_PICKER_TOO_MANY_FILES",
                strings.get(R.string.urb_document_picker_too_many_files),
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
                        ),
                    ),
            )
        } catch (error: RuntimeException) {
            pick.responder.error(
                "DOCUMENT_PICKER_UNREADABLE_URI",
                error.message ?: strings.get(R.string.urb_document_picker_read_failed),
            )
        }
    }

    private fun completeCancelled() {
        val pick = pendingPick ?: return
        pendingPick = null
        pick.responder.error("DOCUMENT_PICKER_CANCELLED", strings.get(R.string.urb_document_picker_cancelled))
    }

    private fun parseOptions(request: UrbRequest): DocumentsPickOptions? {
        val payload = request.payload
        val multiple = payload?.optBoolean("multiple", false) ?: false
        val maxItems = clampMaxItems(payload?.optInt("maxItems", DEFAULT_MAX_ITEMS) ?: DEFAULT_MAX_ITEMS)
        val mimeTypes = parseMimeTypes(payload)

        if (mimeTypes.isEmpty()) return null

        return DocumentsPickOptions(
            multiple = multiple,
            maxItems = if (multiple) maxItems else 1,
            mimeTypes = mimeTypes,
        )
    }

    private fun parseMimeTypes(payload: org.json.JSONObject?): List<String> {
        val mimeTypesJson = payload?.optJSONArray("mimeTypes") ?: return listOf(DEFAULT_MIME_TYPE)
        val mimeTypes = mutableListOf<String>()

        for (index in 0 until mimeTypesJson.length()) {
            val mimeType = mimeTypesJson.optString(index).trim()
            if (!isValidMimeType(mimeType)) return emptyList()
            if (!mimeTypes.contains(mimeType)) mimeTypes.add(mimeType)
        }

        return mimeTypes
    }

    private fun isValidMimeType(mimeType: String): Boolean {
        if (mimeType == "*/*") return true
        val parts = mimeType.split('/')
        return parts.size == 2 &&
            parts[0].isNotBlank() &&
            parts[1].isNotBlank() &&
            !parts[0].contains('*')
    }

    private fun clampMaxItems(maxItems: Int): Int {
        return maxItems.coerceIn(MIN_MAX_ITEMS, MAX_MAX_ITEMS)
    }

    private data class PendingDocumentsPick(
        val options: DocumentsPickOptions,
        val responder: UrbResponder,
    )

    private data class DocumentsPickOptions(
        val multiple: Boolean,
        val maxItems: Int,
        val mimeTypes: List<String>,
    )

    private companion object {
        const val CACHE_FOLDER_NAME = "urb-documents"
        const val DEFAULT_MIME_TYPE = "*/*"
        const val DEFAULT_MAX_ITEMS = 10
        const val MIN_MAX_ITEMS = 1
        const val MAX_MAX_ITEMS = 20
    }
}
