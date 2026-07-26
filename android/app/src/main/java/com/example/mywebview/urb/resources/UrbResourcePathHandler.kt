package com.example.mywebview.urb.resources

import android.webkit.WebResourceResponse
import androidx.webkit.WebViewAssetLoader

class UrbResourcePathHandler(
    private val resourceStore: UrbResourceStore,
) : WebViewAssetLoader.PathHandler {
    override fun handle(path: String): WebResourceResponse? {
        return resourceStore.consume(path)
    }
}
