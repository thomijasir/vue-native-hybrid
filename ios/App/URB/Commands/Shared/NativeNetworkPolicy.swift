import Foundation

final class UrbNativeNetworkPolicy {
    private let allowedHosts: Set<String>
    private let allowCleartext: Bool
    let maxBodyBytes: Int
    private let unsafeHeaders: Set<String> = ["connection","content-length","host","keep-alive","proxy-authenticate","proxy-authorization","te","trailer","transfer-encoding","upgrade"]

    init(allowedHosts: Set<String>, allowCleartext: Bool, maxBodyBytes: Int = UrbConstants.maxNativeNetworkBytes) {
        self.allowedHosts = Set(allowedHosts.map { $0.lowercased() })
        self.allowCleartext = allowCleartext
        self.maxBodyBytes = maxBodyBytes
    }

    func requireURL(_ raw: String) throws -> URL {
        guard let url = URL(string: raw), let scheme = url.scheme?.lowercased(), (scheme == "https" || scheme == "http") else {
            throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native fetch URL must be http or https"])
        }
        if scheme == "http" && !allowCleartext {
            throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native fetch requires HTTPS"])
        }
        let host = (url.host ?? "").lowercased()
        guard !host.isEmpty, allowedHosts.contains(host) else {
            throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native network host is not allowlisted"])
        }
        return url
    }

    func requireWebSocketURL(_ raw: String) throws -> URL {
        guard let url = URL(string: raw), let scheme = url.scheme?.lowercased(), (scheme == "wss" || scheme == "ws") else {
            throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "WebSocket URL must start with ws:// or wss://"])
        }
        if scheme == "ws" && !allowCleartext {
            throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native WebSocket requires WSS"])
        }
        let host = (url.host ?? "").lowercased()
        guard !host.isEmpty, allowedHosts.contains(host) else {
            throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native network host is not allowlisted"])
        }
        return url
    }

    func requireHeader(_ name: String) throws {
        if unsafeHeaders.contains(name.lowercased()) {
            throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native network header is not allowed: \(name)"])
        }
    }
}
