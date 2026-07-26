package com.example.mywebview.urb.core

import android.content.Context
import androidx.annotation.StringRes

class UrbStringProvider(
    private val context: Context,
) {
    fun get(@StringRes resourceId: Int, vararg formatArgs: Any): String {
        return context.getString(resourceId, *formatArgs)
    }
}
