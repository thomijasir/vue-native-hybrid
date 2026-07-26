import Foundation
import UniformTypeIdentifiers

enum UrbMime {
    static func mimeToType(_ mime: String) -> UTType? {
        if mime == "*/*" { return .data }
        if let type = UTType(mimeType: mime) { return type }
        return nil
    }

    static func urlMime(_ url: URL) -> String {
        if let type = UTType(filenameExtension: url.pathExtension),
           let mime = type.preferredMIMEType {
            return mime
        }
        return "application/octet-stream"
    }
}

