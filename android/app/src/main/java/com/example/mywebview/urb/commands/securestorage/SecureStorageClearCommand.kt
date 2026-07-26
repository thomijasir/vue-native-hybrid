package com.example.mywebview.urb.commands.securestorage

import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder

class SecureStorageClearCommand(
    private val storage: SecureStorage,
) : UrbCommand {
    override val name = "secureStorage:clear"
    override val expectsResponse = true

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        if (!storage.clear()) {
            responder?.error(
                "URB_SECURE_STORAGE_WRITE_FAILED",
                "Secure storage clear failed",
            )
            return
        }
        responder?.success()
    }
}
