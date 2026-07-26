import Foundation

final class UrbCommandRegistry {
    private var commands: [String: UrbCommand] = [:]

    @discardableResult
    func register(_ command: UrbCommand) -> UrbCommandRegistry {
        commands[command.name] = command
        return self
    }

    func find(_ name: String) -> UrbCommand? {
        commands[name]
    }
}
