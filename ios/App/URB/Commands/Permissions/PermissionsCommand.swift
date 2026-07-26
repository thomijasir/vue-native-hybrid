import Foundation
import AVFoundation
import Contacts
import CoreLocation
import PhotosUI
import UserNotifications

final class UrbPermissionsManager {
    private let catalog = ["camera", "microphone", "contacts", "phone", "location:coarse", "location:fine", "notifications", "photos", "nearby:bluetooth", "nearby:wifi"]
    private let locationManager = CLLocationManager()

    func allNames() -> [String] { catalog }

    func states(for names: [String], completion: @escaping ([[String: Any]]) -> Void) {
        let group = DispatchGroup()
        var result: [[String: Any]] = []
        for name in names {
            group.enter()
            state(for: name) { state in
                result.append(state)
                group.leave()
            }
        }
        group.notify(queue: .main) {
            completion(result)
        }
    }

    private func state(for name: String, completion: @escaping ([String: Any]) -> Void) {
        func done(status: String, granted: Bool) {
            completion(["name": name, "status": status, "granted": granted, "shouldShowRationale": false, "androidPermissions": [] as [String]])
        }
        switch name {
        case "camera":
            let s = AVCaptureDevice.authorizationStatus(for: .video)
            done(status: permissionStatus(s), granted: s == .authorized)
        case "microphone":
            let status: String
            if #available(iOS 17.0, *) {
                switch AVAudioApplication.shared.recordPermission {
                case .granted: status = "granted"
                case .denied: status = "denied"
                case .undetermined: status = "prompt"
                @unknown default: status = "denied"
                }
            } else {
                switch AVAudioSession.sharedInstance().recordPermission {
                case .granted: status = "granted"
                case .denied: status = "denied"
                case .undetermined: status = "prompt"
                @unknown default: status = "denied"
                }
            }
            done(status: status, granted: status == "granted")
        case "contacts":
            let s = CNContactStore.authorizationStatus(for: .contacts)
            let status: String
            switch s {
            case .authorized: status = "granted"
            case .limited: status = "limited"
            case .notDetermined: status = "prompt"
            case .restricted: status = "restricted"
            case .denied: status = "denied"
            @unknown default: status = "denied"
            }
            done(status: status, granted: status == "granted")
        case "location:coarse", "location:fine":
            let s = CLLocationManager().authorizationStatus
            let granted = s == .authorizedWhenInUse || s == .authorizedAlways
            let status: String
            switch s {
            case .authorizedAlways, .authorizedWhenInUse: status = "granted"
            case .notDetermined: status = "prompt"
            case .restricted: status = "restricted"
            case .denied: status = "denied"
            @unknown default: status = "denied"
            }
            done(status: status, granted: granted)
        case "notifications":
            UNUserNotificationCenter.current().getNotificationSettings { settings in
                let granted = settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
                let status: String
                switch settings.authorizationStatus {
                case .authorized, .provisional, .ephemeral: status = "granted"
                case .notDetermined: status = "prompt"
                case .denied: status = "denied"
                @unknown default: status = "denied"
                }
                DispatchQueue.main.async { done(status: status, granted: granted) }
            }
        case "photos":
            let s = PHPhotoLibrary.authorizationStatus(for: .readWrite)
            let granted = s == .authorized || s == .limited
            let status: String
            switch s {
            case .authorized: status = "granted"
            case .limited: status = "limited"
            case .notDetermined: status = "prompt"
            case .restricted: status = "restricted"
            case .denied: status = "denied"
            @unknown default: status = "denied"
            }
            done(status: status, granted: granted)
        default:
            done(status: "notRequired", granted: true)
        }
    }

    private func permissionStatus(_ status: AVAuthorizationStatus) -> String {
        switch status {
        case .authorized: return "granted"
        case .notDetermined: return "prompt"
        case .restricted: return "restricted"
        case .denied: return "denied"
        @unknown default: return "denied"
        }
    }

    func request(names: [String], completion: @escaping () -> Void) {
        let group = DispatchGroup()
        for name in names {
            switch name {
            case "camera":
                group.enter()
                AVCaptureDevice.requestAccess(for: .video) { _ in group.leave() }
            case "microphone":
                group.enter()
                if #available(iOS 17.0, *) {
                    AVAudioApplication.requestRecordPermission { _ in group.leave() }
                } else {
                    AVAudioSession.sharedInstance().requestRecordPermission { _ in group.leave() }
                }
            case "contacts":
                group.enter()
                CNContactStore().requestAccess(for: .contacts) { _, _ in group.leave() }
            case "location:coarse", "location:fine":
                locationManager.requestWhenInUseAuthorization()
            case "notifications":
                group.enter()
                UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in group.leave() }
            case "photos":
                group.enter()
                PHPhotoLibrary.requestAuthorization(for: .readWrite) { _ in group.leave() }
            default:
                break
            }
        }
        group.notify(queue: .main) { completion() }
    }
}

final class UrbPermissionsGetCommand: UrbCommand {
    let name = "permissions:get"
    private let permissions: UrbPermissionsManager

    init(permissions: UrbPermissionsManager) {
        self.permissions = permissions
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        let names = (request.payload?["names"] as? [String]) ?? permissions.allNames()
        permissions.states(for: names) { states in
            responder.success(states)
        }
    }
}

final class UrbPermissionsRequestCommand: UrbCommand {
    let name = "permissions:request"
    private let permissions: UrbPermissionsManager

    init(permissions: UrbPermissionsManager) {
        self.permissions = permissions
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard let names = request.payload?["names"] as? [String], !names.isEmpty else {
            responder.error(code: "PERMISSIONS_INVALID_PAYLOAD", message: "Permission names are required")
            return
        }
        permissions.request(names: names) {
            self.permissions.states(for: names) { states in
                responder.success(states)
            }
        }
    }
}
