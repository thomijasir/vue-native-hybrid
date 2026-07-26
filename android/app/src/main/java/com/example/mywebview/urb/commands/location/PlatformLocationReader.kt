package com.example.mywebview.urb.commands.location

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.example.mywebview.R
import com.example.mywebview.urb.core.UrbStringProvider
import java.util.concurrent.Executor
import java.util.function.Consumer

class PlatformLocationReader(
    private val activity: AppCompatActivity,
    private val strings: UrbStringProvider,
) {
    private val locationManager =
        activity.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    private val mainHandler = Handler(Looper.getMainLooper())
    private var pendingCancellationSignal: CancellationSignal? = null
    private var pendingListener: LocationListener? = null
    private var pendingTimeout: Runnable? = null

    fun hasPermission(accuracy: LocationAccuracy): Boolean {
        val fineGranted = hasAndroidPermission(Manifest.permission.ACCESS_FINE_LOCATION)
        val coarseGranted = hasAndroidPermission(Manifest.permission.ACCESS_COARSE_LOCATION)

        return when (accuracy) {
            LocationAccuracy.FINE -> fineGranted
            LocationAccuracy.COARSE -> fineGranted || coarseGranted
        }
    }

    @SuppressLint("MissingPermission")
    fun currentLocation(
        options: LocationRequestOptions,
        callback: (Result<UrbNativeLocation>) -> Unit,
    ) {
        val provider = bestProvider(options.accuracy)
        if (provider == null) {
            callback(lastKnown(options.accuracy)?.let { Result.success(it) }
                ?: Result.failure(IllegalStateException(strings.get(R.string.urb_location_provider_unavailable))))
            return
        }

        var completed = false
        fun complete(result: Result<UrbNativeLocation>) {
            if (completed) return
            completed = true
            clearPending()
            callback(result)
        }

        val timeoutRunnable = Runnable {
            complete(
                lastKnown(options.accuracy)?.let { Result.success(it) }
                    ?: Result.failure(IllegalStateException(strings.get(R.string.urb_location_timeout))),
            )
        }

        cancelPending()
        pendingTimeout = timeoutRunnable
        mainHandler.postDelayed(timeoutRunnable, options.timeoutMs)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val cancellationSignal = CancellationSignal()
            pendingCancellationSignal = cancellationSignal
            val executor = Executor { command -> mainHandler.post(command) }
            locationManager.getCurrentLocation(
                provider,
                cancellationSignal,
                executor,
                Consumer { location: Location? ->
                mainHandler.removeCallbacks(timeoutRunnable)
                if (location == null) {
                    complete(
                        lastKnown(options.accuracy)?.let { Result.success(it) }
                            ?: Result.failure(IllegalStateException(strings.get(R.string.urb_location_current_unavailable))),
                    )
                    return@Consumer
                }
                complete(Result.success(location.toNativeLocation()))
                },
            )
            mainHandler.postDelayed({ cancellationSignal.cancel() }, options.timeoutMs)
            return
        }

        val listener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                mainHandler.removeCallbacks(timeoutRunnable)
                locationManager.removeUpdates(this)
                complete(Result.success(location.toNativeLocation()))
            }

            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit
            override fun onProviderEnabled(provider: String) = Unit
            override fun onProviderDisabled(provider: String) = Unit
        }

        pendingListener = listener
        @Suppress("DEPRECATION")
        locationManager.requestSingleUpdate(provider, listener, Looper.getMainLooper())
    }

    fun cancelPending() {
        pendingTimeout?.let { timeout ->
            mainHandler.removeCallbacks(timeout)
        }
        pendingTimeout = null
        pendingCancellationSignal?.cancel()
        pendingCancellationSignal = null
        pendingListener?.let { listener ->
            locationManager.removeUpdates(listener)
        }
        pendingListener = null
    }

    private fun clearPending() {
        pendingTimeout?.let { timeout ->
            mainHandler.removeCallbacks(timeout)
        }
        pendingTimeout = null
        pendingCancellationSignal = null
        pendingListener = null
    }

    @SuppressLint("MissingPermission")
    private fun lastKnown(accuracy: LocationAccuracy): UrbNativeLocation? {
        return providersFor(accuracy)
            .mapNotNull { provider ->
                runCatching {
                    locationManager.getLastKnownLocation(provider)?.toNativeLocation()
                }.getOrNull()
            }
            .maxByOrNull { it.timeMillis }
    }

    private fun bestProvider(accuracy: LocationAccuracy): String? {
        return providersFor(accuracy).firstOrNull { provider ->
            locationManager.isProviderEnabled(provider)
        }
    }

    private fun providersFor(accuracy: LocationAccuracy): List<String> {
        return when (accuracy) {
            LocationAccuracy.FINE -> listOf(
                LocationManager.GPS_PROVIDER,
                LocationManager.NETWORK_PROVIDER,
                LocationManager.PASSIVE_PROVIDER,
            )
            LocationAccuracy.COARSE -> listOf(
                LocationManager.NETWORK_PROVIDER,
                LocationManager.PASSIVE_PROVIDER,
            )
        }
    }

    private fun hasAndroidPermission(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(activity, permission) ==
            PackageManager.PERMISSION_GRANTED
    }
}
