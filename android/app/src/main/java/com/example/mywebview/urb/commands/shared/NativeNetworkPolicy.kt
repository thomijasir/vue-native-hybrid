package com.example.mywebview.urb.commands.shared

import java.net.InetAddress
import java.util.Locale
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

internal class NativeNetworkPolicy(
    allowedHosts: Set<String>,
    private val allowCleartext: Boolean,
    val maxBodyBytes: Long,
) {
    private val normalizedAllowedHosts = allowedHosts.mapTo(mutableSetOf()) {
        it.lowercase(Locale.US)
    }

    fun requireHttpUrl(rawUrl: String): HttpUrl {
        val url = rawUrl.toHttpUrlOrNull()
            ?: throw IllegalArgumentException("Native fetch URL must be http or https")
        require(url.scheme == "https" || allowCleartext) {
            "Native fetch requires HTTPS"
        }
        requireHostAllowed(url.host)
        return url
    }

    fun requireWebSocketUrl(rawUrl: String): String {
        val normalized = when {
            rawUrl.startsWith("wss://", ignoreCase = true) -> "https://${rawUrl.drop(6)}"
            rawUrl.startsWith("ws://", ignoreCase = true) -> "http://${rawUrl.drop(5)}"
            else -> throw IllegalArgumentException("Native WebSocket URL must be ws or wss")
        }
        val url = normalized.toHttpUrlOrNull()
            ?: throw IllegalArgumentException("Native WebSocket URL is invalid")
        require(rawUrl.startsWith("wss://", ignoreCase = true) || allowCleartext) {
            "Native WebSocket requires WSS"
        }
        requireHostAllowed(url.host)
        return rawUrl
    }

    fun requireHeaderAllowed(name: String) {
        val normalized = name.lowercase(Locale.US)
        require(normalized !in UNSAFE_HEADERS) {
            "Native network header is not allowed: $name"
        }
    }

    fun requirePayloadSize(sizeBytes: Long) {
        require(sizeBytes <= maxBodyBytes) {
            "Native network payload is too large"
        }
    }

    private fun requireHostAllowed(host: String) {
        val normalized = host.lowercase(Locale.US)
        require(normalizedAllowedHosts.isNotEmpty() && normalized in normalizedAllowedHosts) {
            "Native network host is not allowlisted"
        }
        require(allowCleartext || !isPrivateOrLocalHost(normalized)) {
            "Native network host is not allowed in release builds"
        }
    }

    private fun isPrivateOrLocalHost(host: String): Boolean {
        if (host == "localhost" || host.endsWith(".localhost")) return true
        if (!host.isIpLiteral()) return false

        return runCatching {
            val address = InetAddress.getByName(host.trim('[', ']'))
            address.isAnyLocalAddress ||
                address.isLoopbackAddress ||
                address.isLinkLocalAddress ||
                address.isSiteLocalAddress
        }.getOrDefault(true)
    }

    private fun String.isIpLiteral(): Boolean {
        return matches(Regex("""\d{1,3}(\.\d{1,3}){3}""")) ||
            startsWith("[") ||
            contains(":")
    }

    private companion object {
        val UNSAFE_HEADERS = setOf(
            "connection",
            "content-length",
            "host",
            "keep-alive",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailer",
            "transfer-encoding",
            "upgrade",
        )
    }
}
