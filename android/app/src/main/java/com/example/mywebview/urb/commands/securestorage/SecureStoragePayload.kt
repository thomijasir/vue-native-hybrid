package com.example.mywebview.urb.commands.securestorage

import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder

internal fun requireSecureStorageKey(request: UrbRequest, responder: UrbResponder?): String? {
    val key = request.payload?.optString("key")?.takeIf { it.isNotBlank() }
    if (key == null) {
        responder?.error(
            "URB_INVALID_SECURE_STORAGE_PAYLOAD",
            "Secure storage payload requires key",
        )
    }
    return key
}
