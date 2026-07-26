package com.example.mywebview.urb.core

import org.json.JSONObject
import java.util.concurrent.atomic.AtomicBoolean

class UrbResponder(
    private val id: String,
    private val onComplete: (String, JSONObject) -> Unit,
) {
    private val completed = AtomicBoolean(false)

    fun success(result: Any = JSONObject()) {
        complete(
            JSONObject()
                .put("id", id)
                .put("ok", true)
                .put("result", result),
        )
    }

    fun error(code: String, message: String) {
        complete(
            JSONObject()
                .put("id", id)
                .put("ok", false)
                .put(
                    "error",
                    JSONObject()
                        .put("code", code)
                        .put("message", message),
                ),
        )
    }

    private fun complete(response: JSONObject) {
        if (completed.compareAndSet(false, true)) {
            onComplete(id, response)
        }
    }
}
