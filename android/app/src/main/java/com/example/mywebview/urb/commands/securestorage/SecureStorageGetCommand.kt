package com.example.mywebview.urb.commands.securestorage

import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import org.json.JSONObject

class SecureStorageGetCommand(
    private val storage: SecureStorage,
) : UrbCommand {
    override val name = "secureStorage:get"
    override val expectsResponse = true

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        val key = requireSecureStorageKey(request, responder) ?: return
        val value = storage.get(key)
        responder?.success(
            JSONObject()
                .put("value", value ?: JSONObject.NULL),
        )
    }
}
