
import Foundation
import WebKit

final class UrbEventEmitter {
    private weak var webView: WKWebView?

    init(webView: WKWebView) {
        self.webView = webView
    }

    func emit(name: String, payload: [String: Any]) {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { [weak self] in
                self?.emit(name: name, payload: payload)
            }
            return
        }
        guard let webView else { return }
        let event: [String: Any] = ["channel": "urb", "name": name, "payload": payload]
        guard let data = try? JSONSerialization.data(withJSONObject: event),
              let raw = String(data: data, encoding: .utf8) else { return }
        guard let argument = UrbBridge.javascriptStringLiteral(raw) else { return }
        webView.evaluateJavaScript("window.__urbEvent && window.__urbEvent(\(argument));")
    }

    func emitRaw(_ event: [String: Any]) {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { [weak self] in
                self?.emitRaw(event)
            }
            return
        }
        guard let webView else { return }
        guard let data = try? JSONSerialization.data(withJSONObject: event),
              let raw = String(data: data, encoding: .utf8),
              let argument = UrbBridge.javascriptStringLiteral(raw) else { return }
        webView.evaluateJavaScript("window.__urbEvent && window.__urbEvent(\(argument));")
    }
}
