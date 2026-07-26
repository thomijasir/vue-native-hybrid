package com.example.mywebview.urb.commands.permissions

import androidx.activity.result.ActivityResultLauncher
import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import com.example.mywebview.urb.core.UrbStringProvider

class PermissionsRequestCommand(
    private val reporter: PermissionReporter,
    private val launcher: ActivityResultLauncher<Array<String>>,
    private val strings: UrbStringProvider,
) : UrbCommand {
    override val name = "permissions:request"
    override val expectsResponse = true

    private var pendingRequest: PendingPermissionRequest? = null

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder ?: return

        if (pendingRequest != null) {
            responder.error("PERMISSIONS_BUSY", strings.get(R.string.urb_permission_request_busy))
            return
        }

        val names = reporter.parseNames(request, allowMissingNames = false)
        if (names == null || names.isEmpty()) {
            responder.error("PERMISSIONS_INVALID_PAYLOAD", strings.get(R.string.urb_permission_request_requires_names))
            return
        }

        val permissions = reporter.requestableAndroidPermissions(names)
        if (permissions.isEmpty()) {
            responder.success(reporter.statesFor(names))
            return
        }

        pendingRequest = PendingPermissionRequest(names, responder)

        try {
            launcher.launch(permissions.toTypedArray())
        } catch (error: RuntimeException) {
            pendingRequest = null
            responder.error(
                "PERMISSIONS_REQUEST_FAILED",
                error.message ?: strings.get(R.string.urb_permission_request_failed),
            )
        }
    }

    fun onPermissionsResult(result: Map<String, Boolean>) {
        val request = pendingRequest ?: return
        pendingRequest = null
        request.responder.success(reporter.statesFor(request.names))
    }

    private data class PendingPermissionRequest(
        val names: List<String>,
        val responder: UrbResponder,
    )
}
