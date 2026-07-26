package com.example.mywebview.urb.commands.securestorage

import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder

class SecureStorageDeleteCommand(
    private val storage: SecureStorage,
) : UrbCommand {
    override val name = "secureStorage:delete"
    override val expectsResponse = true

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        val key = requireSecureStorageKey(request, responder) ?: return
        if (!storage.delete(key)) {
            responder?.error(
                "URB_SECURE_STORAGE_WRITE_FAILED",
                "Secure storage delete failed",
            )
            return
        }
        responder?.success()
    }
}
