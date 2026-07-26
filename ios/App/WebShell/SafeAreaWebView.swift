import UIKit
import WebKit

final class SafeAreaWebView: WKWebView {
    var onSafeAreaInsetsChange: ((UIEdgeInsets) -> Void)?

    override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        onSafeAreaInsetsChange?(safeAreaInsets)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        onSafeAreaInsetsChange?(safeAreaInsets)
    }
}
