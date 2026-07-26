import Foundation
import UIKit

final class UrbClipboardGetTextCommand: UrbCommand {
    let name = "clipboard:getText"

    func handle(request: UrbRequest, responder: UrbResponder) {
        responder.success(["text": UIPasteboard.general.string ?? ""])
    }
}

final class UrbClipboardSetTextCommand: UrbCommand {
    let name = "clipboard:setText"

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard let payload = request.payload,
              let text = payload["text"] as? String else {
            responder.error(code: "URB_INVALID_CLIPBOARD_PAYLOAD", message: "Clipboard setText payload requires text")
            return
        }

        UIPasteboard.general.string = text
        responder.success()
    }
}
