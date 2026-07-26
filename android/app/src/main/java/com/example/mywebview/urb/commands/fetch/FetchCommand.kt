package com.example.mywebview.urb.commands.fetch

import android.util.Base64
import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbConstants
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider
import com.example.mywebview.urb.commands.shared.NativeNetworkPolicy
import java.io.IOException
import java.util.Collections
import java.util.concurrent.TimeUnit
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okio.Buffer
import org.json.JSONArray
import org.json.JSONObject

class FetchCommand(
    private val strings: UrbStringProvider,
    allowedHosts: Set<String>,
    allowCleartext: Boolean,
    private val client: OkHttpClient = defaultClient(),
    maxBodyBytes: Long = UrbConstants.MAX_NATIVE_NETWORK_BYTES,
) : UrbCommand {
    override val name = "fetch"
    override val expectsResponse = true
    private val policy = NativeNetworkPolicy(
        allowedHosts = allowedHosts,
        allowCleartext = allowCleartext,
        maxBodyBytes = maxBodyBytes,
    )
    private val activeCalls = Collections.synchronizedSet(mutableSetOf<Call>())

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder ?: return

        val payload = request.payload
        if (payload == null) {
            responder.error("FETCH_INVALID_PAYLOAD", strings.get(R.string.urb_fetch_payload_required))
            return
        }

        val okHttpRequest = try {
            buildRequest(payload)
        } catch (error: RuntimeException) {
            responder.error("FETCH_INVALID_PAYLOAD", error.message ?: strings.get(R.string.urb_fetch_payload_invalid))
            return
        }

        val call = client.newCall(okHttpRequest)
        activeCalls.add(call)
        call.enqueue(
            object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    activeCalls.remove(call)
                    responder.error("FETCH_NETWORK_ERROR", e.message ?: strings.get(R.string.urb_fetch_network_failed))
                }

                override fun onResponse(call: Call, response: Response) {
                    activeCalls.remove(call)
                    response.use {
                        val bodyBytes = try {
                            responseBodyBytes(it)
                        } catch (error: IllegalArgumentException) {
                            responder.error("FETCH_RESPONSE_TOO_LARGE", error.message ?: strings.get(R.string.urb_fetch_network_failed))
                            return
                        }
                        responder.success(
                            JSONObject()
                                .put("status", it.code)
                                .put("statusText", it.message)
                                .put("headers", responseHeaders(it))
                                .put(
                                    "bodyBase64",
                                    Base64.encodeToString(bodyBytes, Base64.NO_WRAP),
                                )
                                .put("url", it.request.url.toString()),
                        )
                    }
                }
            },
        )
    }

    fun cancelAll() {
        activeCalls.toList().forEach { call ->
            call.cancel()
        }
        activeCalls.clear()
    }

    private fun buildRequest(payload: JSONObject): Request {
        val url = policy.requireHttpUrl(payload.optString("url").trim())

        val method = payload.optString("method", "GET")
            .ifBlank { "GET" }
            .uppercase()
        val headers = payload.optJSONArray("headers") ?: JSONArray()
        val body = payload.optJSONObject("body") ?: JSONObject().put("kind", "empty")
        val contentType = contentTypeFrom(headers)
        val requestBody = requestBodyFor(method, body, contentType)
        val builder = Request.Builder().url(url)

        for (index in 0 until headers.length()) {
            val header = headers.optJSONArray(index) ?: continue
            if (header.length() < 2) continue

            val name = header.optString(0)
            val value = header.optString(1)
            if (name.isBlank()) continue
            if (name.equals("content-type", ignoreCase = true)) continue
            policy.requireHeaderAllowed(name)

            builder.addHeader(name, value)
        }

        return builder.method(method, requestBody).build()
    }

    private fun requestBodyFor(
        method: String,
        body: JSONObject,
        contentType: String?,
    ): RequestBody? {
        val kind = body.optString("kind", "empty")

        if (kind == "empty") {
            return if (method == "GET" || method == "HEAD") {
                null
            } else {
                ByteArray(0).toRequestBody(contentType?.toMediaTypeOrNull())
            }
        }

        return when (kind) {
            "text" -> {
                val value = body.optString("value")
                policy.requirePayloadSize(value.toByteArray(Charsets.UTF_8).size.toLong())
                value.toRequestBody(contentType?.toMediaTypeOrNull())
            }
            "base64" -> {
                val bytes = decodeBase64(body.getString("value"))
                policy.requirePayloadSize(bytes.size.toLong())
                bytes.toRequestBody(
                    body.optString("mimeType")
                        .ifBlank { contentType ?: "application/octet-stream" }
                        .toMediaTypeOrNull(),
                )
            }

            "multipart" -> multipartBody(body.getJSONArray("parts"))
            else -> throw IllegalArgumentException(strings.get(R.string.urb_fetch_unsupported_body_kind, kind))
        }
    }

    private fun multipartBody(parts: JSONArray): RequestBody {
        val builder = MultipartBody.Builder().setType(MultipartBody.FORM)

        for (index in 0 until parts.length()) {
            val part = parts.optJSONObject(index) ?: continue
            val name = part.optString("name")
            if (name.isBlank()) continue

            when (part.optString("kind")) {
                "text" -> builder.addFormDataPart(name, part.optString("value"))
                "file" -> {
                    val bytes = decodeBase64(part.getString("bodyBase64"))
                    policy.requirePayloadSize(bytes.size.toLong())
                    builder.addFormDataPart(
                        name,
                        part.optString("fileName").ifBlank { "blob" },
                        bytes.toRequestBody(
                            part.optString("mimeType", "application/octet-stream")
                                .toMediaTypeOrNull(),
                        ),
                    )
                }
            }
        }

        return builder.build()
    }

    private fun contentTypeFrom(headers: JSONArray): String? {
        for (index in 0 until headers.length()) {
            val header = headers.optJSONArray(index) ?: continue
            if (
                header.length() >= 2 &&
                header.optString(0).equals("content-type", ignoreCase = true)
            ) {
                return header.optString(1).ifBlank { null }
            }
        }

        return null
    }

    private fun responseHeaders(response: Response): JSONArray {
        val headers = JSONArray()

        for (index in 0 until response.headers.size) {
            headers.put(
                JSONArray()
                    .put(response.headers.name(index))
                    .put(response.headers.value(index)),
            )
        }

        return headers
    }

    private fun decodeBase64(value: String): ByteArray {
        return Base64.decode(value, Base64.DEFAULT)
    }

    private fun responseBodyBytes(response: Response): ByteArray {
        val body = response.body ?: return ByteArray(0)
        val contentLength = body.contentLength()
        require(contentLength <= policy.maxBodyBytes) {
            "Native fetch response is too large"
        }

        val source = body.source()
        val buffer = Buffer()
        var totalBytes = 0L
        while (true) {
            val read = source.read(buffer, READ_CHUNK_BYTES)
            if (read == -1L) break
            totalBytes += read
            require(totalBytes <= policy.maxBodyBytes) {
                "Native fetch response is too large"
            }
        }
        return buffer.readByteArray()
    }

    private companion object {
        private const val READ_CHUNK_BYTES = 8L * 1024L

        fun defaultClient(): OkHttpClient {
            return OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .callTimeout(45, TimeUnit.SECONDS)
                .followRedirects(false)
                .followSslRedirects(false)
                .build()
        }
    }
}
