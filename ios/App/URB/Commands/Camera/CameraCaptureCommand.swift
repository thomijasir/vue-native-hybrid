import Foundation
import AVFoundation
import PhotosUI
import UIKit
import WebKit

final class UrbCameraCaptureCommand: NSObject, UrbCommand, UIImagePickerControllerDelegate, UINavigationControllerDelegate, PHPickerViewControllerDelegate {
    let name = "camera:capture"
    private weak var webView: WKWebView?
    private let resourceStore: UrbResourceStore
    private var pending: UrbResponder?
    private var createdAt: String = ""
    private var compression: Any?

    init(webView: WKWebView, resourceStore: UrbResourceStore) {
        self.webView = webView
        self.resourceStore = resourceStore
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        if pending != nil {
            responder.error(code: "CAMERA_BUSY", message: "Camera is busy")
            return
        }
        guard UIImagePickerController.isSourceTypeAvailable(.camera) else {
#if targetEnvironment(simulator)
            openSimulatorPhotoFallback(request: request, responder: responder)
            return
#else
            responder.error(code: "CAMERA_UNAVAILABLE", message: "Camera unavailable")
            return
#endif
        }
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        if status == .denied || status == .restricted {
            responder.error(code: "CAMERA_PERMISSION_DENIED", message: "Camera permission denied")
            return
        }

        let start: () -> Void = { [weak self] in
            guard let self else { return }
            guard let presenter = UrbPresent.from(webView: self.webView) else {
                responder.error(code: "CAMERA_OPEN_FAILED", message: "Unable to open camera")
                return
            }
            self.pending = responder
            self.createdAt = ISO8601DateFormatter().string(from: Date())
            self.compression = request.payload?["compression"]
            let picker = UIImagePickerController()
            picker.sourceType = .camera
            picker.mediaTypes = ["public.image"]
            picker.delegate = self
            presenter.present(picker, animated: true)
        }

        if status == .notDetermined {
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    if granted { start() } else { responder.error(code: "CAMERA_PERMISSION_DENIED", message: "Camera permission denied") }
                }
            }
            return
        }
        start()
    }

    private func openSimulatorPhotoFallback(request: UrbRequest, responder: UrbResponder) {
        guard let presenter = UrbPresent.from(webView: webView) else {
            responder.error(code: "CAMERA_OPEN_FAILED", message: "Unable to open camera")
            return
        }
        pending = responder
        createdAt = ISO8601DateFormatter().string(from: Date())
        compression = request.payload?["compression"]

        var config = PHPickerConfiguration(photoLibrary: .shared())
        config.filter = .images
        config.selectionLimit = 1

        let picker = PHPickerViewController(configuration: config)
        picker.delegate = self
        presenter.present(picker, animated: true)
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
        pending?.error(code: "CAMERA_CANCELLED", message: "Camera cancelled")
        pending = nil
    }

    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
        defer {
            picker.dismiss(animated: true)
            pending = nil
        }
        guard let image = info[.originalImage] as? UIImage else {
            pending?.error(code: "CAMERA_UNREADABLE_IMAGE", message: "Unable to read camera image")
            return
        }
        guard let data = jpegData(from: image), data.count <= 20 * 1024 * 1024 else {
            pending?.error(code: "CAMERA_UNREADABLE_IMAGE", message: "Image too large")
            return
        }
        completeCapture(with: data)
    }

    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        guard let responder = pending else { return }
        pending = nil

        guard let provider = results.first?.itemProvider else {
            responder.error(code: "CAMERA_CANCELLED", message: "Camera cancelled")
            return
        }

        provider.loadObject(ofClass: UIImage.self) { [weak self] object, _ in
            guard let self else { return }
            guard let image = object as? UIImage,
                  let data = self.jpegData(from: image),
                  data.count <= 20 * 1024 * 1024 else {
                responder.error(code: "CAMERA_UNREADABLE_IMAGE", message: "Unable to read camera image")
                return
            }
            responder.success(self.captureResultPayload(data: data))
        }
    }

    private func completeCapture(with data: Data) {
        pending?.success(captureResultPayload(data: data))
    }

    private func captureResultPayload(data: Data) -> [String: Any] {
        let fileName = "urb-camera-\(Int(Date().timeIntervalSince1970)).jpg"
        let url = resourceStore.register(data: data, fileName: fileName, mimeType: "image/jpeg", createdAt: createdAt)
        return [
            "resourceUrl": url.absoluteString,
            "fileName": fileName,
            "mimeType": "image/jpeg",
            "size": data.count,
            "createdAt": createdAt
        ]
    }

    private func jpegData(from image: UIImage) -> Data? {
        let options = compressionOptions()
        let outputImage = resizedImage(image, maxWidth: options.maxWidth, maxHeight: options.maxHeight)
        return outputImage.jpegData(compressionQuality: options.quality)
    }

    private func compressionOptions() -> (quality: CGFloat, maxWidth: CGFloat?, maxHeight: CGFloat?) {
        guard let compression else {
            return (0.92, nil, nil)
        }
        if let enabled = compression as? Bool, enabled == false {
            return (0.92, nil, nil)
        }

        guard let options = compression as? [String: Any] else {
            return (0.82, 1920, 1920)
        }

        let quality = (options["quality"] as? NSNumber).map {
            let raw = CGFloat(truncating: $0)
            return max(0.0, min(1.0, raw > 1 ? raw / 100 : raw))
        } ?? 0.82
        let maxWidth = (options["maxWidth"] as? NSNumber).map { max(1, CGFloat(truncating: $0)) }
        let maxHeight = (options["maxHeight"] as? NSNumber).map { max(1, CGFloat(truncating: $0)) }

        return (quality, maxWidth, maxHeight)
    }

    private func resizedImage(_ image: UIImage, maxWidth: CGFloat?, maxHeight: CGFloat?) -> UIImage {
        guard let maxWidth, let maxHeight else { return image }
        let widthRatio = maxWidth / image.size.width
        let heightRatio = maxHeight / image.size.height
        let ratio = min(1, widthRatio, heightRatio)
        guard ratio < 1 else { return image }

        let size = CGSize(width: image.size.width * ratio, height: image.size.height * ratio)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }
}
