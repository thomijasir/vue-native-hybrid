package com.example.mywebview.urb.commands.toast

import android.content.Context
import android.widget.Toast
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder

class ToastCommand(
    private val context: Context,
) : UrbCommand {
    override val name = "toast"
    override val expectsResponse = false

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        val text = request.payload?.optString("text")?.trim().orEmpty()
        if (text.isBlank()) return

        Toast.makeText(context, text, Toast.LENGTH_SHORT).show()
    }
}
