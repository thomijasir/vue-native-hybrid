import Foundation

final class UrbFetchCommand: UrbCommand {
    let name = "fetch"
    private let policy: UrbNativeNetworkPolicy
    private let session: URLSession

    init(policy: UrbNativeNetworkPolicy) {
        self.policy = policy
        let config = URLSessionConfiguration.ephemeral
        config.httpShouldSetCookies = false
        config.httpCookieStorage = nil
        self.session = URLSession(configuration: config)
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard let payload = request.payload else {
            responder.error(code: "FETCH_INVALID_PAYLOAD", message: "Fetch payload is required")
            return
        }
        do {
            let req = try build(payload)
            session.dataTask(with: req) { data, response, error in
                if let error {
                    DispatchQueue.main.async { responder.error(code: "FETCH_NETWORK_ERROR", message: error.localizedDescription) }
                    return
                }
                guard let http = response as? HTTPURLResponse else {
                    DispatchQueue.main.async { responder.error(code: "FETCH_NETWORK_ERROR", message: "Invalid response") }
                    return
                }
                let data = data ?? Data()
                if data.count > self.policy.maxBodyBytes {
                    DispatchQueue.main.async { responder.error(code: "FETCH_RESPONSE_TOO_LARGE", message: "Native fetch response is too large") }
                    return
                }
                let headers = http.allHeaderFields.compactMap { key, value -> [String]? in
                    guard let key = key as? String else { return nil }
                    return [key, "\(value)"]
                }
                DispatchQueue.main.async {
                    responder.success([
                        "status": http.statusCode,
                        "statusText": HTTPURLResponse.localizedString(forStatusCode: http.statusCode),
                        "headers": headers,
                        "bodyBase64": data.base64EncodedString(),
                        "url": http.url?.absoluteString ?? req.url?.absoluteString ?? ""
                    ])
                }
            }.resume()
        } catch {
            responder.error(code: "FETCH_INVALID_PAYLOAD", message: error.localizedDescription)
        }
    }

    private func build(_ payload: [String: Any]) throws -> URLRequest {
        let url = try policy.requireURL(payload["url"] as? String ?? "")
        var req = URLRequest(url: url)
        req.httpMethod = (payload["method"] as? String ?? "GET").uppercased()
        req.timeoutInterval = 45

        if let headers = payload["headers"] as? [[String]] {
            for pair in headers where pair.count >= 2 {
                try policy.requireHeader(pair[0])
                req.setValue(pair[1], forHTTPHeaderField: pair[0])
            }
        }
        if let body = payload["body"] as? [String: Any],
           let kind = body["kind"] as? String {
            switch kind {
            case "empty":
                break
            case "text":
                let value = body["value"] as? String ?? ""
                let data = Data(value.utf8)
                if data.count > policy.maxBodyBytes { throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native network payload is too large"]) }
                req.httpBody = data
            case "base64":
                let raw = body["value"] as? String ?? ""
                guard let data = Data(base64Encoded: raw) else {
                    throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native network payload is invalid base64"])
                }
                if data.count > policy.maxBodyBytes { throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native network payload is too large"]) }
                if req.value(forHTTPHeaderField: "Content-Type") == nil,
                   let mimeType = body["mimeType"] as? String,
                   !mimeType.isEmpty {
                    req.setValue(mimeType, forHTTPHeaderField: "Content-Type")
                }
                req.httpBody = data
            case "multipart":
                let multipart = try buildMultipart(body)
                if multipart.data.count > policy.maxBodyBytes { throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native network payload is too large"]) }
                req.setValue("multipart/form-data; boundary=\(multipart.boundary)", forHTTPHeaderField: "Content-Type")
                req.httpBody = multipart.data
            default:
                throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "Unsupported fetch body kind: \(kind)"])
            }
        }
        return req
    }

    private func buildMultipart(_ body: [String: Any]) throws -> (boundary: String, data: Data) {
        let boundary = "urb-\(UUID().uuidString)"
        var data = Data()
        let lineBreak = "\r\n"
        guard let parts = body["parts"] as? [[String: Any]] else {
            return (boundary, data)
        }

        for part in parts {
            guard let kind = part["kind"] as? String,
                  let name = part["name"] as? String else { continue }
            data.appendString("--\(boundary)\(lineBreak)")
            if kind == "text" {
                data.appendString("Content-Disposition: form-data; name=\"\(escapeMultipart(name))\"\(lineBreak)\(lineBreak)")
                data.appendString(part["value"] as? String ?? "")
                data.appendString(lineBreak)
            } else if kind == "file" {
                guard let raw = part["bodyBase64"] as? String,
                      let fileData = Data(base64Encoded: raw) else {
                    throw NSError(domain: "urb", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native multipart file body is invalid base64"])
                }
                let fileName = escapeMultipart(part["fileName"] as? String ?? "file")
                let mimeType = part["mimeType"] as? String ?? "application/octet-stream"
                data.appendString("Content-Disposition: form-data; name=\"\(escapeMultipart(name))\"; filename=\"\(fileName)\"\(lineBreak)")
                data.appendString("Content-Type: \(mimeType)\(lineBreak)\(lineBreak)")
                data.append(fileData)
                data.appendString(lineBreak)
            }
        }
        data.appendString("--\(boundary)--\(lineBreak)")
        return (boundary, data)
    }

    private func escapeMultipart(_ value: String) -> String {
        value.replacingOccurrences(of: "\"", with: "%22")
            .replacingOccurrences(of: "\r", with: "")
            .replacingOccurrences(of: "\n", with: "")
    }
}

private extension Data {
    mutating func appendString(_ value: String) {
        append(Data(value.utf8))
    }
}
