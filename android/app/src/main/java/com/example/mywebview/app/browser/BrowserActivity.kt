package com.example.mywebview.app.browser

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.Gravity
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.net.toUri
import com.example.mywebview.urb.webview.UrbWebViewSecurity

class BrowserActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val url = intent.getStringExtra(EXTRA_URL).orEmpty()
        if (url.isBlank()) {
            finish()
            return
        }

        webView = WebView(this).apply {
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView,
                    request: WebResourceRequest,
                ): Boolean {
                    val uri = request.url
                    if (UrbWebViewSecurity.isHttpOrHttps(uri)) {
                        return false
                    }

                    return openExternalNavigation(uri)
                }
            }
            webChromeClient = WebChromeClient()
            UrbWebViewSecurity.configureBrowserWebView(this)
        }

        val contentView = createContentView(url)
        setContentView(contentView)
        configureSafeAreaInsets(contentView)
        configureBackNavigation()

        if (savedInstanceState == null) {
            webView.loadUrl(url)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    private fun createContentView(url: String): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL

            addView(
                LinearLayout(context).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.CENTER_VERTICAL
                    setPadding(20, 18, 20, 18)

                    addView(
                        TextView(context).apply {
                            text = url.toUri().host ?: url
                            textSize = 16f
                            setSingleLine(true)
                            layoutParams = LinearLayout.LayoutParams(
                                0,
                                LinearLayout.LayoutParams.WRAP_CONTENT,
                                1f,
                            )
                        },
                    )
                    addView(
                        Button(context).apply {
                            "Close".also { text = it }
                            setOnClickListener { finish() }
                        },
                    )
                },
            )
            addView(
                webView,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    0,
                    1f,
                ),
            )
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
                        finish()
                    }
                }
            },
        )
    }

    private fun configureSafeAreaInsets(contentView: LinearLayout) {
        ViewCompat.setOnApplyWindowInsetsListener(contentView) { view, windowInsets ->
            val systemBars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            val displayCutout = windowInsets.getInsets(WindowInsetsCompat.Type.displayCutout())

            view.setPadding(
                maxOf(systemBars.left, displayCutout.left),
                maxOf(systemBars.top, displayCutout.top),
                maxOf(systemBars.right, displayCutout.right),
                maxOf(systemBars.bottom, displayCutout.bottom),
            )

            windowInsets
        }

        ViewCompat.requestApplyInsets(contentView)
    }

    private fun openExternalNavigation(uri: Uri): Boolean {
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

    companion object {
        private const val TAG = "BrowserActivity"
        private const val EXTRA_URL = "com.example.mywebview.extra.BROWSER_URL"

        fun intent(context: Context, url: String): Intent {
            return Intent(context, BrowserActivity::class.java)
                .putExtra(EXTRA_URL, url)
        }
    }
}
