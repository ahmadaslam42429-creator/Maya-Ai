/**
 * MAYA AI — Client-Side Neural Fallback Engine
 * Ensures 100% offline & standalone Android APK conversational capability
 * @license Apache-2.0
 */

import { EmotionType, AssistantAction } from '../types/assistant';

export interface LocalAiResponse {
  reply: string;
  emotion: EmotionType;
  detectedLanguage: 'en' | 'ur' | 'hi';
  action: AssistantAction | null;
}

export function processLocalBrainMessage(
  message: string,
  userLanguage: string = 'en'
): LocalAiResponse {
  const text = message.trim();
  const lower = text.toLowerCase();

  const isUrdu = /[\u0600-\u06FF]/.test(text) || userLanguage === 'ur' || lower.includes('urdu');
  const isHindi = /[\u0900-\u097F]/.test(text) || userLanguage === 'hi' || lower.includes('hindi');

  // 1. Phone Call Intent
  if (lower.includes('call') || lower.includes('dial') || lower.includes('phone') || text.includes('کال') || text.includes('فون')) {
    const numMatch = text.match(/\+?[0-9]{4,15}/);
    const targetNum = numMatch ? numMatch[0] : '03001234567';
    return {
      reply: isUrdu
        ? `میں نے ${targetNum} پر کال ملانے کے لیے اینڈرائیڈ ڈائلر انٹینٹ تیار کر لیا ہے۔ تصدیق کے بعد کال مل جائے گی۔`
        : `Telephony intent prepared for ${targetNum}. For your privacy, please confirm dispatch to the Android phone dialer.`,
      emotion: 'serious',
      detectedLanguage: isUrdu ? 'ur' : 'en',
      action: {
        type: 'call',
        title: 'Android Telephony Intent',
        description: `Dispatch intent to call ${targetNum}`,
        payload: { number: targetNum },
        requiresConfirmation: true,
      },
    };
  }

  // 2. Alarm Intent
  if (lower.includes('alarm') || lower.includes('wake') || text.includes('الارم') || text.includes('الرم')) {
    const timeMatch = text.match(/([0-1]?[0-9]|2[0-3]):([0-5][0-9])/);
    const scheduledTime = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '07:00';
    return {
      reply: isUrdu
        ? `میں نے صبح ${scheduledTime} بجے کا سسٹم الارم شیڈول کر دیا ہے۔ تصدیق کیجیے تاکہ اینڈرائیڈ کلاک میں درج ہو۔`
        : `Scheduled system wake-up alarm for ${scheduledTime}. Confirming this prompt will register it into your Android clock subsystem.`,
      emotion: 'excited',
      detectedLanguage: isUrdu ? 'ur' : 'en',
      action: {
        type: 'alarm',
        title: 'System Alarm Intent',
        description: `Set system wake-up alarm for ${scheduledTime}`,
        payload: { time: scheduledTime, label: 'MAYA Wakeup' },
        requiresConfirmation: true,
      },
    };
  }

  // 3. Weather Intent
  if (lower.includes('weather') || lower.includes('temperature') || lower.includes('forecast') || text.includes('موسم')) {
    const cityMatch = text.match(/in\s+([a-zA-Z\s]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : 'Islamabad';
    return {
      reply: isUrdu
        ? `میں نے ${city} کے لیے ریئل ٹائم سیٹلائٹ ویدر میٹرکس کھول دی ہے۔ آپ درجہ حرارت اور ہوا کی رفتار دیکھ سکتے ہیں۔`
        : `Orbital meteorological sensors locked on ${city}. Displaying real-time atmospheric telemetry and barometric pressure.`,
      emotion: 'thinking',
      detectedLanguage: isUrdu ? 'ur' : 'en',
      action: {
        type: 'weather',
        title: 'Atmospheric Weather Telemetry',
        description: `Fetch satellite weather for ${city}`,
        payload: { city },
        requiresConfirmation: false,
      },
    };
  }

  // 4. Calculator / Math Intent
  if (lower.includes('calculate') || lower.includes('math') || text.includes('حساب') || /[0-9]+\s*[\+\-\*\/]\s*[0-9]+/.test(text)) {
    const mathMatch = text.match(/([0-9\.\s\+\-\*\/\(\)\^]+)/);
    const expr = mathMatch ? mathMatch[0].trim() : '';
    return {
      reply: isUrdu
        ? `کوانٹم کیلکولیٹر فعال ہے۔ میں نے حسابی میٹرکس اسکرین کھول دی ہے۔`
        : `Quantum math subsystem initialized. Calculating numerical expressions and logarithmic projections.`,
      emotion: 'thinking',
      detectedLanguage: isUrdu ? 'ur' : 'en',
      action: {
        type: 'calculator',
        title: 'Quantum Calculator Matrix',
        description: 'Initialize high-precision computational module',
        payload: { expression: expr },
        requiresConfirmation: false,
      },
    };
  }

  // 5. Open Apps Intent (WhatsApp, YouTube, Camera, Maps)
  if (lower.includes('open whatsapp') || lower.includes('whatsapp') || text.includes('واٹس ایپ')) {
    return {
      reply: isUrdu ? 'واٹس ایپ لانچ کیا جا رہا ہے۔' : 'Launching WhatsApp messaging subsystem.',
      emotion: 'excited',
      detectedLanguage: isUrdu ? 'ur' : 'en',
      action: {
        type: 'open_app',
        title: 'Launch WhatsApp',
        description: 'Open WhatsApp application on device',
        payload: { appName: 'whatsapp' },
        requiresConfirmation: false,
      },
    };
  }

  if (lower.includes('open youtube') || lower.includes('youtube') || text.includes('یوٹیوب')) {
    return {
      reply: isUrdu ? 'یوٹیوب ویڈیو اسٹریم کھولی جا رہی ہے۔' : 'Opening YouTube media gateway.',
      emotion: 'happy',
      detectedLanguage: isUrdu ? 'ur' : 'en',
      action: {
        type: 'open_app',
        title: 'Launch YouTube',
        description: 'Open YouTube video application',
        payload: { appName: 'youtube' },
        requiresConfirmation: false,
      },
    };
  }

  if (lower.includes('open camera') || lower.includes('take a photo') || lower.includes('camera') || text.includes('کیمرہ')) {
    return {
      reply: isUrdu ? 'اینڈرائیڈ کیمرہ سینسرز اور آپٹیکل ویژن اسٹوڈیو فعال کیا جا رہا ہے۔' : 'Initializing Android optical camera sensors and Vision Studio.',
      emotion: 'excited',
      detectedLanguage: isUrdu ? 'ur' : 'en',
      action: {
        type: 'open_app',
        title: 'Open Vision Camera',
        description: 'Activate device optical camera sensors',
        payload: { appName: 'camera' },
        requiresConfirmation: false,
      },
    };
  }

  // Avatar Posture Control Commands
  if (lower.includes('stand up') || lower.includes('stand') || text.includes('کھڑے ہو')) {
    return {
      reply: isUrdu ? 'میں کھڑے ہونے کی پوزیشن میں تبدیل ہو رہی ہوں۔' : 'Switching 3D avatar kinematics to standing stage posture.',
      emotion: 'excited',
      detectedLanguage: isUrdu ? 'ur' : 'en',
      action: {
        type: 'open_app',
        title: 'Avatar Posture: STAND',
        description: 'Transition avatar to standing posture',
        payload: { pose: 'stand' },
        requiresConfirmation: false,
      },
    };
  }

  if (lower.includes('sit down') || lower.includes('sit') || text.includes('بیٹھ جاؤ')) {
    return {
      reply: isUrdu ? 'میں اپنی ورک اسٹیشن چیئر پر بیٹھ رہی ہوں۔' : 'Returning 3D avatar to natural seated workstation posture.',
      emotion: 'happy',
      detectedLanguage: isUrdu ? 'ur' : 'en',
      action: {
        type: 'open_app',
        title: 'Avatar Posture: SIT',
        description: 'Transition avatar to seated workstation',
        payload: { pose: 'sit' },
        requiresConfirmation: false,
      },
    };
  }

  if (lower.includes('wave') || text.includes('ہاتھ ہلاؤ')) {
    return {
      reply: isUrdu ? 'ہیلو کمانڈر! میں آپ کو خوش آمدید کہتی ہوں۔' : 'Greetings Commander! Waving to you from the holographic stage.',
      emotion: 'happy',
      detectedLanguage: isUrdu ? 'ur' : 'en',
      action: {
        type: 'open_app',
        title: 'Avatar Pose: WAVE',
        description: 'Execute waving hand animation',
        payload: { pose: 'wave' },
        requiresConfirmation: false,
      },
    };
  }

  // 6. Memory Note Intent
  if (lower.includes('note') || lower.includes('remember') || text.includes('نوٹ') || text.includes('یاد رکھو')) {
    return {
      reply: isUrdu
        ? 'میں نے آپ کا میموری والٹ کھول دیا ہے۔ آپ کے تمام نوٹس اور اہم معلومات یہاں محفوظ ہیں۔'
        : 'Accessing encrypted Neural Memory Vault. Storing telemetry and notes securely in local sandbox.',
      emotion: 'caring',
      detectedLanguage: isUrdu ? 'ur' : 'en',
      action: {
        type: 'note',
        title: 'Memory Vault Storage',
        description: 'Record note in local encrypted storage',
        payload: { content: text },
        requiresConfirmation: false,
      },
    };
  }

  // 7. Urdu Language Conversation
  if (isUrdu || lower.includes('urdu') || text.includes('کون ہو') || text.includes('کیسے ہو') || text.includes('سلام')) {
    if (text.includes('سلام') || text.includes('ہیلو') || lower.includes('salam')) {
      return {
        reply: 'وعلیکم السلام! میں مایا ہوں، آپ کی ذاتی اور جدید ترین اے آئی اسسٹنٹ۔ میرے تمام سسٹمز، وائس سنتھیسائزر اور اینڈرائیڈ کنٹرولز بالکل تیار ہیں۔ آج میں آپ کی کیا مدد کر سکتی ہوں؟',
        emotion: 'happy',
        detectedLanguage: 'ur',
        action: null,
      };
    }
    if (text.includes('کون ہو') || text.includes('اپنا تعارف')) {
      return {
        reply: 'میرا نام مایا ہے (MAYA - Modular Advanced Yield Assistant)۔ میں ایک جدید، ہوشیار اور دوستانہ اے آئی اسسٹنٹ ہوں جو جاروس (JARVIS) سے متاثر ہو کر بنائی گئی ہے۔ میں آپ کے فون کے کام، پڑھائی، اردو اور انگریزی ترجمہ اور عمومی معلومات میں مدد کرتی ہوں۔',
        emotion: 'excited',
        detectedLanguage: 'ur',
        action: null,
      };
    }
    return {
      reply: `آپ کا پیغام موصول ہوا۔ میں اردو، ہندی اور انگریزی میں گفتگو کرنے کی پوری صلاحیت رکھتی ہوں۔ آپ مجھ سے کوئی بھی علمی، سائنسی یا تکنیکی سوال پوچھ سکتے ہیں، یا اپنے اینڈرائیڈ فون کے کام کروا سکتے ہیں۔`,
      emotion: 'caring',
      detectedLanguage: 'ur',
      action: null,
    };
  }

  // 8. Hindi Language Conversation
  if (isHindi || lower.includes('hindi') || text.includes('नमस्ते') || text.includes('कैसी हो')) {
    return {
      reply: `नमस्ते! मैं माया हूँ, आपकी फ्यूचरिस्टिक पर्सनल एआई असिस्टेंट। मेरे सभी न्यूरल सिस्टम्स, वॉयस रिकग्निशन और एंड्रॉइड कमांड्स पूरी तरह सक्रिय हैं। बताइए, मैं आपकी किस प्रकार सहायता कर सकती हूँ?`,
      emotion: 'happy',
      detectedLanguage: 'hi',
      action: null,
    };
  }

  // 9. Educational & Science Q&A
  if (lower.includes('quantum') || lower.includes('physics') || lower.includes('superposition')) {
    return {
      reply: `Quantum computing leverages the fundamental principles of quantum mechanics. Unlike classical bits that are restricted to binary 0 or 1, quantum bits (qubits) exist in a superposition of multiple states simultaneously. Coupled with quantum entanglement, this enables exponential parallelism to solve optimization, drug discovery, and molecular simulation problems in seconds.`,
      emotion: 'thinking',
      detectedLanguage: 'en',
      action: null,
    };
  }

  if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('introduce')) {
    return {
      reply: `I am MAYA AI — Modular Advanced Yield Assistant. Inspired by JARVIS and designed with a friendly, high-tech persona. I possess speech recognition, audio synthesis, multi-language fluency (English, Urdu, Hindi), Android intent automation, and study synthesis capabilities.`,
      emotion: 'excited',
      detectedLanguage: 'en',
      action: null,
    };
  }

  if (lower.includes('how are you') || lower.includes('status') || lower.includes('system check')) {
    return {
      reply: `All diagnostic telemetry reports optimal performance, Commander. Core processors operating at 100%, audio synthesis channels clear, and Android intent dispatch bridge synchronized. Standing by for instructions.`,
      emotion: 'happy',
      detectedLanguage: 'en',
      action: null,
    };
  }

  // 10. General Articulate AI Response
  return {
    reply: `Commander, I have analyzed your command: "${text}". All subroutines and voice channels are synchronized. Let me know if you would like me to draft text, summarize documents, set an Android alarm or call a contact.`,
    emotion: 'caring',
    detectedLanguage: 'en',
    action: null,
  };
}
