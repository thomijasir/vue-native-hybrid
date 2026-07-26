package com.example.mywebview.urb.commands.browser

import android.content.ActivityNotFoundException
import android.content.Intent
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.core.net.toUri
import com.example.mywebview.app.browser.BrowserActivity
import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider

class BrowserOpenCommand(
    private val activity: AppCompatActivity,
    private val strings: UrbStringProvider,
) : UrbCommand {
    override val name = "browser:open"
    override val expectsResponse = false

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        val payload = request.payload
        val url = payload?.optString("url")?.trim().orEmpty()
        val mode = payload?.optString("mode", MODE_EXTERNAL)?.ifBlank { MODE_EXTERNAL }
            ?: MODE_EXTERNAL
        val uri = parseAllowedUri(url) ?: throw IllegalArgumentException(strings.get(R.string.urb_browser_url_invalid))
        val intent = if (mode == MODE_IN_APP && uri.scheme in IN_APP_SCHEMES) {
            BrowserActivity.intent(activity, uri.toString())
        } else {
            Intent(Intent.ACTION_VIEW, uri)
        }

        try {
            activity.startActivity(intent)
        } catch (error: ActivityNotFoundException) {
            Log.e(TAG, "BROWSER_ACTIVITY_NOT_FOUND: ${uri.scheme}", error)
        } catch (error: RuntimeException) {
            Log.e(TAG, "BROWSER_OPEN_FAILED", error)
        }
    }

    private fun parseAllowedUri(url: String): android.net.Uri? {
        if (url.isBlank()) return null

        val uri = runCatching { url.toUri() }.getOrNull() ?: return null
        val scheme = uri.scheme?.lowercase() ?: return null

        if (scheme !in ALLOWED_SCHEMES) return null
        if ((scheme == "http" || scheme == "https") && uri.host.isNullOrBlank()) return null
        if ((scheme == "mailto" || scheme == "tel") && uri.schemeSpecificPart.isNullOrBlank()) return null

        return uri
    }

    private companion object {
        const val TAG = "BrowserOpenCommand"
        const val MODE_EXTERNAL = "external"
        const val MODE_IN_APP = "inApp"
        val ALLOWED_SCHEMES = setOf("http", "https", "mailto", "tel")
        val IN_APP_SCHEMES = setOf("http", "https")
    }
}
