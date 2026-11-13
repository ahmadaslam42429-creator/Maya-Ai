package ai.maya.assistant

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/** User-enabled bridge for explicit AYRA navigation commands. */
class AyraAccessibilityService : AccessibilityService() {
    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        isRunning = true
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // No key logging, password reading, or background content collection.
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        isRunning = false
        instance = null
        super.onDestroy()
    }

    private fun clickVisibleText(root: AccessibilityNodeInfo?, target: String): Boolean {
        if (root == null || target.isBlank()) return false
        for (node in root.findAccessibilityNodeInfosByText(target)) {
            if (node.isClickable && node.isEnabled &&
                node.performAction(AccessibilityNodeInfo.ACTION_CLICK)) return true
            var parent = node.parent
            while (parent != null) {
                val clicked = parent.isClickable && parent.isEnabled &&
                    parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                val next = parent.parent
                parent.recycle()
                if (clicked) return true
                parent = next
            }
        }
        return false
    }

    companion object {
        @Volatile var isRunning = false
            private set
        @Volatile private var instance: AyraAccessibilityService? = null

        fun performAction(action: String, targetText: String): Boolean {
            val service = instance ?: return false
            return when (action.lowercase()) {
                "back" -> service.performGlobalAction(GLOBAL_ACTION_BACK)
                "home" -> service.performGlobalAction(GLOBAL_ACTION_HOME)
                "notifications" -> service.performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS)
                "click_text" -> service.clickVisibleText(service.rootInActiveWindow, targetText)
                else -> false
            }
        }
    }
}
