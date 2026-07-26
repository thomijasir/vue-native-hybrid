import Foundation

protocol UrbCommand: AnyObject {
    var name: String { get }
    var expectsResponse: Bool { get }
    func handle(request: UrbRequest, responder: UrbResponder)
}

extension UrbCommand {
    var expectsResponse: Bool { true }
}
