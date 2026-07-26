package com.example.mywebview.urb.webview

import android.annotation.SuppressLint
import android.net.Uri
import android.webkit.WebSettings
import android.webkit.WebView
import com.example.mywebview.urb.core.UrbConstants

object UrbWebViewSecurity {
    fun bridgeAllowedOrigins(debug: Boolean): Set<String> {
        return if (debug) {
            setOf(
                UrbConstants.APP_ASSET_ORIGIN,
                UrbConstants.DEBUG_APP_URL.removeSuffix("/"),
            )
        } else {
            setOf(UrbConstants.APP_ASSET_ORIGIN)
        }
    }

    fun isTrustedAppUrl(uri: Uri, debug: Boolean): Boolean {
        val origin = uri.origin() ?: return false
        return origin in bridgeAllowedOrigins(debug)
    }

    fun isHttpOrHttps(uri: Uri): Boolean {
        return uri.scheme.equals("http", ignoreCase = true) ||
            uri.scheme.equals("https", ignoreCase = true)
    }

    @SuppressLint("SetJavaScriptEnabled")
    fun configureTrustedAppWebView(webView: WebView, debug: Boolean) {
        configureSharedSecurity(webView)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = false
            useWideViewPort = false

            if (debug) {
                cacheMode = WebSettings.LOAD_NO_CACHE
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    fun configureBrowserWebView(webView: WebView) {
        configureSharedSecurity(webView)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = true
        }
    }

    private fun configureSharedSecurity(webView: WebView) {
        webView.settings.apply {
            allowFileAccess = false
            allowContentAccess = false
            allowFileAccessFromFileURLs = false
            allowUniversalAccessFromFileURLs = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        }
    }

    private fun Uri.origin(): String? {
        val scheme = scheme?.lowercase() ?: return null
        val host = host ?: return null
        val portPart = if (port != -1) ":$port" else ""
        return "$scheme://$host$portPart"
    }
}
