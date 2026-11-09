/**
 * Android Intent & Hardware Integration Service for AYRA AI
 * Handles native URL schemes, intents, permissions, and browser/webview hardware APIs.
 */

export interface DeviceTelemetry {
  batteryLevel: number;
  isCharging: boolean;
  isOnline: boolean;
  platform: string;
  hasSpeechRecognition: boolean;
  hasSpeechSynthesis: boolean;
  hasVibration: boolean;
  hasNotifications: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
}

export class AndroidIntentService {
  /**
   * Safe phone call execution via native bridge or tel: intent
   */
  static dialNumber(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace(/[^0-9+*#]/g, '');
    if (!cleanNumber) return false;

    // Check Android native bridge
    const nativeBridge = (window as any).AyraNativeBridge;
    if (nativeBridge && typeof nativeBridge.dialPhone === 'function') {
      try {
        nativeBridge.dialPhone(cleanNumber);
        return true;
      } catch (err) {
        console.warn('Native bridge dial error:', err);
      }
    }

    window.location.href = `tel:${cleanNumber}`;
    return true;
  }

  /**
   * SMS messaging intent
   */
  static sendSMS(phoneNumber: string, bodyText: string = ''): boolean {
    const cleanNumber = phoneNumber.replace(/[^0-9+*#]/g, '');
    const encodedBody = encodeURIComponent(bodyText);
    window.location.href = `sms:${cleanNumber}?body=${encodedBody}`;
    return true;
  }

  /**
   * Email intent
   */
  static sendEmail(toEmail: string, subject: string = '', body: string = ''): boolean {
    const mailtoUrl = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    return true;
  }

  /**
   * Web search intent
   */
  static searchWeb(query: string): void {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  }

  /**
   * Open specific external URL
   */
  static openURL(url: string): void {
    let target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  /**
   * App launch using Android Native Bridge or deep link schemes
   */
  static openApplication(appName: string, queryOrTarget: string = ''): void {
    const name = appName.toLowerCase().trim();
    
    // Check Android native bridge
    const nativeBridge = (window as any).AyraNativeBridge;
    if (nativeBridge && typeof nativeBridge.launchApp === 'function') {
      try {
        const packageMap: Record<string, string> = {
          'whatsapp': 'com.whatsapp',
          'youtube': 'com.google.android.youtube',
          'maps': 'com.google.android.apps.maps',
          'google maps': 'com.google.android.apps.maps',
          'camera': 'android.media.action.IMAGE_CAPTURE',
          'chrome': 'com.android.chrome',
          'browser': 'com.android.chrome',
          'settings': 'android.settings.SETTINGS',
          'clock': 'com.google.android.deskclock',
          'alarm': 'com.google.android.deskclock',
          'instagram': 'com.instagram.android',
          'facebook': 'com.facebook.katana',
          'tiktok': 'com.zhiliaoapp.musically',
          'calendar': 'com.google.android.calendar',
          'gallery': 'com.google.android.apps.photos',
          'messages': 'com.google.android.apps.messaging',
          'phone': 'com.google.android.dialer',
        };

        if (packageMap[name]) {
          const launched = nativeBridge.launchApp(packageMap[name]);
          if (launched) return;
        }
      } catch (err) {
        console.warn('Native bridge launch error:', err);
      }
    }
    
    switch (name) {
      case 'whatsapp':
        if (queryOrTarget) {
          window.location.href = `https://wa.me/?text=${encodeURIComponent(queryOrTarget)}`;
        } else {
          window.location.href = 'whatsapp://app';
        }
        break;

      case 'youtube':
        if (queryOrTarget) {
          window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(queryOrTarget)}`;
        } else {
          window.location.href = 'vnd.youtube://';
        }
        break;

      case 'maps':
      case 'google maps':
        if (queryOrTarget) {
          window.location.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryOrTarget)}`;
        } else {
          window.location.href = 'geo:0,0';
        }
        break;

      case 'camera':
        window.location.href = 'intent:#Intent;action=android.media.action.IMAGE_CAPTURE;end';
        break;

      case 'settings':
        window.location.href = 'intent:#Intent;action=android.settings.SETTINGS;end';
        break;

      case 'clock':
      case 'alarm':
        window.location.href = 'intent:#Intent;action=android.intent.action.SHOW_ALARMS;end';
        break;

      case 'play store':
      case 'store':
        window.location.href = 'market://';
        break;

      case 'instagram':
        window.location.href = 'intent://instagram.com/#Intent;package=com.instagram.android;scheme=https;end';
        break;

      case 'facebook':
        window.location.href = 'intent://facebook.com/#Intent;package=com.facebook.katana;scheme=https;end';
        break;

      default:
        // Generic fallback to web search or app query
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(appName + ' app')}`;
        break;
    }
  }

  /**
   * Set Android alarm or timer
   */
  static setAlarm(hour: number, minutes: number, message: string = 'AYRA Wakeup'): boolean {
    const nativeBridge = (window as any).AyraNativeBridge;
    if (nativeBridge && typeof nativeBridge.setAlarm === 'function') {
      try {
        nativeBridge.setAlarm(hour, minutes, message);
        return true;
      } catch (err) {
        console.warn('Native alarm set error:', err);
      }
    }
    // Web intent fallback
    window.location.href = `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.alarm.HOUR=${hour};i.android.intent.extra.alarm.MINUTES=${minutes};s.android.intent.extra.alarm.MESSAGE=${encodeURIComponent(message)};B.android.intent.extra.alarm.SKIP_UI=false;end`;
    return true;
  }

  /**
   * Open Android system settings category
   */
  static openSystemSetting(settingType: 'wifi' | 'bluetooth' | 'display' | 'sound' | 'location' | 'battery' | 'general'): void {
    const nativeBridge = (window as any).AyraNativeBridge;
    if (nativeBridge && typeof nativeBridge.openSystemSettings === 'function') {
      try {
        nativeBridge.openSystemSettings(settingType);
        return;
      } catch (err) {
        console.warn('Native settings error:', err);
      }
    }

    const actionMap: Record<string, string> = {
      wifi: 'android.settings.WIFI_SETTINGS',
      bluetooth: 'android.settings.BLUETOOTH_SETTINGS',
      display: 'android.settings.DISPLAY_SETTINGS',
      sound: 'android.settings.SOUND_SETTINGS',
      location: 'android.settings.LOCATION_SOURCE_SETTINGS',
      battery: 'android.intent.action.POWER_USAGE_SUMMARY',
      general: 'android.settings.SETTINGS',
    };

    const action = actionMap[settingType] || 'android.settings.SETTINGS';
    window.location.href = `intent:#Intent;action=${action};end`;
  }

  /**
   * Trigger haptic feedback via device vibration motor
   */
  static vibrate(pattern: number | number[] = 100): boolean {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        return navigator.vibrate(pattern);
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Request and post native system notification
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  static async sendNotification(title: string, body: string, iconUrl?: string): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      new Notification(`AYRA: ${title}`, {
        body,
        icon: iconUrl || '/favicon.ico',
        badge: '/favicon.ico',
      });
      return true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(`AYRA: ${title}`, {
          body,
          icon: iconUrl || '/favicon.ico',
        });
        return true;
      }
    }
    return false;
  }

  /**
   * Native Share API
   */
  static async shareContent(title: string, text: string, url: string = ''): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: url || window.location.href,
        });
        return true;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    }
    // Fallback: Copy to clipboard
    return this.copyToClipboard(`${title}\n${text}`);
  }

  /**
   * Copy to clipboard with fallback
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch {
        document.body.removeChild(textArea);
        return false;
      }
    }
    return false;
  }

  /**
   * Fetch device telemetry (battery, online, sensors)
   */
  static async getDeviceTelemetry(): Promise<DeviceTelemetry> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    let batteryLevel = 0.85;
    let isCharging = false;

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        batteryLevel = battery.level;
        isCharging = battery.charging;
      } catch {
        // Battery API not permitted
      }
    }

    return {
      batteryLevel,
      isCharging,
      isOnline,
      platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      hasSpeechRecognition: typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
      hasSpeechSynthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
      hasVibration: typeof navigator !== 'undefined' && 'vibrate' in navigator,
      hasNotifications: typeof window !== 'undefined' && 'Notification' in window,
      notificationPermission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
    };
  }

  /**
   * Floating Assistant Overlay Bridge for Android (Draw Over Other Apps)
   */
  static isOverlayPermissionGranted(): boolean {
    const nativeBridge = (window as any).AyraNativeBridge;
    if (nativeBridge && typeof nativeBridge.isOverlayPermissionGranted === 'function') {
      try {
        return Boolean(nativeBridge.isOverlayPermissionGranted());
      } catch (err) {
        console.warn('Overlay permission check error:', err);
      }
    }
    return false;
  }

  static requestOverlayPermission(): void {
    const nativeBridge = (window as any).AyraNativeBridge;
    if (nativeBridge && typeof nativeBridge.requestOverlayPermission === 'function') {
      try {
        nativeBridge.requestOverlayPermission();
      } catch (err) {
        console.warn('Request overlay permission error:', err);
      }
    }
  }

  static startFloatingAssistant(): boolean {
    const nativeBridge = (window as any).AyraNativeBridge;
    if (nativeBridge && typeof nativeBridge.startFloatingOverlay === 'function') {
      try {
        return Boolean(nativeBridge.startFloatingOverlay());
      } catch (err) {
        console.warn('Start floating overlay error:', err);
      }
    }
    return false;
  }

  static stopFloatingAssistant(): boolean {
    const nativeBridge = (window as any).AyraNativeBridge;
    if (nativeBridge && typeof nativeBridge.stopFloatingOverlay === 'function') {
      try {
        return Boolean(nativeBridge.stopFloatingOverlay());
      } catch (err) {
        console.warn('Stop floating overlay error:', err);
      }
    }
    return false;
  }

  static isFloatingAssistantRunning(): boolean {
    const nativeBridge = (window as any).AyraNativeBridge;
    if (nativeBridge && typeof nativeBridge.isFloatingOverlayRunning === 'function') {
      try {
        return Boolean(nativeBridge.isFloatingOverlayRunning());
      } catch (err) {
        console.warn('Check floating overlay running error:', err);
      }
    }
    return false;
  }
}
