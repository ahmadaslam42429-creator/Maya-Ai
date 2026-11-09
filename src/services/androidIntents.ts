/**
 * Android Intent & Hardware Integration Service for MAYA AI
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
   * Safe phone call execution via standard tel: intent
   */
  static dialNumber(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace(/[^0-9+*#]/g, '');
    if (!cleanNumber) return false;
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
   * App launch using Android deep link schemes
   */
  static openApplication(appName: string, queryOrTarget: string = ''): void {
    const name = appName.toLowerCase().trim();
    
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
        // Android intent for camera capture
        window.location.href = 'intent:#Intent;action=android.media.action.IMAGE_CAPTURE;end';
        break;

      case 'settings':
        // Android settings intent
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

      default:
        // Generic fallback to web search or app query
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(appName + ' app')}`;
        break;
    }
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
      new Notification(`MAYA: ${title}`, {
        body,
        icon: iconUrl || '/favicon.ico',
        badge: '/favicon.ico',
      });
      return true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(`MAYA: ${title}`, {
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
}
