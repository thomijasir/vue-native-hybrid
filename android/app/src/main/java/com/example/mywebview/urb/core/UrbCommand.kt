package com.example.mywebview.urb.core

interface UrbCommand {
    val name: String
    val expectsResponse: Boolean

    fun handle(request: UrbRequest, responder: UrbResponder?)
}
