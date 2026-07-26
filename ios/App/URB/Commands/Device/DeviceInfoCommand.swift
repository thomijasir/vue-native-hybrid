import Foundation
import UIKit

final class UrbDeviceInfoCommand: UrbCommand {
    let name = "device:info"

    func handle(request: UrbRequest, responder: UrbResponder) {
        let info = Bundle.main.infoDictionary ?? [:]
        #if DEBUG
            let buildType = "debug"
        #else
            let buildType = "release"
        #endif
        responder.success([
            "platform": "ios",
            "osName": UIDevice.current.systemName,
            "osVersion": UIDevice.current.systemVersion,
            "model": UIDevice.current.model,
            "appId": Bundle.main.bundleIdentifier ?? "",
            "appVersionName": info["CFBundleShortVersionString"] as? String ?? "",
            "appVersionCode": Int((info["CFBundleVersion"] as? String) ?? "0") ?? 0,
            "buildType": buildType,
            "locale": Locale.current.identifier,
            "timeZone": TimeZone.current.identifier,
            "deviceName": UIDevice.current.name
        ])
    }
}

