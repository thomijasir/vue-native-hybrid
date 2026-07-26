package com.example.mywebview.urb.commands.websocket

import com.example.mywebview.R
import com.example.mywebview.urb.bridge.UrbEventEmitter
import com.example.mywebview.urb.commands.shared.NativeNetworkPolicy
import com.example.mywebview.urb.core.UrbConstants
import com.example.mywebview.urb.core.UrbStringProvider
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import okio.ByteString.Companion.decodeBase64
import org.json.JSONArray
import org.json.JSONObject

class UrbWebSocketManager(
    private val eventEmitter: UrbEventEmitter,
    private val strings: UrbStringProvider,
    allowedHosts: Set<String>,
    allowCleartext: Boolean,
    private val client: OkHttpClient = defaultClient(),
    maxBodyBytes: Long = UrbConstants.MAX_NATIVE_NETWORK_BYTES,
) {
    private val sockets = ConcurrentHashMap<String, WebSocket>()
    private val policy = NativeNetworkPolicy(
        allowedHosts = allowedHosts,
        allowCleartext = allowCleartext,
        maxBodyBytes = maxBodyBytes,
    )

    fun open(payload: JSONObject): String {
        val url = payload.optString("url").trim()
        require(url.isNotBlank()) { strings.get(R.string.urb_websocket_url_required) }
        val validatedUrl = policy.requireWebSocketUrl(url)

        val socketId = payload.optString("socketId").trim().ifBlank {
            throw IllegalArgumentException(strings.get(R.string.urb_websocket_socket_id_required))
        }
        val request = buildRequest(payload, validatedUrl)
        val socket = client.newWebSocket(request, Listener(socketId))
        val existing = sockets.putIfAbsent(socketId, socket)
        if (existing != null) {
            socket.cancel()
            throw IllegalArgumentException(strings.get(R.string.urb_websocket_socket_id_required))
        }

        return socketId
    }

    fun send(payload: JSONObject) {
        val socketId = payload.optString("socketId").trim()
        val socket = sockets[socketId] ?: throw IllegalArgumentException(strings.get(R.string.urb_websocket_unknown))
        val body = payload.optJSONObject("body")
            ?: throw IllegalArgumentException(strings.get(R.string.urb_websocket_send_body_required))

        val sent = when (body.optString("kind")) {
            "text" -> {
                val value = body.optString("value")
                policy.requirePayloadSize(value.toByteArray(Charsets.UTF_8).size.toLong())
                socket.send(value)
            }
            "base64" -> {
                val bytes = decodeBase64Body(body.getString("value"))
                policy.requirePayloadSize(bytes.size.toLong())
                socket.send(bytes)
            }
            else -> throw IllegalArgumentException(strings.get(R.string.urb_websocket_unsupported_send_body))
        }

        require(sent) { strings.get(R.string.urb_websocket_message_rejected) }
    }

    fun close(payload: JSONObject) {
        val socketId = payload.optString("socketId").trim()
        val socket = sockets[socketId] ?: throw IllegalArgumentException(strings.get(R.string.urb_websocket_unknown))
        val code = payload.optInt("code", 1000)
        val reason = payload.optString("reason", "")
        require(code == 1000 || code in 3000..4999) {
            strings.get(R.string.urb_websocket_close_rejected)
        }
        policy.requirePayloadSize(reason.toByteArray(Charsets.UTF_8).size.toLong())

        require(socket.close(code, reason)) { strings.get(R.string.urb_websocket_close_rejected) }
    }

    fun closeAll() {
        sockets.values.forEach { socket ->
            socket.close(1000, "Activity destroyed")
        }
        sockets.clear()
    }

    private fun buildRequest(payload: JSONObject, url: String): Request {
        val headers = payload.optJSONArray("headers") ?: JSONArray()
        val protocols = payload.optJSONArray("protocols") ?: JSONArray()
        val builder = Request.Builder().url(url)
        var hasProtocolHeader = false

        for (index in 0 until headers.length()) {
            val header = headers.optJSONArray(index) ?: continue
            if (header.length() < 2) continue

            val name = header.optString(0)
            val value = header.optString(1)
            if (name.isBlank()) continue
            policy.requireHeaderAllowed(name)
            if (name.equals("sec-websocket-protocol", ignoreCase = true)) {
                hasProtocolHeader = true
            }

            builder.addHeader(name, value)
        }

        if (!hasProtocolHeader && protocols.length() > 0) {
            val protocolValues = mutableListOf<String>()
            for (index in 0 until protocols.length()) {
                val protocol = protocols.optString(index).trim()
                if (protocol.isNotBlank()) protocolValues.add(protocol)
            }
            if (protocolValues.isNotEmpty()) {
                builder.addHeader("Sec-WebSocket-Protocol", protocolValues.joinToString(", "))
            }
        }

        return builder.build()
    }

    private fun emit(event: JSONObject) {
        eventEmitter.emit(event.put("channel", "websocket"))
    }

    private fun decodeBase64Body(value: String): ByteString {
        return value.decodeBase64()
            ?: throw IllegalArgumentException(strings.get(R.string.urb_websocket_binary_body_invalid))
    }

    private inner class Listener(
        private val socketId: String,
    ) : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
            emit(
                JSONObject()
                    .put("socketId", socketId)
                    .put("type", "open")
                    .put("protocol", response.header("Sec-WebSocket-Protocol").orEmpty()),
            )
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            emit(
                JSONObject()
                    .put("socketId", socketId)
                    .put("type", "message")
                    .put("data", text)
                    .put("binary", false),
            )
        }

        override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
            emit(
                JSONObject()
                    .put("socketId", socketId)
                    .put("type", "message")
                    .put("dataBase64", bytes.base64())
                    .put("binary", true),
            )
        }

        override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
            emit(
                JSONObject()
                    .put("socketId", socketId)
                    .put("type", "closing")
                    .put("code", code)
                    .put("reason", reason),
            )
        }

        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
            sockets.remove(socketId)
            emit(
                JSONObject()
                    .put("socketId", socketId)
                    .put("type", "close")
                    .put("code", code)
                    .put("reason", reason),
            )
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            sockets.remove(socketId)
            emit(
                JSONObject()
                    .put("socketId", socketId)
                    .put("type", "error")
                    .put("message", t.message ?: strings.get(R.string.urb_websocket_failed)),
            )
            emit(
                JSONObject()
                    .put("socketId", socketId)
                    .put("type", "close")
                    .put("code", 1006)
                    .put("reason", t.message ?: strings.get(R.string.urb_websocket_failed)),
            )
        }
    }

    private companion object {
        fun defaultClient(): OkHttpClient {
            return OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .callTimeout(0, TimeUnit.MILLISECONDS)
                .followRedirects(false)
                .followSslRedirects(false)
                .build()
        }
    }
}
