package com.example.mywebview.urb.commands.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import com.example.mywebview.urb.core.UrbCommand
import com.example.mywebview.urb.bridge.UrbEventEmitter
import com.example.mywebview.urb.core.UrbRequest
import com.example.mywebview.urb.core.UrbResponder
import org.json.JSONObject

class NetworkStatusCommand(
    context: Context,
    private val eventEmitter: UrbEventEmitter,
) : UrbCommand {
    override val name = "network:getStatus"
    override val expectsResponse = true
    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    private var registered = false
    private val callback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            emitStatus()
        }

        override fun onLost(network: Network) {
            emitStatus()
        }

        override fun onCapabilitiesChanged(
            network: Network,
            networkCapabilities: NetworkCapabilities,
        ) {
            emitStatus()
        }
    }

    fun register() {
        if (registered) return
        connectivityManager.registerDefaultNetworkCallback(callback)
        registered = true
        emitStatus()
    }

    fun unregister() {
        if (!registered) return
        connectivityManager.unregisterNetworkCallback(callback)
        registered = false
    }

    override fun handle(request: UrbRequest, responder: UrbResponder?) {
        responder?.success(currentStatus())
    }

    private fun emitStatus() {
        eventEmitter.emit(
            JSONObject()
                .put("channel", "urb")
                .put("name", "network:statusChange")
                .put("payload", currentStatus()),
        )
    }

    private fun currentStatus(): JSONObject {
        val network = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(network)
        val connected = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
        val type = when {
            !connected -> "none"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN) -> "vpn"
            else -> "unknown"
        }
        val expensive = capabilities
            ?.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED)
            ?.not()
            ?: false

        return JSONObject()
            .put("connected", connected)
            .put("type", type)
            .put("expensive", expensive)
    }
}
