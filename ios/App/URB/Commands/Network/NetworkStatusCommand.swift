import Foundation
import Network

final class UrbNetworkStatusMonitor {
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "urb.network.monitor")
    private let eventEmitter: UrbEventEmitter
    private var started = false

    init(eventEmitter: UrbEventEmitter) {
        self.eventEmitter = eventEmitter
    }

    func startIfNeeded() {
        guard !started else { return }
        started = true
        monitor.pathUpdateHandler = { [weak self] path in
            guard let self else { return }
            self.eventEmitter.emit(name: "network:statusChange", payload: self.status(path: path))
        }
        monitor.start(queue: queue)
    }

    func current() -> [String: Any] {
        status(path: monitor.currentPath)
    }

    func cancel() {
        monitor.cancel()
    }

    private func status(path: NWPath) -> [String: Any] {
        let connected = path.status == .satisfied
        let type: String
        if !connected { type = "none" }
        else if path.usesInterfaceType(.wifi) { type = "wifi" }
        else if path.usesInterfaceType(.cellular) { type = "cellular" }
        else if path.usesInterfaceType(.wiredEthernet) { type = "ethernet" }
        else if path.usesInterfaceType(.other) { type = "vpn" }
        else { type = "unknown" }
        return ["connected": connected, "type": type, "expensive": path.isExpensive]
    }
}

final class UrbNetworkStatusCommand: UrbCommand {
    let name = "network:getStatus"
    private let monitor: UrbNetworkStatusMonitor
    init(monitor: UrbNetworkStatusMonitor) {
        self.monitor = monitor
        self.monitor.startIfNeeded()
    }
    func handle(request: UrbRequest, responder: UrbResponder) {
        responder.success(monitor.current())
    }
}
