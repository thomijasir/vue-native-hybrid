package com.example.mywebview.urb.core

import org.json.JSONObject

data class UrbRequest(
    val id: String?,
    val type: String,
    val name: String,
    val payload: JSONObject?,
)
