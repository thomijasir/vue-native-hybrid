package com.example.mywebview.urb.bridge

import android.webkit.WebView
import org.json.JSONObject

class UrbEventEmitter(
    private val webView: WebView,
) {
    fun emit(event: JSONObject) {
        val eventJson = JSONObject.quote(event.toString())
        webView.post {
            webView.evaluateJavascript(
                "window.__urbEvent && window.__urbEvent($eventJson);",
                null,
            )
        }
    }
}
