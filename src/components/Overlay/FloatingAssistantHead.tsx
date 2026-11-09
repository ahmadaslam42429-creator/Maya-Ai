/**
 * AYRA AI — Universal Floating Assistant & Background Live Voice Overlay
 * Provides a floating, draggable holographic chat head and Live Voice HUD that stays
 * active over any screen, in-app browser tabs, and other simulated/native applications.
 * @license Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Minimize2, 
  Maximize2, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Layers, 
  Smartphone, 
  Radio, 
  ExternalLink,
  MessageSquare,
  Compass,
  PhoneCall,
  Clock,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { LanguageCode, EmotionType, ChatMessage } from '../../types/assistant';
import { VoiceService } from '../../services/voiceService';
import { AndroidIntentService } from '../../services/androidIntents';
import { processLocalBrainMessage } from '../../services/localAiBrain';

interface FloatingAssistantHeadProps {
  activeLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onDispatchAction?: (action: any) => void;
  onOpenFullApp: (screen?: string) => void;
  userNotesCount?: number;
}

export type SimulatedAppType = 'none' | 'homescreen' | 'whatsapp' | 'youtube' | 'chrome';

export const FloatingAssistantHead: React.FC<FloatingAssistantHeadProps> = ({
  activeLanguage,
  onLanguageChange,
  onDispatchAction,
  onOpenFullApp,
}) => {
  // Floating State
  const [isOverlayEnabled, setIsOverlayEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [inputText, setInputText] = useState('');
  const [recentReply, setRecentReply] = useState('AYRA is ready. Live over apps enabled.');
  const [chatLogs, setChatLogs] = useState<Array<{ role: 'user' | 'ayra'; text: string; time: string }>>([
    {
      role: 'ayra',
      text: 'Floating Live Assistant active. You can talk to me while using other apps.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Simulated Multitasking OS / Other Apps State
  const [simulatedApp, setSimulatedApp] = useState<SimulatedAppType>('none');

  // Draggable position coordinates
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 24, y: 140 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const posStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync isSpeaking ref
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Scroll chat to bottom on new log
  useEffect(() => {
    if (isExpanded) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLogs, isExpanded]);

  // Listen to custom native events
  useEffect(() => {
    const handleNativeTrigger = () => {
      setIsExpanded(true);
      startLiveVoiceListening();
    };
    window.addEventListener('ayra-trigger-live-voice', handleNativeTrigger);
    return () => {
      window.removeEventListener('ayra-trigger-live-voice', handleNativeTrigger);
    };
  }, []);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { x: position.x, y: position.y };

    const handlePointerMove = (ev: PointerEvent) => {
      const dx = ev.clientX - dragStartRef.current.x;
      const dy = ev.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 8) {
        isDraggingRef.current = true;
      }
      const newX = Math.max(10, Math.min(window.innerWidth - 75, posStartRef.current.x - dx));
      const newY = Math.max(60, Math.min(window.innerHeight - 80, posStartRef.current.y + dy));
      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleOrbClick = () => {
    if (!isDraggingRef.current) {
      setIsExpanded(!isExpanded);
      if (!isExpanded) {
        startLiveVoiceListening();
      }
    }
  };

  // Live Duplex Voice Listening
  const startLiveVoiceListening = () => {
    if (isListening) return;
    try {
      setIsListening(true);
      recognitionRef.current = VoiceService.startListening(
        {
          language: activeLanguage,
          continuous: true,
          wakeWordMode: false,
        },
        {
          onStart: () => {
            setIsListening(true);
          },
          onResult: (transcript: string, isFinal: boolean) => {
            // Barge-in interruption: user voice interrupts AYRA instantly!
            if (isSpeakingRef.current && transcript.trim().length > 1) {
              VoiceService.stopSpeaking();
              setIsSpeaking(false);
              isSpeakingRef.current = false;
            }

            if (!isFinal) {
              setInterimText(transcript);
            } else {
              setInterimText('');
              const userSpeech = transcript.trim();
              if (userSpeech.length > 1) {
                processMessage(userSpeech);
              }
            }
          },
          onError: () => {
            setIsListening(false);
          },
          onEnd: () => {
            // Auto restart if expanded and not speaking
            if (!isSpeakingRef.current && isExpanded) {
              setTimeout(() => {
                if (!isSpeakingRef.current && isExpanded) {
                  startLiveVoiceListening();
                }
              }, 400);
            } else {
              setIsListening(false);
            }
          },
        }
      );
    } catch {
      setIsListening(false);
    }
  };

  const stopLiveVoiceListening = () => {
    VoiceService.stopListening();
    recognitionRef.current = null;
    setIsListening(false);
  };

  // Process message via Gemini primary brain
  const processMessage = async (text: string) => {
    if (!text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatLogs((prev) => [...prev, { role: 'user', text, time: timeStr }]);
    setIsThinking(true);

    try {
      // Call primary Gemini backend
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          language: activeLanguage,
          systemInstruction: 'You are AYRA AI, an advanced Android personal assistant operating in floating overlay mode. The user may be using another app simultaneously. Give concise, direct, helpful answers.',
        }),
      });

      let reply = '';
      if (response.ok) {
        const data = await response.json();
        reply = data.reply || 'Task processed successfully.';
      } else {
        const local = processLocalBrainMessage(text, activeLanguage);
        reply = local.reply;
      }

      setRecentReply(reply);
      setChatLogs((prev) => [
        ...prev,
        {
          role: 'ayra',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsThinking(false);
      setIsSpeaking(true);
      isSpeakingRef.current = true;

      // Speak response using female voice
      await VoiceService.speak(reply, {
        language: activeLanguage,
        rate: 1.05,
        onStart: () => {
          setIsSpeaking(true);
          isSpeakingRef.current = true;
        },
        onEnd: () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          // Auto resume listening
          if (isExpanded) {
            startLiveVoiceListening();
          }
        },
        onError: () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          if (isExpanded) {
            startLiveVoiceListening();
          }
        },
      });
    } catch {
      setIsThinking(false);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      const q = inputText.trim();
      setInputText('');
      processMessage(q);
    }
  };

  // Trigger Native Android Overlay
  const handleEnableNativeOverlay = () => {
    const started = AndroidIntentService.startFloatingAssistant();
    if (!started) {
      AndroidIntentService.requestOverlayPermission();
    }
  };

  if (!isOverlayEnabled) {
    return (
      <button
        onClick={() => setIsOverlayEnabled(true)}
        className="fixed bottom-20 right-4 z-40 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-1.5 backdrop-blur shadow-lg shadow-cyan-950/50 hover:bg-cyan-900/80 transition"
      >
        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>Enable Floating AYRA</span>
      </button>
    );
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. SIMULATED OTHER APPS (MULTITASKING TEST SUITE)                         */}
      {/* Allows testing live chat over WhatsApp, YouTube, Chrome, or Android Home  */}
      {/* ========================================================================= */}
      {simulatedApp !== 'none' && (
        <div className="fixed inset-0 z-40 bg-black flex flex-col animate-in fade-in duration-200">
          {/* Top Android Status Bar */}
          <div className="h-7 bg-black/80 px-4 flex items-center justify-between text-[11px] text-zinc-400 font-mono select-none border-b border-zinc-900">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                Overlay Active
              </span>
              <span>5G</span>
              <span>85%</span>
            </div>
          </div>

          {/* App Switcher Banner */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-700 text-xs">
            <div className="flex items-center gap-2 text-zinc-200">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-zinc-100">
                {simulatedApp === 'homescreen' && 'Android Home Screen'}
                {simulatedApp === 'whatsapp' && 'WhatsApp Messenger'}
                {simulatedApp === 'youtube' && 'YouTube Video Stream'}
                {simulatedApp === 'chrome' && 'Google Chrome Browser'}
              </span>
              <span className="text-zinc-400 text-[11px] hidden sm:inline">
                (AYRA is closed in background — Floating live chat active)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSimulatedApp('none')}
                className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 flex items-center gap-1 transition"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Return to AYRA App</span>
              </button>
            </div>
          </div>

          {/* Simulated App Content */}
          <div className="flex-1 overflow-auto relative">
            {/* ANDROID HOME SCREEN */}
            {simulatedApp === 'homescreen' && (
              <div className="h-full w-full bg-gradient-to-b from-blue-950 via-slate-900 to-black p-6 flex flex-col justify-between select-none">
                <div className="pt-8 text-center">
                  <h1 className="text-5xl font-light text-white tracking-wider">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </h1>
                  <p className="text-cyan-300 text-sm mt-1">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-6 max-w-md mx-auto w-full my-auto">
                  <div 
                    onClick={() => setSimulatedApp('whatsapp')}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-105 transition">
                      💬
                    </div>
                    <span className="text-xs text-white">WhatsApp</span>
                  </div>
                  <div 
                    onClick={() => setSimulatedApp('youtube')}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-105 transition">
                      ▶️
                    </div>
                    <span className="text-xs text-white">YouTube</span>
                  </div>
                  <div 
                    onClick={() => setSimulatedApp('chrome')}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-105 transition">
                      🌐
                    </div>
                    <span className="text-xs text-white">Chrome</span>
                  </div>
                  <div 
                    onClick={() => setSimulatedApp('none')}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-cyan-600 border border-cyan-400 flex items-center justify-center text-white text-xl shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition">
                      آئرا
                    </div>
                    <span className="text-xs text-cyan-300 font-medium">AYRA AI</span>
                  </div>
                </div>

                <div className="text-center text-xs text-zinc-400 pb-4">
                  Notice AYRA's floating bubble floating on the side — tap or talk to ask anything!
                </div>
              </div>
            )}

            {/* WHATSAPP SIMULATION */}
            {simulatedApp === 'whatsapp' && (
              <div className="h-full w-full bg-[#0b141a] text-zinc-100 flex flex-col">
                <div className="bg-[#202c33] p-3.5 flex items-center justify-between border-b border-zinc-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold">
                      A
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Ahmad Aslam</h3>
                      <p className="text-[11px] text-emerald-400">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button 
                      onClick={() => setSimulatedApp('homescreen')}
                      className="text-zinc-400 hover:text-white px-2 py-1"
                    >
                      Home
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  <div className="bg-[#202c33] p-3 rounded-lg max-w-[75%] text-xs">
                    Hey Ahmad! Are you ready for the meeting today?
                    <span className="block text-[10px] text-zinc-400 text-right mt-1">10:42 AM</span>
                  </div>
                  <div className="bg-[#005c4b] p-3 rounded-lg max-w-[75%] ml-auto text-xs">
                    Yes, I am using AYRA AI assistant live in the overlay to prepare the agenda!
                    <span className="block text-[10px] text-emerald-200 text-right mt-1">10:45 AM</span>
                  </div>
                  <div className="bg-[#202c33] p-3 rounded-lg max-w-[75%] text-xs">
                    Awesome, ask her to summarize the bullet points!
                    <span className="block text-[10px] text-zinc-400 text-right mt-1">10:46 AM</span>
                  </div>
                </div>

                <div className="p-3 bg-[#202c33] flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message in WhatsApp..."
                    className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-xs text-white placeholder-zinc-400 outline-none"
                    readOnly
                    value="Type here or use AYRA's floating mic..."
                  />
                  <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                    <Send className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

            {/* YOUTUBE SIMULATION */}
            {simulatedApp === 'youtube' && (
              <div className="h-full w-full bg-[#0f0f0f] text-white flex flex-col">
                <div className="w-full aspect-video bg-black relative flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center mx-auto mb-2 shadow-xl shadow-red-950">
                      ▶
                    </div>
                    <p className="text-sm font-semibold">Artificial Intelligence & Next-Gen Android Assistants</p>
                    <p className="text-xs text-zinc-400">Stream Playing 1080p 60fps</p>
                  </div>
                </div>
                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                  <h2 className="font-bold text-base">Building Real-Time Multimodal Personal AI with Gemini</h2>
                  <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-3">
                    <span>1.2M views • 2 days ago</span>
                    <button 
                      onClick={() => setSimulatedApp('homescreen')}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white"
                    >
                      Exit to Home
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                    <span className="text-cyan-400 font-semibold">AYRA Live Voice Overlay Tip:</span> You can watch this video while AYRA's floating chat bubble listens and answers questions without stopping playback!
                  </div>
                </div>
              </div>
            )}

            {/* CHROME SIMULATION */}
            {simulatedApp === 'chrome' && (
              <div className="h-full w-full bg-zinc-900 text-white flex flex-col">
                <div className="bg-zinc-800 p-2.5 flex items-center gap-2 border-b border-zinc-700">
                  <div className="flex-1 bg-zinc-700 rounded-full px-4 py-1.5 text-xs text-zinc-300 flex items-center gap-2">
                    <span className="text-zinc-400">🔒</span>
                    <span>https://en.wikipedia.org/wiki/Artificial_intelligence</span>
                  </div>
                  <button 
                    onClick={() => setSimulatedApp('homescreen')}
                    className="text-xs text-zinc-400 hover:text-white px-2"
                  >
                    Home
                  </button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-4 max-w-2xl mx-auto text-xs text-zinc-300">
                  <h1 className="text-2xl font-bold text-white">Artificial Intelligence</h1>
                  <p>
                    Artificial intelligence (AI) is the intelligence of machines or software, as opposed to the intelligence of living beings, primarily of humans. It is a field of study in computer science that develops and studies intelligent machines.
                  </p>
                  <p>
                    Modern personal assistants like AYRA AI utilize neural language models and real-time duplex speech architectures to converse continuously across application boundaries.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DRAGGABLE FLOATING AYRA HOLOGRAPHIC ORB (CHAT HEAD)                   */}
      {/* ========================================================================= */}
      {!isExpanded && (
        <div
          style={{
            right: `${position.x}px`,
            top: `${position.y}px`,
          }}
          onPointerDown={handlePointerDown}
          onClick={handleOrbClick}
          className="fixed z-50 cursor-grab active:cursor-grabbing select-none group"
          title="Drag anywhere or click for AYRA Live Voice Overlay"
        >
          {/* Animated Glow Halo */}
          <div
            className={`absolute -inset-2 rounded-full blur-md opacity-75 transition-all duration-300 ${
              isSpeaking
                ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 animate-pulse'
                : isThinking
                ? 'bg-gradient-to-r from-amber-400 to-cyan-400 animate-spin'
                : isListening
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 animate-ping'
                : 'bg-cyan-500/40 group-hover:bg-cyan-400/60'
            }`}
          />

          {/* Central Holographic Head */}
          <div className="relative w-15 h-15 rounded-full bg-[#040c1a] border-2 border-cyan-400/90 shadow-2xl shadow-cyan-500/50 flex flex-col items-center justify-center overflow-hidden backdrop-blur-md">
            {/* Holographic Scanline */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent pointer-events-none" />

            {/* Avatar or State Animation */}
            {isSpeaking ? (
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-3.5 bg-cyan-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-3.5 bg-cyan-300 rounded-full animate-bounce" />
              </div>
            ) : isListening ? (
              <div className="relative flex items-center justify-center">
                <span className="w-7 h-7 rounded-full border border-cyan-400 animate-ping absolute" />
                <Mic className="w-5 h-5 text-cyan-300 animate-pulse" />
              </div>
            ) : isThinking ? (
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            ) : (
              <div className="text-center">
                <span className="text-cyan-300 font-bold text-sm tracking-tight block">آئرا</span>
                <span className="text-[9px] text-cyan-500/80 font-mono block -mt-1">LIVE</span>
              </div>
            )}

            {/* Micro Live Dot */}
            <span
              className={`absolute top-1 right-2 w-2 h-2 rounded-full ${
                isListening ? 'bg-emerald-400' : isSpeaking ? 'bg-cyan-400' : 'bg-cyan-600'
              }`}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EXPANDED FLOATING LIVE CHAT & VOICE HUD                               */}
      {/* ========================================================================= */}
      {isExpanded && (
        <div
          style={{
            right: `${Math.min(window.innerWidth - 340, Math.max(10, position.x))}px`,
            top: `${Math.min(window.innerHeight - 480, Math.max(20, position.y - 40))}px`,
          }}
          className="fixed z-50 w-[340px] max-w-[94vw] bg-[#040c1af2] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/90 backdrop-blur-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Header Drag Handle & Controls */}
          <div
            onPointerDown={handlePointerDown}
            className="p-3 bg-gradient-to-r from-cyan-950/80 via-[#071329] to-cyan-950/80 border-b border-cyan-500/30 flex items-center justify-between cursor-move select-none"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                <span className="text-xs font-bold text-cyan-300">آئرا</span>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  AYRA AI Floating Live
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <p className="text-[10px] text-cyan-400 font-mono">
                  {isSpeaking ? 'AYRA Speaking...' : isThinking ? 'Processing...' : isListening ? 'Listening Continuously' : 'Ready'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-cyan-950/60 transition"
                title="Minimize to Floating Bubble"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  stopLiveVoiceListening();
                  setIsExpanded(false);
                }}
                className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-cyan-950/60 transition"
                title="End Session"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Multitasking & Android Floating Controls Bar */}
          <div className="px-3 py-1.5 bg-black/40 border-b border-cyan-900/40 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulate Other App:</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSimulatedApp(simulatedApp === 'whatsapp' ? 'none' : 'whatsapp')}
                className={`px-2 py-0.5 rounded text-[10px] transition ${
                  simulatedApp === 'whatsapp' ? 'bg-emerald-600 text-white font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                WhatsApp
              </button>
              <button
                onClick={() => setSimulatedApp(simulatedApp === 'youtube' ? 'none' : 'youtube')}
                className={`px-2 py-0.5 rounded text-[10px] transition ${
                  simulatedApp === 'youtube' ? 'bg-red-600 text-white font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                YouTube
              </button>
              <button
                onClick={() => setSimulatedApp(simulatedApp === 'homescreen' ? 'none' : 'homescreen')}
                className={`px-2 py-0.5 rounded text-[10px] transition ${
                  simulatedApp === 'homescreen' ? 'bg-blue-600 text-white font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Home
              </button>
            </div>
          </div>

          {/* Conversation Transcript Logs */}
          <div className="p-3 max-h-56 min-h-[140px] overflow-y-auto space-y-2 text-xs">
            {chatLogs.map((log, index) => (
              <div
                key={index}
                className={`flex flex-col ${log.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[85%] leading-relaxed ${
                    log.role === 'user'
                      ? 'bg-cyan-600/30 text-cyan-100 border border-cyan-500/40 rounded-br-xs'
                      : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-bl-xs'
                  }`}
                >
                  <p>{log.text}</p>
                  <span className="block text-[9px] text-zinc-400 mt-1 text-right">{log.time}</span>
                </div>
              </div>
            ))}

            {/* Interim live speech recognition streaming pill */}
            {interimText && (
              <div className="flex justify-end">
                <div className="px-3 py-1.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 italic text-xs animate-pulse">
                  {interimText}...
                </div>
              </div>
            )}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex items-center gap-2 text-amber-300 text-xs py-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>AYRA is processing with Gemini brain...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Barge-in Speech Control Bar */}
          {isSpeaking && (
            <div className="px-3 py-1 bg-cyan-950/60 border-t border-cyan-900/40 flex items-center justify-between text-xs text-cyan-300">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                <span className="text-[11px]">AYRA is speaking (Say anything to interrupt)</span>
              </div>
              <button
                onClick={() => {
                  VoiceService.stopSpeaking();
                  setIsSpeaking(false);
                  isSpeakingRef.current = false;
                  startLiveVoiceListening();
                }}
                className="px-2 py-0.5 rounded bg-red-950 text-red-300 hover:bg-red-900 border border-red-700/60 text-[10px]"
              >
                Stop Speech
              </button>
            </div>
          )}

          {/* Quick Action Chips */}
          <div className="px-3 py-1.5 bg-black/30 border-t border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => processMessage('What is on my schedule today?')}
              className="px-2 py-1 rounded-full bg-zinc-800/80 text-zinc-300 hover:bg-cyan-950 hover:text-cyan-300 border border-zinc-700 transition whitespace-nowrap"
            >
              📅 Schedule
            </button>
            <button
              onClick={() => processMessage('Set an alarm for 7:00 AM')}
              className="px-2 py-1 rounded-full bg-zinc-800/80 text-zinc-300 hover:bg-cyan-950 hover:text-cyan-300 border border-zinc-700 transition whitespace-nowrap"
            >
              ⏰ Alarm
            </button>
            <button
              onClick={() => processMessage('Tell me something interesting in Urdu')}
              className="px-2 py-1 rounded-full bg-zinc-800/80 text-zinc-300 hover:bg-cyan-950 hover:text-cyan-300 border border-zinc-700 transition whitespace-nowrap"
            >
              🇵🇰 اردو میں بولو
            </button>
            <button
              onClick={() => {
                onOpenFullApp();
                setIsExpanded(false);
              }}
              className="px-2 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-900 transition whitespace-nowrap flex items-center gap-1"
            >
              <span>Full App</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Chat & Voice Input Bar */}
          <form
            onSubmit={handleManualSubmit}
            className="p-2.5 bg-[#050f21] border-t border-cyan-500/30 flex items-center gap-2"
          >
            {/* Live Continuous Mic Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  stopLiveVoiceListening();
                } else {
                  startLiveVoiceListening();
                }
              }}
              className={`p-2 rounded-xl transition ${
                isListening
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/40 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title={isListening ? 'Microphone Active (Continuous Live Mode)' : 'Start Microphone'}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            {/* Input field */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? "Listening... or type message" : "Type prompt or tap mic..."}
              className="flex-1 bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Android System Alert Window Note */}
          <div className="px-3 py-1 bg-black/80 text-[10px] text-zinc-400 border-t border-zinc-900 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>Android SYSTEM_ALERT_WINDOW</span>
            </span>
            <button
              onClick={handleEnableNativeOverlay}
              className="text-cyan-400 hover:underline"
            >
              System Permissions
            </button>
          </div>
        </div>
      )}
    </>
  );
};
