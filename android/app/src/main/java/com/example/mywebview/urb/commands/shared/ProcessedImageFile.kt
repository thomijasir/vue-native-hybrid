package com.example.mywebview.urb.commands.shared

import java.io.File

data class ProcessedImageFile(
    val file: File,
    val fileName: String,
    val mimeType: String,
)
