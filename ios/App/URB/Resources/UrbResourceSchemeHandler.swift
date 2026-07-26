import Foundation
import WebKit

final class UrbResourceSchemeHandler: NSObject, WKURLSchemeHandler {
    private let resourceStore: UrbResourceStore

    init(resourceStore: UrbResourceStore) {
        self.resourceStore = resourceStore
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: any WKURLSchemeTask) {
        if urlSchemeTask.request.httpMethod?.uppercased() == "OPTIONS" {
            let response = HTTPURLResponse(
                url: urlSchemeTask.request.url ?? URL(string: "urb-resource://invalid")!,
                statusCode: 204,
                httpVersion: nil,
                headerFields: Self.responseHeaders(contentType: nil, fileName: nil)
            )!
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didFinish()
            return
        }

        guard let host = urlSchemeTask.request.url?.host,
              let resource = resourceStore.consume(token: host),
              let url = urlSchemeTask.request.url else {
            let response = HTTPURLResponse(
                url: urlSchemeTask.request.url ?? URL(string: "urb-resource://invalid")!,
                statusCode: 404,
                httpVersion: nil,
                headerFields: Self.responseHeaders(contentType: nil, fileName: nil)
            )!
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didFinish()
            return
        }

        let response = HTTPURLResponse(
            url: url,
            statusCode: 200,
            httpVersion: nil,
            headerFields: Self.responseHeaders(contentType: resource.mimeType, fileName: resource.fileName)
        )!
        let data: Data
        if let inlineData = resource.data {
            data = inlineData
        } else if let fileURL = resource.fileURL, let fileData = try? Data(contentsOf: fileURL) {
            data = fileData
            try? FileManager.default.removeItem(at: fileURL)
        } else {
            let response = HTTPURLResponse(
                url: url,
                statusCode: 404,
                httpVersion: nil,
                headerFields: Self.responseHeaders(contentType: nil, fileName: nil)
            )!
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didFinish()
            return
        }
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: any WKURLSchemeTask) {}

    private static func responseHeaders(contentType: String?, fileName: String?) -> [String: String] {
        var headers = [
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Range",
            "Cache-Control": "no-store"
        ]
        if let contentType {
            headers["Content-Type"] = contentType
        }
        if let fileName {
            headers["Content-Disposition"] = "inline; filename=\"\(fileName)\""
        }
        return headers
    }
}
