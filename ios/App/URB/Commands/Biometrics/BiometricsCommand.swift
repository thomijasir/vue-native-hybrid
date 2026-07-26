import Foundation
import LocalAuthentication

final class UrbBiometricsAvailabilityCommand: UrbCommand {
    let name = "biometrics:getAvailability"
    func handle(request: UrbRequest, responder: UrbResponder) {
        let ctx = LAContext()
        var err: NSError?
        let available = ctx.canEvaluatePolicy(.deviceOwnerAuthentication, error: &err)
        responder.success([
            "available": available,
            "enrolled": available,
            "supported": ctx.biometryType != .none || available,
            "reason": err?.localizedDescription as Any
        ])
    }
}

final class UrbBiometricsAuthenticateCommand: UrbCommand {
    let name = "biometrics:authenticate"
    func handle(request: UrbRequest, responder: UrbResponder) {
        let ctx = LAContext()
        var err: NSError?
        guard ctx.canEvaluatePolicy(.deviceOwnerAuthentication, error: &err) else {
            responder.error(code: "URB_BIOMETRICS_UNAVAILABLE", message: err?.localizedDescription ?? "Biometric authentication unavailable")
            return
        }
        let reason = (request.payload?["reason"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "Authenticate to continue"
        ctx.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { ok, error in
            DispatchQueue.main.async {
                if ok {
                    responder.success(["authenticated": true])
                } else {
                    responder.error(code: "URB_BIOMETRICS_AUTH_FAILED", message: error?.localizedDescription ?? "Biometric authentication failed")
                }
            }
        }
    }
}

