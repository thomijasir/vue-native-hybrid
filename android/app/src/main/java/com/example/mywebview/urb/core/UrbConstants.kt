package com.example.mywebview.urb.core

object UrbConstants {
    const val BRIDGE_OBJECT_NAME = "urbNative"
    const val APP_ASSET_ORIGIN = "https://appassets.androidplatform.net"
    const val RELEASE_APP_URL = "$APP_ASSET_ORIGIN/assets/web/index.html"
    const val DEBUG_APP_URL = "http://10.0.2.2:8080/"
    const val RESOURCE_PATH_PREFIX = "/urb-resource/"
    const val MAX_NATIVE_NETWORK_BYTES = 5L * 1024L * 1024L

    val DEBUG_NATIVE_NETWORK_ALLOWED_HOSTS = setOf(
        "jsonplaceholder.typicode.com",
        "example.test",
    )

    val RELEASE_NATIVE_NETWORK_ALLOWED_HOSTS = emptySet<String>()
}
