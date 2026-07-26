package com.example.mywebview.app.location

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.example.mywebview.R
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.GoogleMapOptions
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import kotlin.math.ln
import kotlin.math.max

class MapLocationPickerActivity : AppCompatActivity(), OnMapReadyCallback {
    private var selectedLocation = LatLng(0.0, 0.0)
    private var initialAccuracyMeters: Float? = null
    private var selectedMarker: Marker? = null
    private val mapContainerId = View.generateViewId()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        selectedLocation = LatLng(
            intent.getDoubleExtra(EXTRA_INITIAL_LATITUDE, 0.0),
            intent.getDoubleExtra(EXTRA_INITIAL_LONGITUDE, 0.0),
        )
        val accuracy = intent.getFloatExtra(EXTRA_INITIAL_ACCURACY_METERS, Float.NaN)
        initialAccuracyMeters = accuracy.takeIf { it.isFinite() }

        setContentView(createContentView())
        attachMapFragment()
    }

    private fun createContentView(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL

            addView(
                LinearLayout(context).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.CENTER_VERTICAL
                    setPadding(dp(16), dp(12), dp(16), dp(12))

                    addView(
                        Button(context).apply {
                            text = getString(R.string.map_picker_cancel)
                            setOnClickListener {
                                setResult(Activity.RESULT_CANCELED)
                                finish()
                            }
                        },
                        LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                        ),
                    )
                    addView(
                        TextView(context).apply {
                            text = getString(R.string.map_picker_title)
                            textSize = 18f
                            gravity = Gravity.CENTER
                            setTypeface(typeface, android.graphics.Typeface.BOLD)
                        },
                        LinearLayout.LayoutParams(
                            0,
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                            1f,
                        ),
                    )
                    addView(
                        Button(context).apply {
                            text = getString(R.string.map_picker_confirm)
                            setOnClickListener { confirmSelection() }
                        },
                        LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                        ),
                    )
                },
            )
            addView(
                FrameLayout(context).apply {
                    id = mapContainerId
                },
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    0,
                    1f,
                ),
            )
        }
    }

    override fun onMapReady(map: GoogleMap) {
        map.uiSettings.isMapToolbarEnabled = false
        map.uiSettings.isZoomControlsEnabled = true
        enableMyLocation(map)

        selectedMarker = map.addMarker(
            MarkerOptions()
                .position(selectedLocation)
                .title(getString(R.string.map_picker_selected_location))
                .draggable(true),
        )
        moveCameraToSelection(map)

        map.setOnMapClickListener { location ->
            updateSelection(location)
            selectedMarker?.showInfoWindow()
        }
        map.setOnMarkerDragListener(
            object : GoogleMap.OnMarkerDragListener {
                override fun onMarkerDragStart(marker: Marker) = Unit
                override fun onMarkerDrag(marker: Marker) = Unit

                override fun onMarkerDragEnd(marker: Marker) {
                    updateSelection(marker.position)
                    marker.showInfoWindow()
                }
            },
        )
    }

    private fun attachMapFragment() {
        val fragment = SupportMapFragment.newInstance(
            GoogleMapOptions().mapToolbarEnabled(false),
        )
        supportFragmentManager
            .beginTransaction()
            .replace(mapContainerId, fragment)
            .commit()
        fragment.getMapAsync(this)
    }

    private fun enableMyLocation(map: GoogleMap) {
        try {
            map.isMyLocationEnabled = true
        } catch (_: SecurityException) {
            // Permission is checked before launching the picker; keep the map usable if it changes.
        }
    }

    private fun moveCameraToSelection(map: GoogleMap) {
        map.moveCamera(
            CameraUpdateFactory.newLatLngZoom(
                selectedLocation,
                zoomForAccuracy(initialAccuracyMeters),
            ),
        )
        selectedMarker?.showInfoWindow()
    }

    private fun updateSelection(location: LatLng) {
        selectedLocation = location
        selectedMarker?.position = location
    }

    private fun confirmSelection() {
        setResult(
            Activity.RESULT_OK,
            Intent()
                .putExtra(EXTRA_LATITUDE, selectedLocation.latitude)
                .putExtra(EXTRA_LONGITUDE, selectedLocation.longitude),
        )
        finish()
    }

    private fun zoomForAccuracy(accuracyMeters: Float?): Float {
        val radiusMeters = max(500.0, (accuracyMeters ?: 1_000f).toDouble() * 4)
        return (16 - ln(radiusMeters / 500.0) / ln(2.0)).coerceIn(3.0, 18.0).toFloat()
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }

    companion object {
        const val EXTRA_INITIAL_LATITUDE = "com.example.mywebview.extra.INITIAL_LATITUDE"
        const val EXTRA_INITIAL_LONGITUDE = "com.example.mywebview.extra.INITIAL_LONGITUDE"
        const val EXTRA_INITIAL_ACCURACY_METERS = "com.example.mywebview.extra.INITIAL_ACCURACY_METERS"
        const val EXTRA_LATITUDE = "com.example.mywebview.extra.LATITUDE"
        const val EXTRA_LONGITUDE = "com.example.mywebview.extra.LONGITUDE"

        fun intent(
            context: Context,
            latitude: Double,
            longitude: Double,
            accuracyMeters: Float?,
        ): Intent {
            return Intent(context, MapLocationPickerActivity::class.java)
                .putExtra(EXTRA_INITIAL_LATITUDE, latitude)
                .putExtra(EXTRA_INITIAL_LONGITUDE, longitude)
                .apply {
                    accuracyMeters?.let {
                        putExtra(EXTRA_INITIAL_ACCURACY_METERS, it)
                    }
                }
        }
    }
}
