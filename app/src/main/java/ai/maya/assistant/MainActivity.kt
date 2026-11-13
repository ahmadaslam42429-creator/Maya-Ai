package ai.maya.assistant

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import android.content.Context
import android.provider.Settings
import android.webkit.JavascriptInterface
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader

    // Multiple permissions launcher for Audio, Calls, Notifications
    private val requestPermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val micGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
        if (micGranted) {
            Toast.makeText(this, "AYRA Voice Systems Ready", Toast.LENGTH_SHORT).show()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Enable Hardware Acceleration for fluid 60 FPS sci-fi animations
        window.setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        )
        window.decorView.setBackgroundColor(Color.parseColor("#040814"))

        // Root WebView with futuristic dark background to eliminate white flash
        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#040814"))
        }
        setContentView(webView)

        // Initialize WebViewAssetLoader for modern secure asset handling (ES Modules & CORS)
        assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/res/", WebViewAssetLoader.ResourcesPathHandler(this))
            .build()

        checkAppPermissions()
        setupWebView()

        // Handle Back button navigation
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        // Load AYRA AI Application
        loadAssistantApp()
    }

    private fun checkAppPermissions() {
        val permissionsToRequest = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.VIBRATE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val ungranted = permissionsToRequest.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (ungranted.isNotEmpty()) {
            requestPermissionsLauncher.launch(ungranted.toTypedArray())
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            useWideViewPort = true
            loadWithOverviewMode = true
            displayZoomControls = false
            builtInZoomControls = false
        }

        // Enable Chrome DevTools inspect in debug builds (chrome://inspect)
        if (0 != (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE)) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        // Bridge native Android APIs to AYRA Assistant UI
        webView.addJavascriptInterface(AndroidBridge(this), "AyraNativeBridge")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                // Grant Web Speech API microphone permission to WebView
                request.grant(request.resources)
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                if (consoleMessage != null) {
                    val tag = "AYRA_AI_JS"
                    val msg = "${consoleMessage.message()} [${consoleMessage.sourceId()}:${consoleMessage.lineNumber()}]"
                    when (consoleMessage.messageLevel()) {
                        ConsoleMessage.MessageLevel.ERROR -> Log.e(tag, msg)
                        ConsoleMessage.MessageLevel.WARNING -> Log.w(tag, msg)
                        else -> Log.d(tag, msg)
                    }
                }
                return true
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                val url = request?.url ?: return null
                
                // Let WebViewAssetLoader handle standard appassets requests
                val intercepted = assetLoader.shouldInterceptRequest(url)
                if (intercepted != null) {
                    return intercepted
                }

                // Fallback direct asset resolver for any relative asset paths
                val path = url.path ?: ""
                if (path.contains("/assets/")) {
                    val cleanPath = path.substringAfter("/assets/").removePrefix("/")
                    val candidatePaths = listOf(
                        "assets/$cleanPath",
                        cleanPath,
                        "public/$cleanPath"
                    )
                    for (cand in candidatePaths) {
                        try {
                            val stream = assets.open(cand)
                            val mime = when {
                                cand.endsWith(".js") -> "application/javascript"
                                cand.endsWith(".css") -> "text/css"
                                cand.endsWith(".html") -> "text/html"
                                cand.endsWith(".json") -> "application/json"
                                cand.endsWith(".png") -> "image/png"
                                cand.endsWith(".svg") -> "image/svg+xml"
                                cand.endsWith(".woff2") -> "font/woff2"
                                cand.endsWith(".woff") -> "font/woff"
                                else -> "application/octet-stream"
                            }
                            return WebResourceResponse(mime, "UTF-8", stream)
                        } catch (_: Exception) {}
                    }
                }
                return null
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false

                // Intercept phone calls, SMS, WhatsApp, deep links
                if (url.startsWith("tel:") || url.startsWith("sms:") || url.startsWith("mailto:") ||
                    url.startsWith("whatsapp:") || url.startsWith("geo:") || url.startsWith("intent:") ||
                    url.startsWith("vnd.youtube:")
                ) {
                    try {
                        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            startActivity(intent)
                            return true
                        } catch (ex: Exception) {
                            Toast.makeText(this@MainActivity, "Application not available for intent", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
                return false
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    Log.e("AYRA_AI", "Error loading main frame: ${error?.description} (code: ${error?.errorCode})")
                }
            }
        }
    }

    private fun loadAssistantApp() {
        // Primary: Load through WebViewAssetLoader HTTPS virtual host
        // Eliminates null origin restrictions, allows ES modules and secure Web APIs
        val appUrl = "https://appassets.androidplatform.net/assets/index.html"
        webView.loadUrl(appUrl)
    }

    /**
     * Native Android Bridge exposed to AYRA Assistant WebView
     */
    inner class AndroidBridge(private val context: Context) {
        @JavascriptInterface
        fun launchApp(packageName: String): Boolean {
            return try {
                val intent = packageManager.getLaunchIntentForPackage(packageName)
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(intent)
                    true
                } else {
                    false
                }
            } catch (e: Exception) {
                Log.e("AYRA_AI", "Error launching app: ${e.message}")
                false
            }
        }

        @JavascriptInterface
        fun dialPhone(phoneNumber: String) {
            try {
                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phoneNumber"))
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(intent)
            } catch (e: Exception) {
                Log.e("AYRA_AI", "Error dialing phone: ${e.message}")
            }
        }

        @JavascriptInterface
        fun setAlarm(hour: Int, minutes: Int, message: String) {
            try {
                val intent = Intent(android.provider.AlarmClock.ACTION_SET_ALARM).apply {
                    putExtra(android.provider.AlarmClock.EXTRA_HOUR, hour)
                    putExtra(android.provider.AlarmClock.EXTRA_MINUTES, minutes)
                    putExtra(android.provider.AlarmClock.EXTRA_MESSAGE, message)
                    putExtra(android.provider.AlarmClock.EXTRA_SKIP_UI, false)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(intent)
            } catch (e: Exception) {
                Log.e("AYRA_AI", "Error setting alarm: ${e.message}")
            }
        }

        @JavascriptInterface
        fun openSystemSettings(type: String) {
            try {
                val action = when (type.lowercase()) {
                    "wifi" -> android.provider.Settings.ACTION_WIFI_SETTINGS
                    "bluetooth" -> android.provider.Settings.ACTION_BLUETOOTH_SETTINGS
                    "display" -> android.provider.Settings.ACTION_DISPLAY_SETTINGS
                    "sound" -> android.provider.Settings.ACTION_SOUND_SETTINGS
                    "location" -> android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS
                    "battery" -> Intent.ACTION_POWER_USAGE_SUMMARY
                    else -> android.provider.Settings.ACTION_SETTINGS
                }
                val intent = Intent(action).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(intent)
            } catch (e: Exception) {
                Log.e("AYRA_AI", "Error opening settings: ${e.message}")
            }
        }

        @JavascriptInterface
        fun vibrateDevice(durationMs: Long) {
            try {
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? android.os.Vibrator
                vibrator?.vibrate(durationMs)
            } catch (e: Exception) {
                Log.e("AYRA_AI", "Error vibrating: ${e.message}")
            }
        }

        @JavascriptInterface
        fun isOverlayPermissionGranted(): Boolean {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(this@MainActivity)
            } else {
                true
            }
        }

        @JavascriptInterface
        fun requestOverlayPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this@MainActivity)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                ).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(intent)
            }
        }

        @JavascriptInterface
        fun startFloatingOverlay(): Boolean {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this@MainActivity)) {
                requestOverlayPermission()
                false
            } else {
                AyraFloatingOverlayService.startService(this@MainActivity)
                true
            }
        }

        @JavascriptInterface
        fun stopFloatingOverlay(): Boolean {
            AyraFloatingOverlayService.stopService(this@MainActivity)
            return true
        }

        @JavascriptInterface
        fun isFloatingOverlayRunning(): Boolean {
            return AyraFloatingOverlayService.isServiceRunning
        }

        @JavascriptInterface
        fun startWakeWordListening(): Boolean {
            if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread { checkAppPermissions() }
                return false
            }
            if (!android.speech.SpeechRecognizer.isRecognitionAvailable(this@MainActivity)) {
                Log.e("AYRA_AI", "No Android speech recognition provider is installed")
                return false
            }
            return try {
                val intent = Intent(this@MainActivity, AyraFloatingOverlayService::class.java).apply {
                    action = AyraFloatingOverlayService.ACTION_START_WAKE_WORD
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    ContextCompat.startForegroundService(this@MainActivity, intent)
                } else {
                    startService(intent)
                }
                true
            } catch (e: Exception) {
                Log.e("AYRA_AI", "Could not start Hey AYRA listener: ${e.message}", e)
                false
            }
        }

        @JavascriptInterface
        fun stopWakeWordListening(): Boolean {
            return try {
                val intent = Intent(this@MainActivity, AyraFloatingOverlayService::class.java).apply {
                    action = AyraFloatingOverlayService.ACTION_STOP_WAKE_WORD
                }
                startService(intent)
                true
            } catch (e: Exception) {
                Log.e("AYRA_AI", "Could not stop Hey AYRA listener: ${e.message}", e)
                false
            }
        }

        @JavascriptInterface
        fun isWakeWordListening(): Boolean {
            return AyraFloatingOverlayService.isWakeWordListening
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (intent.getBooleanExtra("trigger_live_voice", false)) {
            webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('ayra-trigger-live-voice'));", null)
        }
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
