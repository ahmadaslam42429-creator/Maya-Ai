/**
 * AYRA AI Voice Service
 * Comprehensive Speech-to-Text (STT) and Text-to-Speech (TTS) manager with Web Audio HUD synthesizer.
 */

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onWakeWord?: () => void;
}

export class VoiceService {
  private static recognition: any = null;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static isSpeaking = false;
  private static audioCtx: AudioContext | null = null;

  /**
   * Synthesize futuristic UI audio chimes using Web Audio API
   */
  static playHologramTone(type: 'activate' | 'listening' | 'confirm' | 'alert') {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioContextClass();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'activate') {
        // Sci-Fi high-tech power-up sweep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.3);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'listening') {
        // High soft chime ping
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(784, now); // G5
        osc.frequency.setValueAtTime(1046.5, now + 0.08); // C6
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'confirm') {
        // Positive harmonic chord
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'alert') {
        // Warning chime
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // AudioContext locked or unsupported
    }
  }

  /**
   * Get available voices
   */
  static getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  /**
   * Find the most pleasing female voice for AYRA
   */
  static selectBestFemaleVoice(language: string = 'en'): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices.length) return null;

    if (language === 'ur') {
      const urduVoice = voices.find(v => v.lang.startsWith('ur') || v.name.toLowerCase().includes('urdu'));
      if (urduVoice) return urduVoice;
      // Urdu speakers often prefer Hindi/Pakistani English voice fallback
      const hindiVoice = voices.find(v => v.lang.startsWith('hi'));
      if (hindiVoice) return hindiVoice;
    }

    if (language === 'hi') {
      const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (hindiVoice) return hindiVoice;
    }

    // Default female voices preference list
    const femaleKeywords = ['female', 'zira', 'samantha', 'karen', 'victoria', 'moira', 'serena', 'tessa', 'fiona', 'eva', 'clara', 'natural'];
    const femaleVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return femaleKeywords.some(kw => name.includes(kw)) && (v.lang.startsWith('en') || !language);
    });

    if (femaleVoice) return femaleVoice;

    // Fallback to any English voice
    const enVoice = voices.find(v => v.lang.startsWith('en'));
    return enVoice || voices[0] || null;
  }

  private static activeAudio: HTMLAudioElement | null = null;

  /**
   * Speak text with Gemini 3.8 Flash Lite TTS natural female voice ('Kore'),
   * falling back smoothly to Web Speech API when offline or unavailable.
   */
  static async speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      volume?: number;
      voiceURI?: string;
      language?: string;
      preferServerTts?: boolean;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): Promise<void> {
    // Stop any ongoing speech immediately
    this.stopSpeaking();

    // Clean text from markdown or code blocks for clean pronunciation
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' [Code segment omitted in speech] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_~#>-]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    // If server TTS is explicitly preferred, try server-side generation
    if (options.preferServerTts === true) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch('/api/gemini/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            text: cleanText,
            voice: 'Kore',
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.audio && data.mimeType) {
            const audioUrl = `data:${data.mimeType};base64,${data.audio}`;
            const audio = new Audio(audioUrl);
            audio.playbackRate = options.rate ?? 1.0;
            audio.volume = options.volume ?? 1.0;
            this.activeAudio = audio;

            audio.onplay = () => {
              this.isSpeaking = true;
              options.onStart?.();
            };

            audio.onended = () => {
              this.isSpeaking = false;
              this.activeAudio = null;
              options.onEnd?.();
            };

            audio.onerror = () => {
              this.isSpeaking = false;
              this.activeAudio = null;
              this.speakBrowserSynthesis(cleanText, options);
            };

            await audio.play();
            return;
          }
        }
      } catch {
        // Fall back seamlessly to client synthesizer
      }
    }

    // Android System WebView does not expose SpeechSynthesis reliably.
    // Use the Android TextToSpeech bridge supplied by MainActivity.
    const nativeBridge = (window as any).AyraNativeBridge;
    if (nativeBridge && typeof nativeBridge.speakText === 'function') {
      const onNativeStart = () => {
        this.isSpeaking = true;
        options.onStart?.();
      };
      const cleanup = () => {
        window.removeEventListener('ayra-tts-start', onNativeStart);
        window.removeEventListener('ayra-tts-end', onNativeEnd);
        window.removeEventListener('ayra-tts-error', onNativeError);
      };
      const onNativeEnd = () => {
        this.isSpeaking = false;
        cleanup();
        options.onEnd?.();
      };
      const onNativeError = (event: Event) => {
        this.isSpeaking = false;
        cleanup();
        options.onError?.((event as CustomEvent).detail || 'Android text-to-speech failed');
        options.onEnd?.();
      };
      window.addEventListener('ayra-tts-start', onNativeStart);
      window.addEventListener('ayra-tts-end', onNativeEnd);
      window.addEventListener('ayra-tts-error', onNativeError);
      try {
        if (nativeBridge.speakText(cleanText, options.language || 'en')) return;
      } catch {
        cleanup();
      }
    }

    // Browser fallback for browsers that implement SpeechSynthesis.
    this.speakBrowserSynthesis(cleanText, options);
  }

  /**
   * Client-side Web Speech API fallback
   */
  private static speakBrowserSynthesis(
    cleanText: string,
    options: {
      rate?: number;
      pitch?: number;
      volume?: number;
      voiceURI?: string;
      language?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): void {
    if (!this.synth) {
      options.onError?.('Speech synthesis unsupported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.rate ?? 1.05;
    utterance.pitch = options.pitch ?? 1.15; // Slightly higher pitch for female assistant persona
    utterance.volume = options.volume ?? 1.0;

    const voices = this.synth.getVoices();
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (options.voiceURI) {
      selectedVoice = voices.find(v => v.voiceURI === options.voiceURI) || null;
    }

    if (!selectedVoice) {
      selectedVoice = this.selectBestFemaleVoice(options.language || 'en');
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else if (options.language === 'ur') {
      utterance.lang = 'ur-PK';
    } else if (options.language === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      options.onError?.(e);
      options.onEnd?.();
    };

    this.synth.speak(utterance);
  }

  /**
   * Stop all ongoing speech immediately (Server audio or Web Speech)
   */
  static stopSpeaking(): void {
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch {}
      this.activeAudio = null;
    }
    if (typeof window !== 'undefined' && (window as any).AyraNativeBridge?.stopSpeaking) {
      try { (window as any).AyraNativeBridge.stopSpeaking(); } catch {}
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
    this.isSpeaking = false;
  }

  /**
   * Check if speech is currently active
   */
  static getSpeakingStatus(): boolean {
    const isAudioPlaying = Boolean(this.activeAudio && !this.activeAudio.paused);
    const isSynthSpeaking = Boolean(this.synth && this.synth.speaking);
    return isAudioPlaying || isSynthSpeaking || this.isSpeaking;
  }

  /**
   * Initialize and start Speech Recognition
   */
  static startListening(
    options: {
      language?: string;
      continuous?: boolean;
      wakeWordMode?: boolean;
      wakeWord?: string;
    },
    handlers: SpeechRecognitionHandlers
  ): any {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      handlers.onError?.('Speech Recognition API is not supported in this browser environment.');
      return null;
    }

    this.stopListening();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = options.continuous ?? false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Map language
      if (options.language === 'ur') {
        recognition.lang = 'ur-PK';
      } else if (options.language === 'hi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-US';
      }

      recognition.onstart = () => {
        handlers.onStart?.();
        this.playHologramTone('listening');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();

        // Check wake word if enabled
        if (options.wakeWordMode) {
          const targetWake = (options.wakeWord || 'ayra').toLowerCase();
          const lower = currentText.toLowerCase();
          if (
            lower.includes(targetWake) ||
            lower.includes('hey ayra') ||
            lower.includes('ayra') ||
            lower.includes('آئرا') ||
            lower.includes('hey maya') ||
            lower.includes('maya')
          ) {
            this.playHologramTone('activate');
            handlers.onWakeWord?.();
          }
        }

        if (finalTranscript) {
          handlers.onResult?.(finalTranscript.trim(), true);
        } else if (interimTranscript) {
          handlers.onResult?.(interimTranscript.trim(), false);
        }
      };

      recognition.onerror = (event: any) => {
        handlers.onError?.(event.error || 'Speech recognition encountered an issue.');
      };

      recognition.onend = () => {
        handlers.onEnd?.();
      };

      recognition.start();
      this.recognition = recognition;
      return recognition;
    } catch (err: any) {
      handlers.onError?.(err?.message || 'Failed to start microphone listener.');
      return null;
    }
  }

  /**
   * Stop active speech listener
   */
  static stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore stop error
      }
      this.recognition = null;
    }
  }
}
