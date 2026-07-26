package com.example.mywebview.urb.commands.deeplink

import android.content.Intent
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.bridge.UrbEventEmitter
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import org.json.JSONObject

class DeepLinkCommand(
    private val eventEmitter: UrbEventEmitter,
) : UrbCommand {
    override val name = "deepLink:getInitial"
    override val expectsResponse = true
    private var initialUrl: String? = null

    fun captureInitialIntent(intent: Intent?) {
        if (initialUrl == null) {
            initialUrl = intent.deepLinkUrl()
        }
    }

    fun handleNewIntent(intent: Intent?) {
        val url = intent.deepLinkUrl() ?: return
        eventEmitter.emit(
            JSONObject()
                .put("channel", "urb")
                .put("name", "deepLink:open")
                .put(
                    "payload",
                    JSONObject()
                        .put("url", url),
                ),
        )
    }

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder?.success(
            JSONObject()
                .put("url", initialUrl ?: JSONObject.NULL),
        )
    }

    private fun Intent?.deepLinkUrl(): String? {
        return this
            ?.takeIf { it.action == Intent.ACTION_VIEW }
            ?.data
            ?.toString()
    }
}
