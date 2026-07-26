package com.example.mywebview.urb.commands.biometrics

import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import org.json.JSONObject

private val BIOMETRIC_AUTHENTICATORS =
    BiometricManager.Authenticators.BIOMETRIC_STRONG or
        BiometricManager.Authenticators.DEVICE_CREDENTIAL

class BiometricsGetAvailabilityCommand(
    private val activity: FragmentActivity,
) : UrbCommand {
    override val name = "biometrics:getAvailability"
    override val expectsResponse = true

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        val status = BiometricManager.from(activity).canAuthenticate(BIOMETRIC_AUTHENTICATORS)
        val result = when (status) {
            BiometricManager.BIOMETRIC_SUCCESS -> availability(
                available = true,
                enrolled = true,
                supported = true,
            )
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> availability(
                available = false,
                enrolled = false,
                supported = true,
                reason = "No biometric credential is enrolled",
            )
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> availability(
                available = false,
                enrolled = false,
                supported = false,
                reason = "Biometric hardware is not available",
            )
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> availability(
                available = false,
                enrolled = false,
                supported = true,
                reason = "Biometric hardware is currently unavailable",
            )
            BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> availability(
                available = false,
                enrolled = false,
                supported = true,
                reason = "A security update is required before biometric authentication can be used",
            )
            BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED -> availability(
                available = false,
                enrolled = false,
                supported = false,
                reason = "Biometric authentication is not supported",
            )
            else -> availability(
                available = false,
                enrolled = false,
                supported = false,
                reason = "Biometric authentication status is unknown",
            )
        }

        responder?.success(result)
    }

    private fun availability(
        available: Boolean,
        enrolled: Boolean,
        supported: Boolean,
        reason: String? = null,
    ): JSONObject {
        val result = JSONObject()
            .put("available", available)
            .put("enrolled", enrolled)
            .put("supported", supported)
        if (reason != null) {
            result.put("reason", reason)
        }
        return result
    }
}

class BiometricsAuthenticateCommand(
    private val activity: FragmentActivity,
) : UrbCommand {
    override val name = "biometrics:authenticate"
    override val expectsResponse = true
    private var pendingPrompt: BiometricPrompt? = null
    private var pendingResponder: UrbResponder? = null

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder ?: return
        if (pendingResponder != null) {
            responder.error("URB_BIOMETRICS_BUSY", "Biometric authentication is already running")
            return
        }

        val status = BiometricManager.from(activity).canAuthenticate(BIOMETRIC_AUTHENTICATORS)
        if (status != BiometricManager.BIOMETRIC_SUCCESS) {
            responder.error(
                "URB_BIOMETRICS_UNAVAILABLE",
                "Biometric authentication is not available",
            )
            return
        }

        val reason = request.payload
            ?.optString("reason")
            ?.takeIf { it.isNotBlank() }
            ?: "Authenticate to continue"
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Authentication required")
            .setSubtitle(reason)
            .setAllowedAuthenticators(BIOMETRIC_AUTHENTICATORS)
            .build()
        val prompt = BiometricPrompt(
            activity,
            ContextCompat.getMainExecutor(activity),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(
                    result: BiometricPrompt.AuthenticationResult,
                ) {
                    clearPending()
                    responder.success(
                        JSONObject()
                            .put("authenticated", true),
                    )
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    clearPending()
                    responder.error("URB_BIOMETRICS_AUTH_FAILED", errString.toString())
                }

                override fun onAuthenticationFailed() {
                    // The prompt remains active after a non-matching biometric attempt.
                }
            },
        )

        pendingResponder = responder
        pendingPrompt = prompt
        try {
            prompt.authenticate(promptInfo)
        } catch (error: RuntimeException) {
            clearPending()
            responder.error(
                "URB_BIOMETRICS_AUTH_FAILED",
                error.message ?: "Biometric authentication failed",
            )
        }
    }

    fun cancelPending() {
        pendingPrompt?.cancelAuthentication()
        pendingPrompt = null
        pendingResponder = null
    }

    private fun clearPending() {
        pendingPrompt = null
        pendingResponder = null
    }
}
