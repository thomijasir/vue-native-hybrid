package com.example.mywebview.urb.bridge

import android.annotation.SuppressLint
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.webkit.WebView
import androidx.webkit.WebMessageCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbCommandRegistry
import com.example.mywebview.urb.core.UrbConstants
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider
import java.util.Collections
import java.util.concurrent.ConcurrentHashMap
import org.json.JSONException
import org.json.JSONObject

class UrbBridge(
    private val webView: WebView,
    private val commandRegistry: UrbCommandRegistry,
    private val allowedOrigins: Set<String>,
    private val strings: UrbStringProvider,
) {
    private val mainHandler = Handler(Looper.getMainLooper())
    private val activeRequestIds = Collections.synchronizedSet(mutableSetOf<String>())
    private val requestTimeouts = ConcurrentHashMap<String, Runnable>()

    @SuppressLint("RequiresFeature")
    fun attach() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            Log.e(TAG, strings.get(R.string.urb_web_message_listener_unsupported))
            return
        }

        WebViewCompat.addWebMessageListener(
            webView,
            UrbConstants.BRIDGE_OBJECT_NAME,
            allowedOrigins,
        ) { _, message, sourceOrigin, isMainFrame, _ ->
            handleMessage(message, sourceOrigin, isMainFrame)
        }
    }

    private fun handleMessage(
        message: WebMessageCompat,
        sourceOrigin: Uri,
        isMainFrame: Boolean,
    ) {
        if (!isMainFrame) {
            Log.w(TAG, "Rejected URB message from non-main frame")
            return
        }

        if (!allowedOrigins.contains(sourceOrigin.toString())) {
            Log.w(TAG, "Rejected URB message from origin: $sourceOrigin")
            return
        }

        val data = message.data ?: return
        val request = parseRequest(data) ?: return
        val command = commandRegistry.find(request.name)

        if (command == null) {
            replyError(
                request.id,
                "URB_UNKNOWN_COMMAND",
                strings.get(R.string.urb_unknown_command, request.name),
            )
            return
        }

        if (request.type == "fire") {
            if (command.expectsResponse) {
                Log.w(TAG, "Rejected fire call for response command: ${request.name}")
                return
            }
            try {
                command.handle(request, null)
            } catch (error: RuntimeException) {
                Log.e(TAG, "URB fire command failed: ${request.name}", error)
            }
            return
        }

        if (request.type != "send") {
            replyError(request.id, "URB_INVALID_TYPE", strings.get(R.string.urb_invalid_request_type))
            return
        }

        val id = request.id
        if (id.isNullOrBlank()) {
            Log.w(TAG, "Rejected send command without request id")
            return
        }

        if (activeRequestIds.contains(id)) {
            replyError(id, "URB_DUPLICATE_REQUEST", strings.get(R.string.urb_duplicate_request_id))
            return
        }

        if (!command.expectsResponse) {
            replyError(id, "URB_INVALID_COMMAND_MODE", strings.get(R.string.urb_invalid_command_mode))
            return
        }

        activeRequestIds.add(id)
        scheduleRequestTimeout(id)
        val responder = UrbResponder(id) { completedId, response ->
            if (activeRequestIds.remove(completedId)) {
                cancelRequestTimeout(completedId)
                sendResponse(response)
            }
        }

        try {
            command.handle(request, responder)
        } catch (error: RuntimeException) {
            responder.error(
                "URB_COMMAND_FAILED",
                error.message ?: strings.get(R.string.urb_native_command_failed),
            )
        }
    }

    private fun parseRequest(data: String): UrbRequest? {
        return try {
            val json = JSONObject(data)
            UrbRequest(
                id = json.optString("id").takeIf { it.isNotBlank() },
                type = json.getString("type"),
                name = json.getString("name"),
                payload = json.optJSONObject("payload"),
            )
        } catch (error: JSONException) {
            Log.w(TAG, "Rejected malformed URB message", error)
            null
        }
    }

    private fun replyError(id: String?, code: String, message: String) {
        if (id.isNullOrBlank()) {
            Log.w(TAG, "URB error without request id: $code $message")
            return
        }

        activeRequestIds.remove(id)
        cancelRequestTimeout(id)
        sendResponse(
            JSONObject()
                .put("id", id)
                .put("ok", false)
                .put(
                    "error",
                    JSONObject()
                        .put("code", code)
                        .put("message", message),
                ),
        )
    }

    private fun sendResponse(response: JSONObject) {
        val responseJson = JSONObject.quote(response.toString())
        webView.post {
            webView.evaluateJavascript(
                "window.__urbReceive && window.__urbReceive($responseJson);",
                null,
            )
        }
    }

    private fun scheduleRequestTimeout(id: String) {
        val timeout = Runnable {
            replyError(
                id,
                "URB_REQUEST_TIMEOUT",
                strings.get(R.string.urb_native_command_failed),
            )
        }
        requestTimeouts[id] = timeout
        mainHandler.postDelayed(timeout, REQUEST_TIMEOUT_MILLIS)
    }

    private fun cancelRequestTimeout(id: String) {
        requestTimeouts.remove(id)?.let { timeout ->
            mainHandler.removeCallbacks(timeout)
        }
    }

    private companion object {
        const val TAG = "UrbBridge"
        const val REQUEST_TIMEOUT_MILLIS = 60_000L
    }
}
