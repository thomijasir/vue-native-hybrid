package com.example.mywebview.urb.commands.websocket

import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider
import org.json.JSONObject

class WebSocketOpenCommand(
    private val manager: UrbWebSocketManager,
    private val strings: UrbStringProvider,
) : UrbCommand {
    override val name = "websocket:open"
    override val expectsResponse = true

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder ?: return
        val payload = request.payload
        if (payload == null) {
            responder.error("WEBSOCKET_INVALID_PAYLOAD", strings.get(R.string.urb_websocket_open_payload_required))
            return
        }

        try {
            responder.success(
                JSONObject().put("socketId", manager.open(payload)),
            )
        } catch (error: IllegalArgumentException) {
            responder.error(
                "WEBSOCKET_INVALID_PAYLOAD",
                error.message ?: strings.get(R.string.urb_websocket_open_payload_invalid),
            )
        }
    }
}
