import Foundation
import WebKit

final class UrbBridge: NSObject, WKScriptMessageHandler {
    private weak var webView: WKWebView?
    private let userContentController: WKUserContentController
    private let registry = UrbCommandRegistry()
    private let eventEmitter: UrbEventEmitter
    private var activeRequestIds = Set<String>()
    private var timeouts: [String: DispatchWorkItem] = [:]
    private let queue = DispatchQueue.main
    private let webSocketManager: UrbWebSocketManager
    private let networkStatus: UrbNetworkStatusMonitor

    init(webView: WKWebView, userContentController: WKUserContentController, resourceStore: UrbResourceStore) {
        self.webView = webView
        self.userContentController = userContentController
        self.eventEmitter = UrbEventEmitter(webView: webView)
        self.networkStatus = UrbNetworkStatusMonitor(eventEmitter: eventEmitter)
        self.webSocketManager = UrbWebSocketManager(
            eventEmitter: eventEmitter,
            policy: UrbNativeNetworkPolicy(
                allowedHosts: Self.allowedHosts(),
                allowCleartext: Self.allowCleartext()
            )
        )
        super.init()

        let permissions = UrbPermissionsManager()
        let secureStorage = UrbSecureStorage()
        let fetchPolicy = UrbNativeNetworkPolicy(
            allowedHosts: Self.allowedHosts(),
            allowCleartext: Self.allowCleartext()
        )

        registry.register(UrbCameraCaptureCommand(webView: webView, resourceStore: resourceStore))
        registry.register(UrbMediaPickCommand(webView: webView, resourceStore: resourceStore))
        registry.register(UrbDocumentPickCommand(webView: webView, resourceStore: resourceStore))
        registry.register(UrbLocationCurrentCommand())
        registry.register(UrbLocationPickCommand(webView: webView))
        registry.register(UrbPermissionsGetCommand(permissions: permissions))
        registry.register(UrbPermissionsRequestCommand(permissions: permissions))
        registry.register(UrbBrowserOpenCommand(webView: webView))
        registry.register(UrbClipboardGetTextCommand())
        registry.register(UrbClipboardSetTextCommand())
        registry.register(UrbDeviceInfoCommand())
        registry.register(UrbIntentOpenCommand(webView: webView))
        registry.register(UrbIntentOpenForResultCommand(webView: webView))
        registry.register(UrbSecureStorageSetCommand(storage: secureStorage))
        registry.register(UrbSecureStorageGetCommand(storage: secureStorage))
        registry.register(UrbSecureStorageDeleteCommand(storage: secureStorage))
        registry.register(UrbSecureStorageClearCommand(storage: secureStorage))
        registry.register(UrbBiometricsAvailabilityCommand())
        registry.register(UrbBiometricsAuthenticateCommand())
        registry.register(UrbNetworkStatusCommand(monitor: networkStatus))
        _ = registry.register(UrbFetchCommand(policy: fetchPolicy))
            .register(UrbWebSocketOpenCommand(manager: webSocketManager))
            .register(UrbWebSocketSendCommand(manager: webSocketManager))
            .register(UrbWebSocketCloseCommand(manager: webSocketManager))

        installJavascriptBridge()
        userContentController.add(self, name: UrbConstants.bridgeName)
    }

    deinit {
        timeouts.values.forEach { $0.cancel() }
        timeouts.removeAll()
        activeRequestIds.removeAll()
        networkStatus.cancel()
        webSocketManager.closeAll(reason: "Bridge destroyed")
        userContentController.removeScriptMessageHandler(forName: UrbConstants.bridgeName)
    }

    private static func allowCleartext() -> Bool {
#if DEBUG
        return true
#else
        return false
#endif
    }

    private static func allowedHosts() -> Set<String> {
#if DEBUG
        return ["jsonplaceholder.typicode.com", "example.com", "example.test"]
#else
        return []
#endif
    }

    static func isTrustedAppURL(_ url: URL?) -> Bool {
        guard let url, let scheme = url.scheme?.lowercased() else { return false }
        if scheme == "file" || scheme == UrbConstants.resourceScheme { return true }
#if DEBUG
        if scheme == "http", url.host?.lowercased() == "localhost", url.port == 8080 { return true }
#endif
        return false
    }

    private func installJavascriptBridge() {
        let script = "window.urbNative = { postMessage: function(message) { window.webkit.messageHandlers.\(UrbConstants.bridgeName).postMessage(message); } };"
        userContentController.addUserScript(
            WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == UrbConstants.bridgeName else { return }
        guard message.frameInfo.isMainFrame else { return }
        guard isTrustedFrame(message.frameInfo) else { return }
        guard let body = message.body as? String else { return }
        guard let data = body.data(using: .utf8),
              let raw = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }

        let request = UrbRequest(
            id: raw["id"] as? String,
            type: raw["type"] as? String ?? "",
            name: raw["name"] as? String ?? "",
            payload: raw["payload"] as? [String: Any]
        )
        runOnMain { [weak self] in
            self?.handle(request)
        }
    }

    private func handle(_ request: UrbRequest) {
        guard let command = registry.find(request.name) else {
            if let id = request.id, !id.isEmpty {
                send(["id": id, "ok": false, "error": ["code": "URB_UNKNOWN_COMMAND", "message": "Unknown URB command"]])
            } else if request.type == "fire" {
                emitCommandError(command: request.name, code: "URB_UNKNOWN_COMMAND", message: "Unknown URB command")
            }
            return
        }

        if request.type == "fire" {
            guard !command.expectsResponse else {
                emitCommandError(command: request.name, code: "URB_INVALID_COMMAND_MODE", message: "Command does not support fire mode")
                return
            }
            let responder = UrbResponder(id: "") { [weak self] response in
                self?.runOnMain { [weak self] in
                    guard let self else { return }
                    guard response["ok"] as? Bool == false,
                          let error = response["error"] as? [String: Any],
                          let code = error["code"] as? String,
                          let message = error["message"] as? String else { return }
                    self.emitCommandError(command: request.name, code: code, message: message)
                }
            }
            command.handle(request: request, responder: responder)
            return
        }

        guard request.type == "send" else {
            if let id = request.id, !id.isEmpty {
                send(["id": id, "ok": false, "error": ["code": "URB_INVALID_TYPE", "message": "Invalid URB request type"]])
            }
            return
        }
        guard let id = request.id, !id.isEmpty else { return }
        guard command.expectsResponse else {
            send(["id": id, "ok": false, "error": ["code": "URB_INVALID_COMMAND_MODE", "message": "Command does not return a response"]])
            return
        }
        guard !activeRequestIds.contains(id) else {
            send(["id": id, "ok": false, "error": ["code": "URB_DUPLICATE_REQUEST", "message": "Duplicate URB request id"]])
            return
        }

        activeRequestIds.insert(id)
        let timeout = DispatchWorkItem { [weak self] in
            guard let self else { return }
            guard self.activeRequestIds.remove(id) != nil else { return }
            self.timeouts.removeValue(forKey: id)
            self.send(["id": id, "ok": false, "error": ["code": "URB_REQUEST_TIMEOUT", "message": "Native command timed out"]])
        }
        timeouts[id] = timeout
        queue.asyncAfter(deadline: .now() + UrbConstants.requestTimeoutSeconds, execute: timeout)

        let responder = UrbResponder(id: id) { [weak self] response in
            self?.runOnMain { [weak self] in
                guard let self else { return }
                guard self.activeRequestIds.remove(id) != nil else { return }
                self.timeouts.removeValue(forKey: id)?.cancel()
                self.send(response)
            }
        }
        command.handle(request: request, responder: responder)
    }

    private func send(_ response: [String: Any]) {
        guard Thread.isMainThread else {
            runOnMain { [weak self] in
                self?.send(response)
            }
            return
        }
        guard let webView else { return }
        guard let data = try? JSONSerialization.data(withJSONObject: response),
              let raw = String(data: data, encoding: .utf8) else { return }
        guard let argument = Self.javascriptStringLiteral(raw) else { return }
        webView.evaluateJavaScript("window.__urbReceive && window.__urbReceive(\(argument));")
    }

    private func emitCommandError(command: String, code: String, message: String) {
        eventEmitter.emit(
            name: "command:error",
            payload: ["command": command, "code": code, "message": message]
        )
    }

    private func runOnMain(_ work: @escaping () -> Void) {
        if Thread.isMainThread {
            work()
        } else {
            queue.async(execute: work)
        }
    }

    private func isTrustedFrame(_ frame: WKFrameInfo) -> Bool {
        let origin = frame.securityOrigin
        let scheme = origin.protocol.lowercased()
        if scheme == "file" { return true }
        let port = origin.port == 0 ? "" : ":\(origin.port)"
        let value = "\(scheme)://\(origin.host.lowercased())\(port)"
#if DEBUG
        if value == "http://localhost:8080" { return true }
#endif
        return false
    }

    static func javascriptStringLiteral(_ value: String) -> String? {
        guard let data = try? JSONSerialization.data(withJSONObject: [value]),
              var raw = String(data: data, encoding: .utf8) else { return nil }
        raw.removeFirst()
        raw.removeLast()
        return raw
    }
}
