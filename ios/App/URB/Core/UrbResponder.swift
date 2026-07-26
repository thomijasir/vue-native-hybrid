import Foundation

final class UrbResponder {
    private let id: String
    private var completed = false
    private let lock = NSLock()
    private let onComplete: ([String: Any]) -> Void

    init(id: String, onComplete: @escaping ([String: Any]) -> Void) {
        self.id = id
        self.onComplete = onComplete
    }

    func success(_ result: Any = [String: Any]()) {
        let response: [String: Any]
        lock.lock()
        if completed {
            lock.unlock()
            return
        }
        completed = true
        response = ["id": id, "ok": true, "result": result]
        lock.unlock()
        onComplete(response)
    }

    func error(code: String, message: String) {
        let response: [String: Any]
        lock.lock()
        if completed {
            lock.unlock()
            return
        }
        completed = true
        response = [
            "id": id,
            "ok": false,
            "error": ["code": code, "message": message]
        ]
        lock.unlock()
        onComplete(response)
    }
}
