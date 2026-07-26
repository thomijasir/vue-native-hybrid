package com.example.mywebview.urb.commands.securestorage

import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder

class SecureStorageSetCommand(
    private val storage: SecureStorage,
) : UrbCommand {
    override val name = "secureStorage:set"
    override val expectsResponse = true

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        val key = requireSecureStorageKey(request, responder) ?: return
        val value = request.payload?.opt("value") as? String
        if (value == null) {
            responder?.error(
                "URB_INVALID_SECURE_STORAGE_PAYLOAD",
                "Secure storage set payload requires value",
            )
            return
        }

        if (!storage.set(key, value)) {
            responder?.error(
                "URB_SECURE_STORAGE_WRITE_FAILED",
                "Secure storage write failed",
            )
            return
        }
        responder?.success()
    }
}
