package com.example.mywebview.urb.commands.permissions

import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider

class PermissionsGetCommand(
    private val reporter: PermissionReporter,
    private val strings: UrbStringProvider,
) : UrbCommand {
    override val name = "permissions:get"
    override val expectsResponse = true

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder ?: return
        val names = reporter.parseNames(request, allowMissingNames = true)
            ?: return responder.error("PERMISSIONS_INVALID_PAYLOAD", strings.get(R.string.urb_permission_payload_invalid))

        responder.success(reporter.statesFor(names))
    }
}
