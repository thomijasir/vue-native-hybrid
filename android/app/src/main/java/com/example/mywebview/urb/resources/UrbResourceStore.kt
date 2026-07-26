package com.example.mywebview.urb.resources

import android.webkit.WebResourceResponse
import com.example.mywebview.urb.core.UrbConstants
import java.io.FilterInputStream
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.security.SecureRandom
import java.util.Base64

class UrbResourceStore(
    private val allowedOrigin: String = UrbConstants.APP_ASSET_ORIGIN,
) {
    data class Resource(
        val file: File,
        val fileName: String,
        val mimeType: String,
        val createdAt: String,
        val expiresAtMillis: Long,
        var consumed: Boolean = false,
    )

    private val random = SecureRandom()
    private val resources = mutableMapOf<String, Resource>()

    @Synchronized
    fun register(resource: Resource): String {
        cleanupExpired()

        val tokenBytes = ByteArray(24)
        var token: String
        do {
            random.nextBytes(tokenBytes)
            token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes)
        } while (resources.containsKey(token))

        resources[token] = resource
        return token
    }

    @Synchronized
    fun consume(path: String): WebResourceResponse? {
        cleanupExpired()

        val token = path.trim('/').substringBefore('/').trim()
        val resource = resources[token] ?: return null
        if (resource.consumed || !resource.file.exists()) {
            resources.remove(token)
            return null
        }

        resource.consumed = true
        resources.remove(token)

        val stream = openResourceStream(resource)

        return WebResourceResponse(
            resource.mimeType,
            null,
            200,
            "OK",
            responseHeaders(resource.fileName),
            stream,
        )
    }

    internal fun responseHeaders(fileName: String): Map<String, String> {
        return mapOf(
            "Access-Control-Allow-Origin" to allowedOrigin,
            "Cache-Control" to "no-store",
            "Content-Disposition" to "inline; filename=\"${fileName.headerSafe()}\"",
        )
    }

    internal fun openResourceStream(resource: Resource): InputStream {
        return DeleteOnCloseInputStream(FileInputStream(resource.file), resource.file)
    }

    @Synchronized
    fun clear(deleteFiles: Boolean = false) {
        if (deleteFiles) {
            resources.values.forEach { resource ->
                resource.file.delete()
            }
        }
        resources.clear()
    }

    @Synchronized
    private fun cleanupExpired() {
        val now = System.currentTimeMillis()
        val expiredTokens = resources
            .filter { (_, resource) -> resource.expiresAtMillis <= now }
            .map { (token, _) -> token }

        expiredTokens.forEach { token ->
            resources.remove(token)?.file?.delete()
        }
    }

    private fun String.headerSafe(): String {
        return replace(Regex("[\\r\\n\"]+"), "_")
    }

    private class DeleteOnCloseInputStream(
        input: InputStream,
        private val file: File,
    ) : FilterInputStream(input) {
        override fun close() {
            try {
                super.close()
            } finally {
                file.delete()
            }
        }
    }
}
