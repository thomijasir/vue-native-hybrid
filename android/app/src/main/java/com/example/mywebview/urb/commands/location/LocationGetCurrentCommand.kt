package com.example.mywebview.urb.commands.location

import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider

class LocationGetCurrentCommand(
    private val locationReader: PlatformLocationReader,
    private val strings: UrbStringProvider,
) : UrbCommand {
    override val name = "location:current"
    override val expectsResponse = true

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder ?: return
        val options = LocationRequestOptions.from(request)

        if (!locationReader.hasPermission(options.accuracy)) {
            responder.error("LOCATION_PERMISSION_DENIED", strings.get(R.string.urb_location_permission_denied))
            return
        }

        locationReader.currentLocation(options) { result ->
            result
                .onSuccess { location ->
                    responder.success(location.toJson())
                }
                .onFailure { error ->
                    responder.error(
                        "LOCATION_UNAVAILABLE",
                        error.message ?: strings.get(R.string.urb_location_read_failed),
                    )
                }
        }
    }
}
