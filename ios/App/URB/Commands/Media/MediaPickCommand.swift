import Foundation
import PhotosUI
import UniformTypeIdentifiers
import WebKit

final class UrbMediaPickCommand: NSObject, UrbCommand, PHPickerViewControllerDelegate {
    let name = "media:pick"
    private weak var webView: WKWebView?
    private let resourceStore: UrbResourceStore
    private var pending: UrbResponder?
    private var multiple = false
    private var maxItems = 1

    init(webView: WKWebView, resourceStore: UrbResourceStore) {
        self.webView = webView
        self.resourceStore = resourceStore
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard pending == nil else {
            responder.error(code: "MEDIA_PICKER_BUSY", message: "Media picker is busy")
            return
        }
        let payload = request.payload ?? [:]
        multiple = (payload["multiple"] as? Bool) ?? false
        maxItems = min(20, max(1, (payload["maxItems"] as? Int) ?? 10))
        let type = (payload["type"] as? String) ?? "imageAndVideo"

        var filter: PHPickerFilter = .any(of: [.images, .videos])
        if type == "image" { filter = .images }
        if type == "video" { filter = .videos }

        var config = PHPickerConfiguration(photoLibrary: .shared())
        config.filter = filter
        config.selectionLimit = multiple ? maxItems : 1

        guard let presenter = UrbPresent.from(webView: webView) else {
            responder.error(code: "MEDIA_PICKER_OPEN_FAILED", message: "Unable to open media picker")
            return
        }
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = self
        pending = responder
        presenter.present(picker, animated: true)
    }

    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        guard let responder = pending else { return }
        pending = nil
        if results.isEmpty {
            responder.error(code: "MEDIA_PICKER_CANCELLED", message: "Media pick cancelled")
            return
        }
        let limited = Array(results.prefix(maxItems))
        let createdAt = ISO8601DateFormatter().string(from: Date())
        let group = DispatchGroup()
        let resultQueue = DispatchQueue(label: "urb.media.pick.results")
        var items: [[String: Any]] = []
        var failed = false
        func recordFailure() {
            resultQueue.sync { failed = true }
        }
        func recordItem(_ item: [String: Any]) {
            resultQueue.sync { items.append(item) }
        }

        for result in limited {
            group.enter()
            let provider = result.itemProvider
            if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                provider.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { data, _ in
                    defer { group.leave() }
                    guard let data else { recordFailure(); return }
                    let fileName = "urb-media-\(UUID().uuidString).jpg"
                    let url = self.resourceStore.register(data: data, fileName: fileName, mimeType: "image/jpeg", createdAt: createdAt)
                    recordItem(["resourceUrl": url.absoluteString, "fileName": fileName, "mimeType": "image/jpeg", "size": data.count, "createdAt": createdAt])
                }
            } else if provider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) {
                provider.loadFileRepresentation(forTypeIdentifier: UTType.movie.identifier) { url, _ in
                    defer { group.leave() }
                    guard let url else { recordFailure(); return }
                    let fileName = "urb-media-\(UUID().uuidString).mp4"
                    guard let out = self.resourceStore.registerFile(copying: url, fileName: fileName, mimeType: "video/mp4", createdAt: createdAt) else {
                        recordFailure()
                        return
                    }
                    recordItem(["resourceUrl": out.url.absoluteString, "fileName": fileName, "mimeType": "video/mp4", "size": out.size, "createdAt": createdAt])
                }
            } else {
                group.leave()
            }
        }

        group.notify(queue: .main) {
            let snapshot = resultQueue.sync { (failed, items) }
            if snapshot.0 || snapshot.1.isEmpty {
                responder.error(code: "MEDIA_PICKER_UNREADABLE_URI", message: "Unable to read selected media")
                return
            }
            responder.success(["items": snapshot.1])
        }
    }
}
