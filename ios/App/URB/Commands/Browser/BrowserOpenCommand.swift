import Foundation
import SafariServices
import UIKit
import WebKit

final class UrbBrowserOpenCommand: NSObject, UrbCommand, SFSafariViewControllerDelegate {
    let name = "browser:open"
    let expectsResponse = false
    private weak var webView: WKWebView?

    init(webView: WKWebView) {
        self.webView = webView
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard let payload = request.payload,
              let rawURL = payload["url"] as? String,
              !rawURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            responder.error(code: "BROWSER_INVALID_PAYLOAD", message: "Browser open requires a url payload")
            return
        }
        guard let url = Self.allowedURL(rawURL) else {
            responder.error(code: "BROWSER_URL_INVALID", message: "Browser open requires an http or https URL")
            return
        }

        let mode = (payload["mode"] as? String) ?? "external"
        if mode == "inApp", let presenter = UrbPresent.from(webView: webView) {
            let safari = SFSafariViewController(url: url)
            safari.delegate = self
            presenter.present(safari, animated: true)
            return
        }

        UIApplication.shared.open(url) { success in
            if !success {
                responder.error(code: "BROWSER_OPEN_FAILED", message: "Unable to open URL")
            }
        }
    }

    private static func allowedURL(_ raw: String) -> URL? {
        guard let components = URLComponents(string: raw.trimmingCharacters(in: .whitespacesAndNewlines)),
              let scheme = components.scheme?.lowercased(),
              (scheme == "http" || scheme == "https"),
              let host = components.host,
              !host.isEmpty,
              let url = components.url else { return nil }
        return url
    }
}
