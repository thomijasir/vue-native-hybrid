import Foundation

final class UrbResourceStore {
    struct Resource {
        let data: Data?
        let fileURL: URL?
        let fileName: String
        let mimeType: String
        let createdAt: String
        let expiresAt: Date
        var consumed: Bool
    }

    struct RegisteredFile {
        let url: URL
        let size: Int
    }

    private var resources: [String: Resource] = [:]
    private let lock = NSLock()

    func register(data: Data, fileName: String, mimeType: String, createdAt: String) -> URL {
        lock.lock()
        defer { lock.unlock() }
        cleanupLocked()
        let token = UUID().uuidString.replacingOccurrences(of: "-", with: "")
        resources[token] = Resource(
            data: data,
            fileURL: nil,
            fileName: fileName,
            mimeType: mimeType,
            createdAt: createdAt,
            expiresAt: Date().addingTimeInterval(60),
            consumed: false
        )
        return URL(string: "\(UrbConstants.resourceScheme)://\(token)")!
    }

    func registerFile(copying sourceURL: URL, fileName: String, mimeType: String, createdAt: String) -> RegisteredFile? {
        lock.lock()
        defer { lock.unlock() }
        cleanupLocked()

        let token = UUID().uuidString.replacingOccurrences(of: "-", with: "")
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent("urb-resources", isDirectory: true)
        let destination = directory.appendingPathComponent(token).appendingPathExtension(sourceURL.pathExtension)

        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            if FileManager.default.fileExists(atPath: destination.path) {
                try FileManager.default.removeItem(at: destination)
            }
            try FileManager.default.copyItem(at: sourceURL, to: destination)
            let attrs = try FileManager.default.attributesOfItem(atPath: destination.path)
            let size = (attrs[.size] as? NSNumber)?.intValue ?? 0
            resources[token] = Resource(
                data: nil,
                fileURL: destination,
                fileName: fileName,
                mimeType: mimeType,
                createdAt: createdAt,
                expiresAt: Date().addingTimeInterval(60),
                consumed: false
            )
            return RegisteredFile(url: URL(string: "\(UrbConstants.resourceScheme)://\(token)")!, size: size)
        } catch {
            try? FileManager.default.removeItem(at: destination)
            return nil
        }
    }

    func consume(token: String) -> Resource? {
        lock.lock()
        defer { lock.unlock() }
        cleanupLocked()
        guard var resource = resources[token], !resource.consumed else { return nil }
        resource.consumed = true
        resources[token] = nil
        return resource
    }

    private func cleanupLocked() {
        let now = Date()
        let expired = resources.filter { $0.value.expiresAt <= now }
        for resource in expired.values {
            if let fileURL = resource.fileURL {
                try? FileManager.default.removeItem(at: fileURL)
            }
        }
        resources = resources.filter { $0.value.expiresAt > now }
    }
}
