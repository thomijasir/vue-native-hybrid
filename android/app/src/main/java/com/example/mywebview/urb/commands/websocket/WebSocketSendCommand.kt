package com.example.mywebview.urb.commands.websocket

import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider

class WebSocketSendCommand(
    private val manager: UrbWebSocketManager,
    private val strings: UrbStringProvider,
) : UrbCommand {
    override val name = "websocket:send"
    override val expectsResponse = true

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder ?: return
        val payload = request.payload
        if (payload == null) {
            responder.error("WEBSOCKET_INVALID_PAYLOAD", strings.get(R.string.urb_websocket_send_payload_required))
            return
        }

        try {
            manager.send(payload)
            responder.success()
        } catch (error: IllegalArgumentException) {
            responder.error(
                "WEBSOCKET_SEND_FAILED",
                error.message ?: strings.get(R.string.urb_websocket_send_failed),
            )
        }
    }
}
