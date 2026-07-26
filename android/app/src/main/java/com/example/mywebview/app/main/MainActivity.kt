package com.example.mywebview.app.main

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import com.example.mywebview.BuildConfig
import com.example.mywebview.R
import com.example.mywebview.urb.bridge.UrbBridge
import com.example.mywebview.urb.bridge.UrbEventEmitter
import com.example.mywebview.urb.core.UrbCommandRegistry
import com.example.mywebview.urb.core.UrbConstants
import com.example.mywebview.urb.resources.UrbResourcePathHandler
import com.example.mywebview.urb.resources.UrbResourceStore
import com.example.mywebview.urb.core.UrbStringProvider
import com.example.mywebview.urb.commands.browser.BrowserOpenCommand
import com.example.mywebview.urb.commands.biometrics.BiometricsAuthenticateCommand
import com.example.mywebview.urb.commands.biometrics.BiometricsGetAvailabilityCommand
import com.example.mywebview.urb.commands.camera.CameraTakePictureCommand
import com.example.mywebview.urb.commands.clipboard.ClipboardGetTextCommand
import com.example.mywebview.urb.commands.clipboard.ClipboardSetTextCommand
import com.example.mywebview.urb.commands.deeplink.DeepLinkCommand
import com.example.mywebview.urb.commands.device.DeviceInfoCommand
import com.example.mywebview.urb.commands.documents.DocumentsPickCommand
import com.example.mywebview.urb.commands.fetch.FetchCommand
import com.example.mywebview.urb.commands.intent.IntentOpenCommand
import com.example.mywebview.urb.commands.intent.IntentOpenForResultCommand
import com.example.mywebview.urb.commands.location.LocationGetCurrentCommand
import com.example.mywebview.urb.commands.location.LocationPickCommand
import com.example.mywebview.urb.commands.location.PlatformLocationReader
import com.example.mywebview.urb.commands.media.MediaPickCommand
import com.example.mywebview.urb.commands.network.NetworkStatusCommand
import com.example.mywebview.urb.commands.permissions.PermissionReporter
import com.example.mywebview.urb.commands.permissions.PermissionsGetCommand
import com.example.mywebview.urb.commands.permissions.PermissionsRequestCommand
import com.example.mywebview.urb.commands.securestorage.SecureStorage
import com.example.mywebview.urb.commands.securestorage.SecureStorageClearCommand
import com.example.mywebview.urb.commands.securestorage.SecureStorageDeleteCommand
import com.example.mywebview.urb.commands.securestorage.SecureStorageGetCommand
import com.example.mywebview.urb.commands.securestorage.SecureStorageSetCommand
import com.example.mywebview.urb.commands.toast.ToastCommand
import com.example.mywebview.urb.commands.shared.PickedFileReaderCommand
import com.example.mywebview.urb.commands.websocket.UrbWebSocketManager
import com.example.mywebview.urb.commands.websocket.WebSocketCloseCommand
import com.example.mywebview.urb.commands.websocket.WebSocketOpenCommand
import com.example.mywebview.urb.commands.websocket.WebSocketSendCommand
import com.example.mywebview.urb.webview.UrbWebViewSecurity
import java.util.Locale

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
    private lateinit var cameraCommand: CameraTakePictureCommand
    private lateinit var permissionsRequestCommand: PermissionsRequestCommand
    private lateinit var mediaPickCommand: MediaPickCommand
    private lateinit var documentsPickCommand: DocumentsPickCommand
    private lateinit var locationGetCurrentCommand: LocationGetCurrentCommand
    private lateinit var locationPickCommand: LocationPickCommand
    private lateinit var locationReader: PlatformLocationReader
    private lateinit var intentOpenForResultCommand: IntentOpenForResultCommand
    private lateinit var webSocketManager: UrbWebSocketManager
    private lateinit var deepLinkCommand: DeepLinkCommand
    private lateinit var networkStatusCommand: NetworkStatusCommand
    private lateinit var fetchCommand: FetchCommand
    private lateinit var biometricsAuthenticateCommand: BiometricsAuthenticateCommand
    private var safeAreaScript: String? = null

    private val resourceStore = UrbResourceStore(
        allowedOrigin = if (BuildConfig.DEBUG) {
            UrbConstants.DEBUG_APP_URL.removeSuffix("/")
        } else {
            UrbConstants.APP_ASSET_ORIGIN
        },
    )
    private val takePictureLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicture(),
    ) { success ->
        cameraCommand.onCameraResult(success)
    }
    private val permissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { result ->
        permissionsRequestCommand.onPermissionsResult(result)
    }
    private val singleMediaPickerLauncher = registerForActivityResult(
        ActivityResultContracts.PickVisualMedia(),
    ) { uri ->
        mediaPickCommand.onSingleMediaResult(uri)
    }
    private val multipleMediaPickerLauncher = registerForActivityResult(
        ActivityResultContracts.PickMultipleVisualMedia(MAX_PICKER_ITEMS),
    ) { uris ->
        mediaPickCommand.onMultipleMediaResult(uris)
    }
    private val singleDocumentPickerLauncher = registerForActivityResult(
        ActivityResultContracts.OpenDocument(),
    ) { uri ->
        documentsPickCommand.onSingleDocumentResult(uri)
    }
    private val multipleDocumentPickerLauncher = registerForActivityResult(
        ActivityResultContracts.OpenMultipleDocuments(),
    ) { uris ->
        documentsPickCommand.onMultipleDocumentsResult(uris)
    }
    private val locationPickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { result ->
        locationPickCommand.onPickerResult(result.resultCode, result.data)
    }
    private val intentLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { result ->
        intentOpenForResultCommand.onIntentResult(result)
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        assetLoader = createAssetLoader()
        val strings = UrbStringProvider(this)
        cameraCommand = CameraTakePictureCommand(
            activity = this,
            launcher = takePictureLauncher,
            resourceStore = resourceStore,
            strings = strings,
        )
        val permissionReporter = PermissionReporter(this)
        permissionsRequestCommand = PermissionsRequestCommand(
            reporter = permissionReporter,
            launcher = permissionsLauncher,
            strings = strings,
        )
        val pickedFileReader = PickedFileReaderCommand(
            activity = this,
            resourceStore = resourceStore,
            strings = strings,
        )
        mediaPickCommand = MediaPickCommand(
            singleLauncher = singleMediaPickerLauncher,
            multipleLauncher = multipleMediaPickerLauncher,
            fileReader = pickedFileReader,
            strings = strings,
        )
        documentsPickCommand = DocumentsPickCommand(
            singleLauncher = singleDocumentPickerLauncher,
            multipleLauncher = multipleDocumentPickerLauncher,
            fileReader = pickedFileReader,
            strings = strings,
        )
        locationReader = PlatformLocationReader(
            activity = this,
            strings = strings,
        )
        locationGetCurrentCommand = LocationGetCurrentCommand(
            locationReader = locationReader,
            strings = strings,
        )
        locationPickCommand = LocationPickCommand(
            activity = this,
            launcher = locationPickerLauncher,
            locationReader = locationReader,
            strings = strings,
        )
        intentOpenForResultCommand = IntentOpenForResultCommand(
            activity = this,
            launcher = intentLauncher,
            strings = strings,
        )

        configureWebView()
        configureUrbBridge()
        deepLinkCommand.captureInitialIntent(intent)
        configureSafeAreaInsets()
        configureBackNavigation()

        if (savedInstanceState == null) {
            webView.loadUrl(appUrl())
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (::deepLinkCommand.isInitialized) {
            deepLinkCommand.handleNewIntent(intent)
        }
    }

    override fun onStart() {
        super.onStart()
        if (::networkStatusCommand.isInitialized) {
            networkStatusCommand.register()
        }
    }

    override fun onStop() {
        if (::networkStatusCommand.isInitialized) {
            networkStatusCommand.unregister()
        }
        super.onStop()
    }

    override fun onDestroy() {
        if (::fetchCommand.isInitialized) {
            fetchCommand.cancelAll()
        }
        if (::locationReader.isInitialized) {
            locationReader.cancelPending()
        }
        if (::biometricsAuthenticateCommand.isInitialized) {
            biometricsAuthenticateCommand.cancelPending()
        }
        if (::webSocketManager.isInitialized) {
            webSocketManager.closeAll()
        }
        resourceStore.clear(deleteFiles = true)
        webView.destroy()
        super.onDestroy()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest,
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean {
                val uri = request.url
                if (UrbWebViewSecurity.isTrustedAppUrl(uri, BuildConfig.DEBUG)) {
                    return false
                }

                return openExternalNavigation(uri)
            }

            override fun onPageFinished(view: WebView, url: String) {
                injectSafeAreaInsets()
            }
        }
        webView.webChromeClient = WebChromeClient()
        UrbWebViewSecurity.configureTrustedAppWebView(webView, BuildConfig.DEBUG)

        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }
    }

    private fun configureUrbBridge() {
        val strings = UrbStringProvider(this)
        webSocketManager = UrbWebSocketManager(
            eventEmitter = UrbEventEmitter(webView),
            strings = strings,
            allowedHosts = nativeNetworkAllowedHosts(),
            allowCleartext = BuildConfig.DEBUG,
        )
        val eventEmitter = UrbEventEmitter(webView)
        deepLinkCommand = DeepLinkCommand(eventEmitter)
        networkStatusCommand = NetworkStatusCommand(
            context = this,
            eventEmitter = eventEmitter,
        )
        fetchCommand = FetchCommand(
            strings = strings,
            allowedHosts = nativeNetworkAllowedHosts(),
            allowCleartext = BuildConfig.DEBUG,
        )
        val secureStorage = SecureStorage(this)
        biometricsAuthenticateCommand = BiometricsAuthenticateCommand(this)
        val registry = UrbCommandRegistry()
            .register(ToastCommand(this))
            .register(cameraCommand)
            .register(
                PermissionsGetCommand(
                    PermissionReporter(
                        activity = this,
                    ),
                    strings = strings,
                ),
            )
            .register(permissionsRequestCommand)
            .register(mediaPickCommand)
            .register(documentsPickCommand)
            .register(locationGetCurrentCommand)
            .register(locationPickCommand)
            .register(
                IntentOpenCommand(
                    activity = this,
                    strings = strings,
                ),
            )
            .register(intentOpenForResultCommand)
            .register(
                BrowserOpenCommand(
                    activity = this,
                    strings = strings,
                ),
            )
            .register(ClipboardGetTextCommand(this))
            .register(ClipboardSetTextCommand(this))
            .register(DeviceInfoCommand(this))
            .register(SecureStorageSetCommand(secureStorage))
            .register(SecureStorageGetCommand(secureStorage))
            .register(SecureStorageDeleteCommand(secureStorage))
            .register(SecureStorageClearCommand(secureStorage))
            .register(BiometricsGetAvailabilityCommand(this))
            .register(biometricsAuthenticateCommand)
            .register(deepLinkCommand)
            .register(networkStatusCommand)
            .register(fetchCommand)
            .register(WebSocketOpenCommand(webSocketManager, strings))
            .register(WebSocketSendCommand(webSocketManager, strings))
            .register(WebSocketCloseCommand(webSocketManager, strings))

        UrbBridge(
            webView = webView,
            commandRegistry = registry,
            allowedOrigins = UrbWebViewSecurity.bridgeAllowedOrigins(BuildConfig.DEBUG),
            strings = strings,
        ).attach()
    }

    private fun createAssetLoader(): WebViewAssetLoader {
        return WebViewAssetLoader.Builder()
            .addPathHandler(
                "/assets/",
                WebViewAssetLoader.AssetsPathHandler(this),
            )
            .addPathHandler(
                UrbConstants.RESOURCE_PATH_PREFIX,
                UrbResourcePathHandler(resourceStore),
            )
            .build()
    }

    private fun configureSafeAreaInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(webView) { _, windowInsets ->
            val systemBars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            val displayCutout = windowInsets.getInsets(WindowInsetsCompat.Type.displayCutout())

            updateSafeAreaInsets(
                top = maxOf(systemBars.top, displayCutout.top).toCssPixels(),
                right = maxOf(systemBars.right, displayCutout.right).toCssPixels(),
                bottom = maxOf(systemBars.bottom, displayCutout.bottom).toCssPixels(),
                left = maxOf(systemBars.left, displayCutout.left).toCssPixels(),
            )

            windowInsets
        }

        ViewCompat.requestApplyInsets(webView)
    }

    private fun updateSafeAreaInsets(
        top: String,
        right: String,
        bottom: String,
        left: String,
    ) {
        safeAreaScript = """
            (function() {
              var root = document.documentElement;
              root.style.setProperty('--native-safe-area-top', '$top');
              root.style.setProperty('--native-safe-area-right', '$right');
              root.style.setProperty('--native-safe-area-bottom', '$bottom');
              root.style.setProperty('--native-safe-area-left', '$left');
            })();
        """.trimIndent()

        injectSafeAreaInsets()
    }

    private fun Int.toCssPixels(): String {
        val cssPixels = this / resources.displayMetrics.density
        return String.format(Locale.US, "%.2fpx", cssPixels)
    }

    private fun injectSafeAreaInsets() {
        safeAreaScript?.let { script ->
            webView.evaluateJavascript(script, null)
        }
    }

    private fun configureBackNavigation() {
        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            },
        )
    }

    private fun appUrl(): String {
        return if (BuildConfig.DEBUG) {
            UrbConstants.DEBUG_APP_URL
        } else {
            UrbConstants.RELEASE_APP_URL
        }
    }

    private fun nativeNetworkAllowedHosts(): Set<String> {
        return if (BuildConfig.DEBUG) {
            UrbConstants.DEBUG_NATIVE_NETWORK_ALLOWED_HOSTS
        } else {
            UrbConstants.RELEASE_NATIVE_NETWORK_ALLOWED_HOSTS
        }
    }

    private fun openExternalNavigation(uri: Uri): Boolean {
        if (!UrbWebViewSecurity.isHttpOrHttps(uri)) {
            Log.w(TAG, "Blocked non-web navigation from trusted WebView: $uri")
            return true
        }

        return try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
            true
        } catch (error: ActivityNotFoundException) {
            Log.w(TAG, "No external activity found for navigation: $uri", error)
            true
        } catch (error: RuntimeException) {
            Log.w(TAG, "External navigation failed: $uri", error)
            true
        }
    }

    private companion object {
        const val TAG = "MainActivity"
        const val MAX_PICKER_ITEMS = 20
    }
}
