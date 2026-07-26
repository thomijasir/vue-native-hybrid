package com.example.mywebview.urb.commands.clipboard

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import org.json.JSONObject

class ClipboardGetTextCommand(
    private val context: Context,
) : UrbCommand {
    override val name = "clipboard:getText"
    override val expectsResponse = true

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val text = clipboard.primaryClip
            ?.takeIf { it.itemCount > 0 }
            ?.getItemAt(0)
            ?.coerceToText(context)
            ?.toString()
            .orEmpty()

        responder?.success(
            JSONObject()
                .put("text", text),
        )
    }
}

class ClipboardSetTextCommand(
    private val context: Context,
) : UrbCommand {
    override val name = "clipboard:setText"
    override val expectsResponse = true

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        val payload = request.payload
        if (payload == null || !payload.has("text") || payload.isNull("text")) {
            responder?.error(
                "URB_INVALID_CLIPBOARD_PAYLOAD",
                "Clipboard setText payload requires text",
            )
            return
        }

        val text = payload.opt("text") as? String
        if (text == null) {
            responder?.error(
                "URB_INVALID_CLIPBOARD_PAYLOAD",
                "Clipboard setText payload requires text",
            )
            return
        }

        val label = payload.optString("label")
            .takeIf { it.isNotBlank() }
            ?: "URB clipboard text"
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText(label, text))

        responder?.success()
    }
}
