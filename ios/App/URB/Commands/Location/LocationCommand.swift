import Foundation
import CoreLocation
import MapKit
import UIKit
import WebKit

final class UrbLocationCurrentCommand: NSObject, UrbCommand, CLLocationManagerDelegate {
    let name = "location:current"
    private let manager = CLLocationManager()
    private var pending: UrbResponder?
    private var timeout: DispatchWorkItem?

    override init() {
        super.init()
        manager.delegate = self
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard pending == nil else {
            responder.error(code: "LOCATION_BUSY", message: "Location request already active")
            return
        }
        pending = responder
        let payload = request.payload ?? [:]
        let accuracy = (payload["accuracy"] as? String) == "coarse" ? kCLLocationAccuracyKilometer : kCLLocationAccuracyBest
        let timeoutMs = min(30_000, max(1_000, payload["timeoutMs"] as? Int ?? 10_000))
        manager.desiredAccuracy = accuracy
        manager.requestWhenInUseAuthorization()
        manager.requestLocation()
        let work = DispatchWorkItem { [weak self] in
            guard let self else { return }
            self.pending?.error(code: "LOCATION_UNAVAILABLE", message: "Location timeout")
            self.pending = nil
        }
        timeout = work
        DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(timeoutMs), execute: work)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        timeout?.cancel()
        pending?.error(code: "LOCATION_UNAVAILABLE", message: error.localizedDescription)
        pending = nil
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        timeout?.cancel()
        guard let location = locations.last else {
            pending?.error(code: "LOCATION_UNAVAILABLE", message: "Location unavailable")
            pending = nil
            return
        }
        let provider: String = (location.sourceInformation?.isSimulatedBySoftware == true) ? "passive" : "unknown"
        pending?.success([
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracyMeters": location.horizontalAccuracy,
            "provider": provider,
            "capturedAt": ISO8601DateFormatter().string(from: location.timestamp)
        ])
        pending = nil
    }
}

final class UrbLocationPickCommand: NSObject, UrbCommand, CLLocationManagerDelegate, UrbLocationPickerViewControllerDelegate {
    let name = "location:pick"
    private weak var webView: WKWebView?
    private let manager = CLLocationManager()
    private var pending: UrbResponder?
    private var timeout: DispatchWorkItem?
    private var timeoutMs = 10_000
    private var waitingForAuthorization = false
    private var pickerPresented = false

    init(webView: WKWebView) {
        self.webView = webView
        super.init()
        manager.delegate = self
    }

    func handle(request: UrbRequest, responder: UrbResponder) {
        guard pending == nil else {
            responder.error(code: "LOCATION_PICKER_BUSY", message: "Location picker is busy")
            return
        }

        pending = responder
        pickerPresented = false
        let payload = request.payload ?? [:]
        timeoutMs = min(30_000, max(1_000, payload["timeoutMs"] as? Int ?? 10_000))
        manager.desiredAccuracy = (payload["accuracy"] as? String) == "coarse" ? kCLLocationAccuracyKilometer : kCLLocationAccuracyBest

        if let initialLocation = initialLocation(from: payload) {
            presentPicker(centeredAt: initialLocation.coordinate, accuracyMeters: initialLocation.accuracyMeters)
            return
        }

        requestCurrentLocationForPicker()
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard waitingForAuthorization else { return }
        switch manager.authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            waitingForAuthorization = false
            requestCurrentLocationForPicker()
        case .denied, .restricted:
            waitingForAuthorization = false
            finishWithError(code: "LOCATION_PERMISSION_DENIED", message: "Location permission denied")
        case .notDetermined:
            break
        @unknown default:
            waitingForAuthorization = false
            finishWithError(code: "LOCATION_PERMISSION_DENIED", message: "Location permission denied")
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        timeout?.cancel()
        timeout = nil
        presentPicker(centeredAt: CLLocationCoordinate2D(latitude: 0, longitude: 0), accuracyMeters: nil)
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        timeout?.cancel()
        timeout = nil
        guard let location = locations.last else {
            presentPicker(centeredAt: CLLocationCoordinate2D(latitude: 0, longitude: 0), accuracyMeters: nil)
            return
        }

        presentPicker(centeredAt: location.coordinate, accuracyMeters: location.horizontalAccuracy)
    }

    func locationPickerDidCancel(_ picker: UrbLocationPickerViewController) {
        picker.dismiss(animated: true)
        finishWithError(code: "LOCATION_PICKER_CANCELLED", message: "Location picker cancelled")
    }

    func locationPicker(_ picker: UrbLocationPickerViewController, didPick coordinate: CLLocationCoordinate2D) {
        picker.dismiss(animated: true)
        pending?.success([
            "latitude": coordinate.latitude,
            "longitude": coordinate.longitude,
            "pickedAt": ISO8601DateFormatter().string(from: Date())
        ])
        pending = nil
    }

    private func requestCurrentLocationForPicker() {
        switch manager.authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            manager.requestLocation()
            let work = DispatchWorkItem { [weak self] in
                guard let self else { return }
                self.timeout = nil
                self.presentPicker(centeredAt: CLLocationCoordinate2D(latitude: 0, longitude: 0), accuracyMeters: nil)
            }
            timeout = work
            DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(timeoutMs), execute: work)
        case .notDetermined:
            waitingForAuthorization = true
            manager.requestWhenInUseAuthorization()
        case .denied, .restricted:
            finishWithError(code: "LOCATION_PERMISSION_DENIED", message: "Location permission denied")
        @unknown default:
            finishWithError(code: "LOCATION_PERMISSION_DENIED", message: "Location permission denied")
        }
    }

    private func presentPicker(centeredAt coordinate: CLLocationCoordinate2D, accuracyMeters: CLLocationAccuracy?) {
        guard pending != nil, !pickerPresented else { return }
        guard CLLocationCoordinate2DIsValid(coordinate) else {
            finishWithError(code: "LOCATION_PICKER_FAILED", message: "Location picker failed")
            return
        }

        guard let presenter = UrbPresent.from(webView: webView) else {
            finishWithError(code: "LOCATION_PICKER_FAILED", message: "Unable to open location picker")
            return
        }

        let picker = UrbLocationPickerViewController(center: coordinate, accuracyMeters: accuracyMeters)
        picker.delegate = self
        pickerPresented = true
        presenter.present(picker, animated: true)
    }

    private func finishWithError(code: String, message: String) {
        timeout?.cancel()
        timeout = nil
        waitingForAuthorization = false
        pickerPresented = false
        pending?.error(code: code, message: message)
        pending = nil
    }

    private func initialLocation(from payload: [String: Any]) -> PickedLocation? {
        guard let raw = payload["initialLocation"] as? [String: Any],
              let latitude = number(from: raw["latitude"]),
              let longitude = number(from: raw["longitude"]) else {
            return nil
        }

        let coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        guard CLLocationCoordinate2DIsValid(coordinate) else { return nil }
        return PickedLocation(coordinate: coordinate, accuracyMeters: number(from: raw["accuracyMeters"]))
    }

    private func number(from value: Any?) -> Double? {
        if let number = value as? NSNumber {
            return number.doubleValue.isFinite ? number.doubleValue : nil
        }
        if let value = value as? Double {
            return value.isFinite ? value : nil
        }
        if let value = value as? Int {
            return Double(value)
        }
        return nil
    }
}

private struct PickedLocation {
    let coordinate: CLLocationCoordinate2D
    let accuracyMeters: CLLocationAccuracy?
}

protocol UrbLocationPickerViewControllerDelegate: AnyObject {
    func locationPickerDidCancel(_ picker: UrbLocationPickerViewController)
    func locationPicker(_ picker: UrbLocationPickerViewController, didPick coordinate: CLLocationCoordinate2D)
}

final class UrbLocationPickerViewController: UIViewController, MKMapViewDelegate {
    weak var delegate: UrbLocationPickerViewControllerDelegate?

    private let mapView = MKMapView()
    private let annotation = MKPointAnnotation()
    private let initialCenter: CLLocationCoordinate2D
    private let initialAccuracyMeters: CLLocationAccuracy?

    init(center: CLLocationCoordinate2D, accuracyMeters: CLLocationAccuracy?) {
        self.initialCenter = center
        self.initialAccuracyMeters = accuracyMeters
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .fullScreen
    }

    required init?(coder: NSCoder) {
        nil
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        configureMap()
        configureControls()
    }

    func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
        guard !(annotation is MKUserLocation) else { return nil }

        let identifier = "urb-location-pick-pin"
        let view = mapView.dequeueReusableAnnotationView(withIdentifier: identifier) as? MKMarkerAnnotationView
            ?? MKMarkerAnnotationView(annotation: annotation, reuseIdentifier: identifier)
        view.annotation = annotation
        view.markerTintColor = .systemRed
        view.glyphImage = UIImage(systemName: "mappin")
        view.canShowCallout = true
        view.isDraggable = true
        view.animatesWhenAdded = true
        return view
    }

    @objc private func cancel() {
        delegate?.locationPickerDidCancel(self)
    }

    @objc private func confirm() {
        delegate?.locationPicker(self, didPick: annotation.coordinate)
    }

    @objc private func dropPin(_ recognizer: UITapGestureRecognizer) {
        guard recognizer.state == .ended else { return }
        let point = recognizer.location(in: mapView)
        annotation.coordinate = mapView.convert(point, toCoordinateFrom: mapView)
        mapView.selectAnnotation(annotation, animated: true)
    }

    private func configureMap() {
        mapView.translatesAutoresizingMaskIntoConstraints = false
        mapView.delegate = self
        mapView.showsUserLocation = true
        mapView.pointOfInterestFilter = .includingAll
        annotation.coordinate = initialCenter
        annotation.title = "Selected location"
        mapView.addAnnotation(annotation)
        mapView.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(dropPin)))
        view.addSubview(mapView)

        let region = MKCoordinateRegion(
            center: initialCenter,
            latitudinalMeters: max(500, (initialAccuracyMeters ?? 1_000) * 4),
            longitudinalMeters: max(500, (initialAccuracyMeters ?? 1_000) * 4)
        )
        mapView.setRegion(region, animated: false)
        mapView.selectAnnotation(annotation, animated: false)
    }

    private func configureControls() {
        let toolbar = UIStackView()
        toolbar.translatesAutoresizingMaskIntoConstraints = false
        toolbar.axis = .horizontal
        toolbar.alignment = .center
        toolbar.spacing = 12
        toolbar.backgroundColor = .systemBackground
        toolbar.layoutMargins = UIEdgeInsets(top: 12, left: 16, bottom: 12, right: 16)
        toolbar.isLayoutMarginsRelativeArrangement = true

        let cancelButton = UIButton(type: .system)
        cancelButton.setTitle("Cancel", for: .normal)
        cancelButton.addTarget(self, action: #selector(cancel), for: .touchUpInside)

        let titleLabel = UILabel()
        titleLabel.text = "Pick Location"
        titleLabel.font = .preferredFont(forTextStyle: .headline)
        titleLabel.textAlignment = .center

        let confirmButton = UIButton(type: .system)
        confirmButton.setTitle("Confirm", for: .normal)
        confirmButton.titleLabel?.font = .preferredFont(forTextStyle: .headline)
        confirmButton.addTarget(self, action: #selector(confirm), for: .touchUpInside)

        toolbar.addArrangedSubview(cancelButton)
        toolbar.addArrangedSubview(titleLabel)
        toolbar.addArrangedSubview(confirmButton)
        view.addSubview(toolbar)

        NSLayoutConstraint.activate([
            toolbar.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            toolbar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            toolbar.trailingAnchor.constraint(equalTo: view.trailingAnchor),

            cancelButton.widthAnchor.constraint(greaterThanOrEqualToConstant: 72),
            confirmButton.widthAnchor.constraint(greaterThanOrEqualToConstant: 72),

            mapView.topAnchor.constraint(equalTo: toolbar.bottomAnchor),
            mapView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            mapView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            mapView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
    }
}
