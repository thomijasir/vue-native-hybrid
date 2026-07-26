import SwiftUI
import WebKit

struct TradingWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.websiteDataStore = .default()
        configuration.userContentController = WKUserContentController()

        let resourceStore = UrbResourceStore()
        let resourceHandler = UrbResourceSchemeHandler(resourceStore: resourceStore)
        configuration.setURLSchemeHandler(resourceHandler, forURLScheme: UrbConstants.resourceScheme)

        let webView = SafeAreaWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        context.coordinator.attach(webView: webView, resourceStore: resourceStore)
        webView.onSafeAreaInsetsChange = { [weak webView] insets in
            context.coordinator.updateSafeAreaInsets(insets, in: webView)
        }
        webView.allowsBackForwardNavigationGestures = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.minimumZoomScale = 1
        webView.scrollView.maximumZoomScale = 1
        webView.scrollView.bouncesZoom = false
        webView.scrollView.pinchGestureRecognizer?.isEnabled = false
        webView.load(appRequest())

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.updateSafeAreaInsets(webView.safeAreaInsets, in: webView)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    private func appRequest() -> URLRequest {
        #if DEBUG
        return URLRequest(url: URL(string: "http://localhost:8080/")!)
        #else
        guard let indexURL = Bundle.main.url(
            forResource: "index",
            withExtension: "html",
            subdirectory: "Web"
        ) else {
            fatalError("Missing bundled Web/index.html. Run `bun run build` before building a release app.")
        }

        return URLRequest(url: indexURL)
        #endif
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        private var urb: UrbBridge?

        func attach(webView: WKWebView, resourceStore: UrbResourceStore) {
            urb = UrbBridge(
                webView: webView,
                userContentController: webView.configuration.userContentController,
                resourceStore: resourceStore
            )
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            updateSafeAreaInsets(webView.safeAreaInsets, in: webView)
        }

        func updateSafeAreaInsets(_ insets: UIEdgeInsets, in webView: WKWebView?) {
            let script = """
                (function() {
                  var root = document.documentElement;
                  root.style.setProperty('--native-safe-area-top', '\(insets.top)px');
                  root.style.setProperty('--native-safe-area-right', '\(insets.right)px');
                  root.style.setProperty('--native-safe-area-bottom', '\(insets.bottom)px');
                  root.style.setProperty('--native-safe-area-left', '\(insets.left)px');
                })();
            """

            webView?.evaluateJavaScript(script, completionHandler: nil)
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            if navigationAction.targetFrame?.isMainFrame == true,
               !UrbBridge.isTrustedAppURL(navigationAction.request.url) {
                decisionHandler(.cancel)
                return
            }

            decisionHandler(.allow)
        }
    }
}
