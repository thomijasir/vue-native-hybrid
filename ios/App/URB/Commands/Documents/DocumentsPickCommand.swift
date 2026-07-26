import Foundation
import UIKit
import UniformTypeIdentifiers
import WebKit

final class UrbDocumentPickCommand: NSObject, UrbCommand, UIDocumentPickerDelegate {
    let name = "document:pick"
    private weak var webView: WKWebView?
    private let resourceStore: UrbResourceStore
    private var pending: UrbResponder?
    private var maxItems = 1

    init(webView: WKWebView, resourceStore: UrbResourceStore) {
        self.webView = webView
        self.resourceStore = resourceStore
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard pending == nil else {
            responder.error(code: "DOCUMENT_PICKER_BUSY", message: "Document picker is busy")
            return
        }
        let payload = request.payload ?? [:]
        let multiple = (payload["multiple"] as? Bool) ?? false
        maxItems = min(20, max(1, (payload["maxItems"] as? Int) ?? 10))
        let mimeTypes = payload["mimeTypes"] as? [String] ?? ["*/*"]
        let types = mimeTypes.compactMap { UrbMime.mimeToType($0) }
        guard let presenter = UrbPresent.from(webView: webView) else {
            responder.error(code: "DOCUMENT_PICKER_OPEN_FAILED", message: "Unable to open document picker")
            return
        }
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: types.isEmpty ? [UTType.data] : types)
        picker.allowsMultipleSelection = multiple
        picker.delegate = self
        pending = responder
        presenter.present(picker, animated: true)
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        controller.dismiss(animated: true)
        pending?.error(code: "DOCUMENT_PICKER_CANCELLED", message: "Document pick cancelled")
        pending = nil
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        controller.dismiss(animated: true)
        guard let responder = pending else { return }
        pending = nil
        if urls.isEmpty {
            responder.error(code: "DOCUMENT_PICKER_CANCELLED", message: "Document pick cancelled")
            return
        }
        let createdAt = ISO8601DateFormatter().string(from: Date())
        var items: [[String: Any]] = []
        for url in urls.prefix(maxItems) {
            let access = url.startAccessingSecurityScopedResource()
            defer { if access { url.stopAccessingSecurityScopedResource() } }
            let mime = UrbMime.urlMime(url)
            let fileName = url.lastPathComponent.isEmpty ? "urb-file" : url.lastPathComponent
            guard let out = resourceStore.registerFile(copying: url, fileName: fileName, mimeType: mime, createdAt: createdAt) else { continue }
            items.append(["resourceUrl": out.url.absoluteString, "fileName": fileName, "mimeType": mime, "size": out.size, "createdAt": createdAt])
        }
        if items.isEmpty {
            responder.error(code: "DOCUMENT_PICKER_UNREADABLE_URI", message: "Unable to read selected file")
            return
        }
        responder.success(["items": items])
    }
}
