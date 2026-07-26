package com.example.mywebview.urb.commands.shared

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class NativeNetworkPolicyTest {
    @Test
    fun allowsHttpsToAllowlistedHost() {
        val policy = NativeNetworkPolicy(
            allowedHosts = setOf("api.example.test"),
            allowCleartext = false,
            maxBodyBytes = 1024,
        )

        assertEquals("api.example.test", policy.requireHttpUrl("https://api.example.test/users").host)
    }

    @Test
    fun rejectsNonAllowlistedHost() {
        val policy = NativeNetworkPolicy(
            allowedHosts = setOf("api.example.test"),
            allowCleartext = false,
            maxBodyBytes = 1024,
        )

        assertThrows(IllegalArgumentException::class.java) {
            policy.requireHttpUrl("https://evil.example.test/users")
        }
    }

    @Test
    fun rejectsCleartextWhenDisabled() {
        val policy = NativeNetworkPolicy(
            allowedHosts = setOf("api.example.test"),
            allowCleartext = false,
            maxBodyBytes = 1024,
        )

        assertThrows(IllegalArgumentException::class.java) {
            policy.requireHttpUrl("http://api.example.test/users")
        }
    }

    @Test
    fun rejectsUnsafeHeaders() {
        val policy = NativeNetworkPolicy(
            allowedHosts = setOf("api.example.test"),
            allowCleartext = false,
            maxBodyBytes = 1024,
        )

        assertThrows(IllegalArgumentException::class.java) {
            policy.requireHeaderAllowed("Host")
        }
    }

    @Test
    fun allowsWssToAllowlistedHost() {
        val policy = NativeNetworkPolicy(
            allowedHosts = setOf("socket.example.test"),
            allowCleartext = false,
            maxBodyBytes = 1024,
        )

        assertEquals("wss://socket.example.test/ws", policy.requireWebSocketUrl("wss://socket.example.test/ws"))
    }
}
