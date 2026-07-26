import Foundation

final class UrbSecureStorage {
    private let service = "urb_secure_storage"

    func set(key: String, value: String) -> Bool {
        let data = value.data(using: .utf8) ?? Data()
        let query = baseQuery(key: key)
        let update: [String: Any] = [kSecValueData as String: data]
        let updateStatus = SecItemUpdate(query as CFDictionary, update as CFDictionary)
        if updateStatus == errSecSuccess { return true }
        guard updateStatus == errSecItemNotFound else { return false }

        var attrs = query
        attrs[kSecValueData as String] = data
        attrs[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        return SecItemAdd(attrs as CFDictionary, nil) == errSecSuccess
    }

    func get(key: String) -> String? {
        var query = baseQuery(key: key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func delete(key: String) -> Bool {
        let query = baseQuery(key: key)
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }

    func clear() -> Bool {
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service]
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }

    private func baseQuery(key: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
    }
}

func requireStorageKey(_ request: UrbRequest, responder: UrbResponder) -> String? {
    guard let key = request.payload?["key"] as? String, !key.isEmpty else {
        responder.error(code: "URB_INVALID_SECURE_STORAGE_PAYLOAD", message: "Secure storage payload requires key")
        return nil
    }
    return key
}

final class UrbSecureStorageSetCommand: UrbCommand {
    let name = "secureStorage:set"
    private let storage: UrbSecureStorage
    init(storage: UrbSecureStorage) { self.storage = storage }
    func handle(request: UrbRequest, responder: UrbResponder) {
        guard let key = requireStorageKey(request, responder: responder),
              let value = request.payload?["value"] as? String else {
            responder.error(code: "URB_INVALID_SECURE_STORAGE_PAYLOAD", message: "Secure storage set payload requires value")
            return
        }
        if storage.set(key: key, value: value) { responder.success() } else { responder.error(code: "URB_SECURE_STORAGE_WRITE_FAILED", message: "Secure storage write failed") }
    }
}

final class UrbSecureStorageGetCommand: UrbCommand {
    let name = "secureStorage:get"
    private let storage: UrbSecureStorage
    init(storage: UrbSecureStorage) { self.storage = storage }
    func handle(request: UrbRequest, responder: UrbResponder) {
        guard let key = requireStorageKey(request, responder: responder) else { return }
        let value: Any = storage.get(key: key) ?? NSNull()
        responder.success(["value": value])
    }
}

final class UrbSecureStorageDeleteCommand: UrbCommand {
    let name = "secureStorage:delete"
    private let storage: UrbSecureStorage
    init(storage: UrbSecureStorage) { self.storage = storage }
    func handle(request: UrbRequest, responder: UrbResponder) {
        guard let key = requireStorageKey(request, responder: responder) else { return }
        if storage.delete(key: key) { responder.success() } else { responder.error(code: "URB_SECURE_STORAGE_WRITE_FAILED", message: "Secure storage delete failed") }
    }
}

final class UrbSecureStorageClearCommand: UrbCommand {
    let name = "secureStorage:clear"
    private let storage: UrbSecureStorage
    init(storage: UrbSecureStorage) { self.storage = storage }
    func handle(request: UrbRequest, responder: UrbResponder) {
        if storage.clear() { responder.success() } else { responder.error(code: "URB_SECURE_STORAGE_WRITE_FAILED", message: "Secure storage clear failed") }
    }
}
