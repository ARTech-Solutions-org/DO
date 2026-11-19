package com.example.dophotobooth

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var errorLayout: LinearLayout
    private lateinit var errorTextView: TextView
    private val prefsName = "DOPhotoBoothPrefs"
    private val prefServerUrlKey = "server_url"
    private val defaultServerUrl = "https://10.10.10.21:3000"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen on continuously for kiosk operation
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Immersive sticky fullscreen (hides status bar and navigation bar)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val insetsController = WindowCompat.getInsetsController(window, window.decorView)
        insetsController.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        insetsController.hide(WindowInsetsCompat.Type.systemBars())

        // Check camera and audio permissions
        val permissions = arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
        val needed = permissions.filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
        if (needed.isNotEmpty()) {
            requestPermissions(needed.toTypedArray(), 101)
        }

        val rootLayout = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#05040a"))
        }

        // 1. Setup WebView
        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.TRANSPARENT)
            overScrollMode = View.OVER_SCROLL_NEVER
            isClickable = true
            isFocusable = true
            isFocusableInTouchMode = true

            WebView.setWebContentsDebuggingEnabled(true)

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                mediaPlaybackRequiresUserGesture = false
                allowFileAccess = true
                allowContentAccess = true
                useWideViewPort = true
                loadWithOverviewMode = true
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                cacheMode = WebSettings.LOAD_NO_CACHE
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                setNeedInitialFocus(false)
                defaultTextEncodingName = "utf-8"
                userAgentString = "$userAgentString DOPhotoBoothKiosk/1.1"
            }

            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) {
                    runOnUiThread {
                        // Automatically grant camera and audio capture to the booth app
                        request.grant(request.resources)
                    }
                }

                override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
                    android.util.Log.d("BOOTH_WEB", "${consoleMessage?.message()} [${consoleMessage?.sourceId()}:${consoleMessage?.lineNumber()}]")
                    return true
                }
            }

            webViewClient = object : WebViewClient() {
                override fun onReceivedSslError(
                    view: WebView?,
                    handler: android.webkit.SslErrorHandler?,
                    error: android.net.http.SslError?
                ) {
                    // Automatically proceed with self-signed SSL certificate so camera works in Secure Context
                    handler?.proceed()
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    if (request?.isForMainFrame == true) {
                        showConnectionError(request.url.toString())
                    }
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    errorLayout.visibility = View.GONE
                    webView.visibility = View.VISIBLE
                }
            }
        }
        rootLayout.addView(webView)

        // 2. Setup Reconnect/Error overlay
        errorLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#0a0812"))
            visibility = View.GONE

            val title = TextView(this@MainActivity).apply {
                text = "DO / ONE PHOTO BOOTH"
                textSize = 24f
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
            }
            addView(title)

            errorTextView = TextView(this@MainActivity).apply {
                text = "Connecting to booth server..."
                textSize = 14f
                setTextColor(Color.parseColor("#A8A29E"))
                gravity = Gravity.CENTER
                setPadding(0, 16, 0, 32)
            }
            addView(errorTextView)

            val reloadBtn = Button(this@MainActivity).apply {
                text = "RETRY CONNECTION"
                setBackgroundColor(Color.parseColor("#966BFC"))
                setTextColor(Color.WHITE)
                setOnClickListener {
                    loadBooth()
                }
            }
            addView(reloadBtn)

            val changeUrlBtn = Button(this@MainActivity).apply {
                text = "CHANGE SERVER IP"
                setBackgroundColor(Color.TRANSPARENT)
                setTextColor(Color.parseColor("#F59E0B"))
                setOnClickListener {
                    showServerUrlDialog()
                }
            }
            addView(changeUrlBtn)
        }
        rootLayout.addView(errorLayout)

        // 3. Hidden Settings Hotspot in top-left corner (long-press or double-tap to change server URL)
        val gestureDetector = android.view.GestureDetector(this, object : android.view.GestureDetector.SimpleOnGestureListener() {
            override fun onLongPress(e: android.view.MotionEvent) {
                showServerUrlDialog()
            }
            override fun onDoubleTap(e: android.view.MotionEvent): Boolean {
                showServerUrlDialog()
                return true
            }
        })
        val hotspot = View(this).apply {
            layoutParams = FrameLayout.LayoutParams(140, 140, Gravity.TOP or Gravity.LEFT)
            setBackgroundColor(Color.TRANSPARENT)
            setOnTouchListener { _, event ->
                gestureDetector.onTouchEvent(event)
                false // Ensures touch events pass through to WebView!
            }
        }
        rootLayout.addView(hotspot)

        setContentView(rootLayout)

        // Load configured URL
        loadBooth()
    }

    private fun getServerUrl(): String {
        val prefs = getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        return prefs.getString(prefServerUrlKey, defaultServerUrl) ?: defaultServerUrl
    }

    private fun setServerUrl(url: String) {
        val prefs = getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        prefs.edit().putString(prefServerUrlKey, url).apply()
    }

    private fun loadBooth() {
        val url = getServerUrl()
        errorLayout.visibility = View.GONE
        webView.visibility = View.VISIBLE
        webView.clearCache(true)
        webView.loadUrl(url)
    }

    private fun showConnectionError(url: String) {
        webView.visibility = View.GONE
        errorTextView.text = "Cannot reach server at:\n$url\n\nEnsure tablet and laptop are on the same Wi-Fi."
        errorLayout.visibility = View.VISIBLE
    }

    private fun showServerUrlDialog() {
        val current = getServerUrl()
        val input = EditText(this).apply {
            setText(current)
            setSelection(text.length)
        }
        AlertDialog.Builder(this)
            .setTitle("Booth Server Address")
            .setMessage("Enter the local server URL (e.g. https://10.10.10.21:3000):")
            .setView(input)
            .setPositiveButton("Save & Connect") { _, _ ->
                var newUrl = input.text.toString().trim()
                if (newUrl.isNotEmpty()) {
                    if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
                        newUrl = "https://$newUrl"
                    }
                    val hostPart = newUrl.substringAfter("://").substringBefore("/").substringBefore(":")
                    val isPureIp = hostPart.matches(Regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$"))
                    if (isPureIp && !newUrl.substringAfter("://").substringBefore("/").contains(":")) {
                        newUrl = "$newUrl:3000"
                    }
                    setServerUrl(newUrl)
                    loadBooth()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            val insetsController = WindowCompat.getInsetsController(window, window.decorView)
            insetsController.hide(WindowInsetsCompat.Type.systemBars())
        }
    }
}
