import Foundation

final class UrbWebSocketOpenCommand: UrbCommand {
    let name = "websocket:open"
    private let manager: UrbWebSocketManager

    init(manager: UrbWebSocketManager) {
        self.manager = manager
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard let payload = request.payload else {
            responder.error(code: "WEBSOCKET_INVALID_PAYLOAD", message: "WebSocket open payload is required")
            return
        }

        do {
            let socketId = try manager.open(payload: payload)
            responder.success(["socketId": socketId])
        } catch {
            responder.error(code: "WEBSOCKET_INVALID_PAYLOAD", message: error.localizedDescription)
        }
    }
}

final class UrbWebSocketSendCommand: UrbCommand {
    let name = "websocket:send"
    private let manager: UrbWebSocketManager

    init(manager: UrbWebSocketManager) {
        self.manager = manager
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard let payload = request.payload else {
            responder.error(code: "WEBSOCKET_INVALID_PAYLOAD", message: "WebSocket send payload is required")
            return
        }

        manager.send(payload: payload) { result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    responder.success()
                case .failure(let error):
                    responder.error(code: "WEBSOCKET_SEND_FAILED", message: error.localizedDescription)
                }
            }
        }
    }
}

final class UrbWebSocketCloseCommand: UrbCommand {
    let name = "websocket:close"
    private let manager: UrbWebSocketManager

    init(manager: UrbWebSocketManager) {
        self.manager = manager
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard let payload = request.payload else {
            responder.error(code: "WEBSOCKET_INVALID_PAYLOAD", message: "WebSocket close payload is required")
            return
        }

        do {
            try manager.close(payload: payload)
            responder.success()
        } catch {
            responder.error(code: "WEBSOCKET_CLOSE_FAILED", message: error.localizedDescription)
        }
    }
}

final class UrbWebSocketManager: NSObject, URLSessionWebSocketDelegate {
    private let eventEmitter: UrbEventEmitter
    private let policy: UrbNativeNetworkPolicy
    private let queue = DispatchQueue(label: "urb.websocket.manager")
    private var sockets: [String: URLSessionWebSocketTask] = [:]
    private var socketIdsByTask: [Int: String] = [:]
    private lazy var session: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpShouldSetCookies = false
        configuration.httpCookieStorage = nil
        configuration.timeoutIntervalForRequest = 30
        return URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
    }()

    init(eventEmitter: UrbEventEmitter, policy: UrbNativeNetworkPolicy) {
        self.eventEmitter = eventEmitter
        self.policy = policy
    }

    func open(payload: [String: Any]) throws -> String {
        guard let rawURL = payload["url"] as? String, !rawURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw UrbCommandError("WebSocket URL is required")
        }
        let url = try policy.requireWebSocketURL(rawURL)
        guard let socketId = payload["socketId"] as? String, !socketId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw UrbCommandError("WebSocket socketId is required")
        }

        var request = URLRequest(url: url)
        if let headers = payload["headers"] as? [[String]] {
            for pair in headers where pair.count >= 2 {
                try policy.requireHeader(pair[0])
                request.addValue(pair[1], forHTTPHeaderField: pair[0])
            }
        }
        if let protocols = payload["protocols"] as? [String] {
            let value = protocols.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }.joined(separator: ", ")
            if !value.isEmpty, request.value(forHTTPHeaderField: "Sec-WebSocket-Protocol") == nil {
                request.addValue(value, forHTTPHeaderField: "Sec-WebSocket-Protocol")
            }
        }

        let task = session.webSocketTask(with: request)
        let inserted = queue.sync { () -> Bool in
            guard sockets[socketId] == nil else { return false }
            sockets[socketId] = task
            socketIdsByTask[task.taskIdentifier] = socketId
            return true
        }
        guard inserted else {
            task.cancel()
            throw UrbCommandError("WebSocket socketId already exists")
        }

        task.resume()
        return socketId
    }

    func send(payload: [String: Any], completion: @escaping (Result<Void, Error>) -> Void) {
        guard let socketId = payload["socketId"] as? String,
              let task = task(for: socketId) else {
            completion(.failure(UrbCommandError("Unknown WebSocket")))
            return
        }
        guard let body = payload["body"] as? [String: Any],
              let kind = body["kind"] as? String else {
            completion(.failure(UrbCommandError("WebSocket send body is required")))
            return
        }

        let message: URLSessionWebSocketTask.Message
        switch kind {
        case "text":
            let value = body["value"] as? String ?? ""
            guard Data(value.utf8).count <= policy.maxBodyBytes else {
                completion(.failure(UrbCommandError("WebSocket message is too large")))
                return
            }
            message = .string(value)
        case "base64":
            guard let value = body["value"] as? String,
                  let data = Data(base64Encoded: value) else {
                completion(.failure(UrbCommandError("WebSocket binary body is invalid")))
                return
            }
            guard data.count <= policy.maxBodyBytes else {
                completion(.failure(UrbCommandError("WebSocket message is too large")))
                return
            }
            message = .data(data)
        default:
            completion(.failure(UrbCommandError("Unsupported WebSocket send body")))
            return
        }

        task.send(message) { error in
            if let error {
                completion(.failure(error))
            } else {
                completion(.success(()))
            }
        }
    }

    func close(payload: [String: Any]) throws {
        guard let socketId = payload["socketId"] as? String,
              let task = task(for: socketId) else {
            throw UrbCommandError("Unknown WebSocket")
        }

        let code = payload["code"] as? Int ?? 1000
        guard code == 1000 || (3000...4999).contains(code) else {
            throw UrbCommandError("WebSocket rejected the close request")
        }
        let reason = payload["reason"] as? String ?? ""
        guard Data(reason.utf8).count <= policy.maxBodyBytes else {
            throw UrbCommandError("WebSocket close reason is too large")
        }

        task.cancel(with: URLSessionWebSocketTask.CloseCode(rawValue: code) ?? .normalClosure, reason: Data(reason.utf8))
        remove(socketId: socketId)
    }

    func closeAll(reason: String) {
        let active = queue.sync { sockets }
        for (_, task) in active {
            task.cancel(with: .normalClosure, reason: Data(reason.utf8))
        }
        queue.sync {
            sockets.removeAll()
            socketIdsByTask.removeAll()
        }
        session.invalidateAndCancel()
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        guard let socketId = socketId(for: webSocketTask) else { return }
        eventEmitter.emitRaw([
            "channel": "websocket",
            "socketId": socketId,
            "type": "open",
            "protocol": `protocol` ?? ""
        ])
        receiveNext(on: webSocketTask, socketId: socketId)
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        guard let socketId = socketId(for: webSocketTask) else { return }
        remove(socketId: socketId)
        eventEmitter.emitRaw([
            "channel": "websocket",
            "socketId": socketId,
            "type": "close",
            "code": closeCode.rawValue,
            "reason": reason.flatMap { String(data: $0, encoding: .utf8) } ?? ""
        ])
    }

    private func receiveNext(on task: URLSessionWebSocketTask, socketId: String) {
        task.receive { [weak self, weak task] result in
            guard let self, let task else { return }
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self.eventEmitter.emitRaw([
                        "channel": "websocket",
                        "socketId": socketId,
                        "type": "message",
                        "data": text,
                        "binary": false
                    ])
                case .data(let data):
                    self.eventEmitter.emitRaw([
                        "channel": "websocket",
                        "socketId": socketId,
                        "type": "message",
                        "dataBase64": data.base64EncodedString(),
                        "binary": true
                    ])
                @unknown default:
                    break
                }
                if self.task(for: socketId) != nil {
                    self.receiveNext(on: task, socketId: socketId)
                }
            case .failure(let error):
                self.remove(socketId: socketId)
                self.eventEmitter.emitRaw([
                    "channel": "websocket",
                    "socketId": socketId,
                    "type": "error",
                    "message": error.localizedDescription
                ])
                self.eventEmitter.emitRaw([
                    "channel": "websocket",
                    "socketId": socketId,
                    "type": "close",
                    "code": 1006,
                    "reason": error.localizedDescription
                ])
            }
        }
    }

    private func task(for socketId: String) -> URLSessionWebSocketTask? {
        queue.sync { sockets[socketId] }
    }

    private func socketId(for task: URLSessionWebSocketTask) -> String? {
        queue.sync { socketIdsByTask[task.taskIdentifier] }
    }

    private func remove(socketId: String) {
        queue.sync {
            if let task = sockets.removeValue(forKey: socketId) {
                socketIdsByTask.removeValue(forKey: task.taskIdentifier)
            }
        }
    }
}

struct UrbCommandError: LocalizedError {
    let message: String
    init(_ message: String) { self.message = message }
    var errorDescription: String? { message }
}
