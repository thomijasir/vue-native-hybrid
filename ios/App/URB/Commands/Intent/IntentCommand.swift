import Foundation
import UIKit
import WebKit

final class UrbIntentOpenCommand: NSObject, UrbCommand {
    let name = "intent:open"
    let expectsResponse = false
    private weak var webView: WKWebView?

    init(webView: WKWebView) {
        self.webView = webView
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard let target = UrbIntentTarget(payload: request.payload) else {
            responder.error(code: "INTENT_INVALID_TARGET", message: "Intent target is invalid")
            return
        }

        switch target {
        case .appSettings:
            guard let url = URL(string: UIApplication.openSettingsURLString) else {
                responder.error(code: "INTENT_LAUNCH_FAILED", message: "Unable to open app settings")
                return
            }
            UIApplication.shared.open(url) { success in
                if !success {
                    responder.error(code: "INTENT_LAUNCH_FAILED", message: "Unable to open app settings")
                }
            }
        case .shareSheet:
            guard let presenter = UrbPresent.from(webView: webView) else {
                responder.error(code: "INTENT_LAUNCH_FAILED", message: "Unable to present native intent")
                return
            }
            guard let items = UrbShareSheet.items(from: request.payload), !items.isEmpty else {
                responder.error(code: "INTENT_INVALID_PAYLOAD", message: "Share sheet requires text or url extras")
                return
            }
            UrbShareSheet.present(items: items, from: presenter, completion: nil)
        }
    }
}

final class UrbIntentOpenForResultCommand: NSObject, UrbCommand {
    let name = "intent:openForResult"
    private weak var webView: WKWebView?
    private var pending: UrbResponder?

    init(webView: WKWebView) {
        self.webView = webView
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard pending == nil else {
            responder.error(code: "INTENT_BUSY", message: "A native intent is already running")
            return
        }
        guard let target = UrbIntentTarget(payload: request.payload) else {
            responder.error(code: "INTENT_INVALID_TARGET", message: "Intent target is invalid")
            return
        }

        switch target {
        case .appSettings:
            responder.error(code: "INTENT_TARGET_UNSUPPORTED_MODE", message: "Intent target does not support result mode")
        case .shareSheet:
            guard let presenter = UrbPresent.from(webView: webView) else {
                responder.error(code: "INTENT_LAUNCH_FAILED", message: "Unable to present native intent")
                return
            }
            guard let items = UrbShareSheet.items(from: request.payload), !items.isEmpty else {
                responder.error(code: "INTENT_INVALID_PAYLOAD", message: "Share sheet requires text or url extras")
                return
            }

            pending = responder
            UrbShareSheet.present(items: items, from: presenter) { [weak self] completed, activityType in
                guard let self, let pending = self.pending else { return }
                self.pending = nil

                if completed {
                    var extras: [String: Any] = [:]
                    if let activityType {
                        extras["activityType"] = activityType.rawValue
                    }
                    pending.success(["resultCode": "ok", "extras": extras])
                } else {
                    pending.success(["resultCode": "cancelled", "extras": [:]])
                }
            }
        }
    }
}

private enum UrbIntentTarget {
    case appSettings
    case shareSheet

    init?(payload: [String: Any]?) {
        guard let target = payload?["target"] as? String else { return nil }
        switch target {
        case "appSettings":
            self = .appSettings
        case "shareSheet":
            self = .shareSheet
        default:
            return nil
        }
    }
}

private enum UrbShareSheet {
    static func items(from payload: [String: Any]?) -> [Any]? {
        guard let extras = payload?["extras"] as? [String: Any] else { return nil }
        var items: [Any] = []

        if let text = extras["text"] as? String, !text.isEmpty {
            items.append(text)
        }
        if let rawURL = extras["url"] as? String,
           let url = URL(string: rawURL),
           let scheme = url.scheme?.lowercased(),
           scheme == "http" || scheme == "https" {
            items.append(url)
        }

        return items
    }

    static func present(
        items: [Any],
        from presenter: UIViewController,
        completion: ((Bool, UIActivity.ActivityType?) -> Void)?
    ) {
        let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
        controller.popoverPresentationController?.sourceView = presenter.view
        controller.completionWithItemsHandler = { activityType, completed, _, _ in
            completion?(completed, activityType)
        }
        presenter.present(controller, animated: true)
    }
}
