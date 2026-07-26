package com.example.mywebview.urb.core

class UrbCommandRegistry {
    private val commands = mutableMapOf<String, UrbCommand>()

    fun register(command: UrbCommand): UrbCommandRegistry {
        commands[command.name] = command
        return this
    }

    fun find(name: String): UrbCommand? = commands[name]
}
