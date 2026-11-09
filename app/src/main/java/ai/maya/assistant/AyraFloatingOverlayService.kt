package ai.maya.assistant

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import androidx.core.app.NotificationCompat

/**
 * AYRA AI — Foreground Live Voice & Floating Overlay Service
 * Displays a draggable floating assistant chat bubble over other applications
 * while keeping live speech recognition and voice responses active in the background.
 */
class AyraFloatingOverlayService : Service() {

    companion object {
        const val CHANNEL_ID = "ayra_floating_assistant_channel"
        const val NOTIFICATION_ID = 4291
        const val ACTION_STOP_SERVICE = "ai.maya.assistant.ACTION_STOP_FLOATING"
        const val ACTION_EXPAND_CHAT = "ai.maya.assistant.ACTION_EXPAND_CHAT"

        @Volatile
        var isServiceRunning: Boolean = false
            private set

        fun startService(context: Context) {
            val intent = Intent(context, AyraFloatingOverlayService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, AyraFloatingOverlayService::class.java).apply {
                action = ACTION_STOP_SERVICE
            }
            context.startService(intent)
        }
    }

    private var windowManager: WindowManager? = null
    private var floatingBubbleView: View? = null
    private var floatingParams: WindowManager.LayoutParams? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        isServiceRunning = true
        createNotificationChannel()
        startAsForeground()
        showFloatingBubble()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP_SERVICE) {
            stopSelf()
            return START_NOT_STICKY
        }
        return START_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "AYRA AI Floating Assistant",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows floating HUD and keeps live voice active across other apps"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun startAsForeground() {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingOpenApp = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, AyraFloatingOverlayService::class.java).apply {
            action = ACTION_STOP_SERVICE
        }
        val pendingStop = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AYRA AI Live Overlay Active")
            .setContentText("Listening & ready across all open applications. Tap bubble to talk.")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .setContentIntent(pendingOpenApp)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Close Overlay", pendingStop)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun showFloatingBubble() {
        try {
            windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

            val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            }

            floatingParams = WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                x = 60
                y = 300
            }

            // Create Futuristic Holographic Floating Bubble View programmatically
            val rootLayout = FrameLayout(this).apply {
                val sizePx = (64 * resources.displayMetrics.density).toInt()
                layoutParams = FrameLayout.LayoutParams(sizePx, sizePx)
                clipToOutline = true

                // Neon cyan circular holographic background
                val bgShape = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(Color.parseColor("#E6040C1A"))
                    setStroke((2.5 * resources.displayMetrics.density).toInt(), Color.parseColor("#00F2FE"))
                }
                background = bgShape
            }

            // Holographic AI Pulse Ring
            val pulseView = View(this).apply {
                val pulseShape = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(Color.TRANSPARENT)
                    setStroke((1 * resources.displayMetrics.density).toInt(), Color.parseColor("#4FACFE"))
                }
                background = pulseShape
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            }
            rootLayout.addView(pulseView)

            // AYRA Center Label / Icon
            val labelView = TextView(this).apply {
                text = "آئرا"
                setTextColor(Color.parseColor("#00F2FE"))
                textSize = 15f
                gravity = Gravity.CENTER
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            }
            rootLayout.addView(labelView)

            // Touch & Drag Listener
            rootLayout.setOnTouchListener(object : View.OnTouchListener {
                private var initialX = 0
                private var initialY = 0
                private var initialTouchX = 0f
                private var initialTouchY = 0f
                private var isClick = false

                override fun onTouch(v: View?, event: MotionEvent?): Boolean {
                    event ?: return false
                    when (event.action) {
                        MotionEvent.ACTION_DOWN -> {
                            initialX = floatingParams?.x ?: 0
                            initialY = floatingParams?.y ?: 0
                            initialTouchX = event.rawX
                            initialTouchY = event.rawY
                            isClick = true
                            return true
                        }
                        MotionEvent.ACTION_MOVE -> {
                            val dx = (event.rawX - initialTouchX).toInt()
                            val dy = (event.rawY - initialTouchY).toInt()
                            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                                isClick = false
                            }
                            floatingParams?.x = initialX + dx
                            floatingParams?.y = initialY + dy
                            if (floatingBubbleView != null && floatingParams != null) {
                                windowManager?.updateViewLayout(floatingBubbleView, floatingParams)
                            }
                            return true
                        }
                        MotionEvent.ACTION_UP -> {
                            if (isClick) {
                                // Clicked: Bring AYRA to the foreground or toggle live voice
                                val launchApp = Intent(this@AyraFloatingOverlayService, MainActivity::class.java).apply {
                                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                                    putExtra("trigger_live_voice", true)
                                }
                                startActivity(launchApp)
                            }
                            return true
                        }
                    }
                    return false
                }
            })

            floatingBubbleView = rootLayout
            windowManager?.addView(floatingBubbleView, floatingParams)
        } catch (e: Exception) {
            Log.e("AYRA_OVERLAY", "Error displaying floating bubble: ${e.message}")
        }
    }

    override fun onDestroy() {
        isServiceRunning = false
        try {
            if (floatingBubbleView != null) {
                windowManager?.removeView(floatingBubbleView)
                floatingBubbleView = null
            }
        } catch (e: Exception) {
            Log.e("AYRA_OVERLAY", "Error removing floating bubble: ${e.message}")
        }
        super.onDestroy()
    }
}
