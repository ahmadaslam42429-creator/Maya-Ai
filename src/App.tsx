/**
 * AYRA AI (آئرا AI) — Master Cockpit & Personal Assistant Coordinator
 * Full Android AI Assistant ecosystem with Google Gemini, photorealistic 3D rigged avatar,
 * natural female voice with real-time duplex live mode, in-app neural browser,
 * camera OCR vision, multi-session conversation vault, and native Android intent bridge.
 * @license Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  EmotionType, 
  LanguageCode, 
  ChatMessage, 
  AssistantAction, 
  VoiceSettings, 
  AvatarPose,
  ChatSession 
} from './types/assistant';
import { MayaAvatar } from './components/Avatar/MayaAvatar';
import { VoiceWaveform } from './components/Voice/VoiceWaveform';
import { VoiceAssistantScreen } from './components/Voice/VoiceAssistantScreen';
import { LiveVoiceSessionModal } from './components/Voice/LiveVoiceSessionModal';
import { FloatingAssistantHead } from './components/Overlay/FloatingAssistantHead';
import { ChatMessageList } from './components/Chat/ChatMessageList';
import { ChatInputBar } from './components/Chat/ChatInputBar';
import { ChatSessionsDrawer } from './components/Chat/ChatSessionsDrawer';
import { BrowserStudio } from './components/Browser/BrowserStudio';
import { AndroidActionCenter } from './components/Android/AndroidActionCenter';
import { ActionConfirmationModal } from './components/Android/ActionConfirmationModal';
import { WeatherWidget } from './components/Tools/WeatherWidget';
import { FuturisticCalculator } from './components/Tools/FuturisticCalculator';
import { StudySummarizer } from './components/Tools/StudySummarizer';
import { NeuralTranslator } from './components/Tools/NeuralTranslator';
import { MemoryNotesManager } from './components/Memory/MemoryNotesManager';
import { SettingsApkStudio } from './components/Settings/SettingsApkStudio';
import { HomeHeroScreen } from './components/Home/HomeHeroScreen';
import { VisionSearchStudio } from './components/Vision/VisionSearchStudio';
import { VoiceService } from './services/voiceService';
import { AndroidIntentService } from './services/androidIntents';
import { processLocalBrainMessage } from './services/localAiBrain';
import { 
  Home,
  Mic, 
  MessageSquare, 
  Wrench, 
  Smartphone, 
  Brain, 
  Settings, 
  Battery, 
  Wifi, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ShieldCheck,
  Compass,
  Calculator as CalcIcon,
  BookOpen,
  Languages,
  Camera,
  Search,
  Globe,
  Radio,
  Plus,
  Layers,
  FolderOpen
} from 'lucide-react';

export default function App() {
  // Navigation Screens
  const [currentScreen, setCurrentScreen] = useState<
    'home' | 'chat' | 'voice' | 'vision' | 'browser' | 'tools' | 'android' | 'memory' | 'settings'
  >('home');
  const [toolsTab, setToolsTab] = useState<'weather' | 'calc' | 'summarizer' | 'translator'>('weather');

  // Real-Time Duplex Live Voice Mode state
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);

  // 3D Avatar Pose State (Persisted)
  const [avatarPose, setAvatarPose] = useState<AvatarPose>(() => {
    try {
      const saved = localStorage.getItem('ayra_avatar_pose') || localStorage.getItem('maya_avatar_pose');
      if (saved) return saved as AvatarPose;
    } catch {}
    return 'sit'; // Default seated workstation pose
  });

  useEffect(() => {
    localStorage.setItem('ayra_avatar_pose', avatarPose);
  }, [avatarPose]);

  // Core Assistant States
  const [emotion, setEmotion] = useState<EmotionType>('happy');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastReply, setLastReply] = useState('Greetings! I am AYRA AI (آئرا AI), your personal assistant. Ready for your command.');
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(null);
  const [activeTheme, setActiveTheme] = useState('navy');

  // Multi-Session Chat Vault
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('ayra_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Migrate from old single-history if present
      const oldHistory = localStorage.getItem('ayra_chat_history') || localStorage.getItem('maya_chat_history');
      if (oldHistory) {
        const oldMessages = JSON.parse(oldHistory);
        if (Array.isArray(oldMessages) && oldMessages.length > 0) {
          return [
            {
              id: 'session-main',
              title: 'Primary Intelligence Stream',
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messages: oldMessages,
            },
          ];
        }
      }
    } catch {}
    return [
      {
        id: 'session-main',
        title: 'Primary Intelligence Stream',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [
          {
            id: 'msg-welcome',
            role: 'assistant',
            text: "Systems online. Greetings Commander! I am AYRA AI — آئرا AI (Advanced Yield & Reasoning Assistant). I can answer complex queries, assist your studies, synthesize documents, navigate web portals in the built-in browser, translate between Urdu, English, and Hindi, and dispatch Android phone tasks like calls, alarms, and app navigation. How may I serve you today?",
            emotion: 'excited',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            language: 'en',
          },
        ],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || 'session-main');
  const [isSessionsDrawerOpen, setIsSessionsDrawerOpen] = useState(false);

  // Active session helper
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  // Voice & Language Settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem('ayra_voice_settings') || localStorage.getItem('maya_voice_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      rate: 1.05,
      pitch: 1.15,
      volume: 1.0,
      voiceURI: '',
      wakeWordEnabled: true,
      autoSpeak: true,
      language: 'en',
    };
  });

  // Telemetry status
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isOnline, setIsOnline] = useState(true);
  const [systemTime, setSystemTime] = useState('');

  // Persist sessions & settings
  useEffect(() => {
    localStorage.setItem('ayra_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('ayra_voice_settings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  // System clock & battery telemetry tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    AndroidIntentService.getDeviceTelemetry().then((tel) => {
      setBatteryLevel(Math.round(tel.batteryLevel * 100));
      setIsOnline(tel.isOnline);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Session management handlers
  const handleCreateSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `Conversation ${sessions.length + 1}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          text: "New conversation initiated. Neural stream calibrated. How may I assist you, Commander?",
          emotion: 'happy',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: voiceSettings.language,
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    VoiceService.playHologramTone('confirm');
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    if (sessions.length <= 1) return;
    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0].id);
    }
  };

  const handleAppendMessageToActive = (msg: ChatMessage) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            messages: [...s.messages, msg],
          };
        }
        return s;
      })
    );
  };

  // Send message to Gemini server API
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Stop speaking any ongoing reply
    VoiceService.stopSpeaking();
    setIsSpeaking(false);

    // Stop listening
    VoiceService.stopListening();
    setIsListening(false);
    setInterimTranscript('');

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: userTime,
      language: voiceSettings.language,
    };

    handleAppendMessageToActive(userMsg);
    setEmotion('thinking');

    try {
      const res = await fetch('https://ayra-ai-new-app.hatchable.site/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-8).map((item) => ({ role: item.role, text: item.text })),
          language: voiceSettings.language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `AYRA chat service returned ${res.status}`);
      const replyText = data.reply || "Transmission acknowledged. All subsystems operational.";
      const detectedEmotion = (data.emotion as EmotionType) || 'happy';
      const detectedLang = data.detectedLanguage || voiceSettings.language;
      const detectedAction = data.action || null;

      setEmotion(detectedEmotion);
      setLastReply(replyText);

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: replyText,
        emotion: detectedEmotion,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: detectedLang,
        action: detectedAction,
      };

      handleAppendMessageToActive(assistantMsg);

      // Handle speech if autoSpeak is active
      if (voiceSettings.autoSpeak) {
        setIsSpeaking(true);
        VoiceService.speak(replyText, {
          rate: voiceSettings.rate,
          pitch: voiceSettings.pitch,
          volume: voiceSettings.volume,
          voiceURI: voiceSettings.voiceURI,
          language: detectedLang,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }

      // Check if action requires explicit confirmation
      if (detectedAction) {
        if (detectedAction.requiresConfirmation) {
          setPendingAction(detectedAction);
        } else {
          executeAndroidAction(detectedAction);
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, executing on-device quantum fallback engine:', err);
      const localResult = processLocalBrainMessage(text, voiceSettings.language);

      setEmotion(localResult.emotion);
      setLastReply(localResult.reply);

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: localResult.reply,
        emotion: localResult.emotion,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: localResult.detectedLanguage,
        action: localResult.action,
      };

      handleAppendMessageToActive(assistantMsg);

      if (voiceSettings.autoSpeak) {
        setIsSpeaking(true);
        VoiceService.speak(localResult.reply, {
          rate: voiceSettings.rate,
          pitch: voiceSettings.pitch,
          volume: voiceSettings.volume,
          language: localResult.detectedLanguage,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }

      if (localResult.action) {
        if (localResult.action.requiresConfirmation) {
          setPendingAction(localResult.action);
        } else {
          executeAndroidAction(localResult.action);
        }
      }
    }
  };

  // Toggle voice recognition
  const handleToggleListening = () => {
    if (isListening) {
      VoiceService.stopListening();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      VoiceService.stopSpeaking();
      setIsSpeaking(false);
      setIsListening(true);

      VoiceService.startListening(
        {
          language: voiceSettings.language,
          continuous: false,
          wakeWordMode: voiceSettings.wakeWordEnabled,
          wakeWord: 'ayra',
        },
        {
          onStart: () => {
            setIsListening(true);
            setEmotion('listening' as any);
          },
          onResult: (transcript, isFinal) => {
            if (isFinal) {
              setIsListening(false);
              setInterimTranscript('');
              handleSendMessage(transcript);
            } else {
              setInterimTranscript(transcript);
            }
          },
          onError: (err) => {
            console.warn('Speech recognition notice:', err);
            setIsListening(false);
            setInterimTranscript('');
          },
          onEnd: () => {
            setIsListening(false);
          },
          onWakeWord: () => {
            VoiceService.playHologramTone('activate');
          },
        }
      );
    }
  };

  const handleStopSpeaking = () => {
    VoiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  // Dispatch and execute Android Native actions
  const executeAndroidAction = (action: AssistantAction) => {
    VoiceService.playHologramTone('confirm');
    AndroidIntentService.vibrate(50);

    switch (action.type) {
      case 'call': {
        const number = action.payload?.number || '';
        if (number) {
          AndroidIntentService.dialNumber(number);
        }
        break;
      }

      case 'alarm': {
        const time = action.payload?.time || '07:00';
        const [h, m] = time.split(':').map((v: string) => parseInt(v, 10));
        AndroidIntentService.setAlarm(isNaN(h) ? 7 : h, isNaN(m) ? 0 : m, action.payload?.label || 'AYRA Wakeup');
        break;
      }

      case 'reminder': {
        AndroidIntentService.sendNotification(
          action.payload?.title || 'Reminder',
          action.payload?.due ? `Due: ${action.payload.due}` : 'Scheduled via AYRA AI'
        );
        break;
      }

      case 'open_app': {
        const appName = action.payload?.appName || '';
        if (appName) {
          AndroidIntentService.openApplication(appName, action.payload?.query || '');
        }
        break;
      }

      case 'open_url': {
        const url = action.payload?.url || '';
        if (url) {
          // Open inside built-in neural browser!
          setCurrentScreen('browser');
        }
        break;
      }

      case 'search': {
        const query = action.payload?.query || '';
        if (query) {
          setCurrentScreen('browser');
        }
        break;
      }

      case 'weather': {
        setCurrentScreen('tools');
        setToolsTab('weather');
        break;
      }

      case 'calculator': {
        setCurrentScreen('tools');
        setToolsTab('calc');
        break;
      }

      case 'note': {
        setCurrentScreen('memory');
        break;
      }

      default:
        console.log('Action dispatched:', action);
    }

    setPendingAction(null);
  };

  const handleClearHistory = () => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [
              {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                text: "Neural memory stream cleared. Contextual buffers reset. How may I assist you today, Commander?",
                emotion: 'happy',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ],
          };
        }
        return s;
      })
    );
    VoiceService.playHologramTone('confirm');
  };

  return (
    <div className="min-h-screen bg-[#040814] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 font-sans relative overflow-x-hidden">
      {/* Background Holographic Grid & Radial Vignette */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-radial-vignette pointer-events-none" />

      {/* Action Confirmation Modal */}
      <ActionConfirmationModal
        action={pendingAction}
        onConfirm={executeAndroidAction}
        onCancel={() => setPendingAction(null)}
      />

      {/* Real-Time Live Duplex Voice Session Modal */}
      <LiveVoiceSessionModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        activeLanguage={voiceSettings.language}
        onLanguageChange={(l) => setVoiceSettings({ ...voiceSettings, language: l })}
        onDispatchAction={(action) => {
          if (action.requiresConfirmation) setPendingAction(action);
          else executeAndroidAction(action);
        }}
        onSaveMessage={handleAppendMessageToActive}
      />

      {/* Multi-Session Chat Vault Drawer */}
      <ChatSessionsDrawer
        isOpen={isSessionsDrawerOpen}
        onClose={() => setIsSessionsDrawerOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={handleCreateSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Universal Floating Assistant & Background Live Voice Overlay (Active over other apps & screens) */}
      <FloatingAssistantHead
        activeLanguage={voiceSettings.language}
        onLanguageChange={(l) => setVoiceSettings({ ...voiceSettings, language: l })}
        onDispatchAction={(action) => {
          if (action.requiresConfirmation) setPendingAction(action);
          else executeAndroidAction(action);
        }}
        onOpenFullApp={(screen) => {
          if (screen) setCurrentScreen(screen as any);
        }}
      />

      {/* TOP SCI-FI COCKPIT HEADER */}
      <header className="sticky top-0 z-40 bg-[#050C1F]/90 border-b border-cyan-500/30 backdrop-blur-xl px-4 py-2.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Mini Avatar */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setCurrentScreen('home')}
              className="cursor-pointer transition-transform hover:scale-105"
            >
              <MayaAvatar
                emotion={emotion}
                isListening={isListening}
                isSpeaking={isSpeaking}
                size="sm"
                interactive={false}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-hud font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 text-glow-cyan">
                  AYRA AI
                </span>
                <span className="text-[9px] font-hud px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  آئرا
                </span>
              </div>
              <div className="text-[10px] font-tech text-cyan-400/80 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span>JARVIS CORE • {voiceSettings.language.toUpperCase()} PROTOCOL</span>
              </div>
            </div>
          </div>

          {/* Center Screen Switcher */}
          <nav className="hidden xl:flex items-center gap-1 bg-[#040816] p-1 rounded-2xl border border-cyan-500/20 shadow-inner">
            {[
              { id: 'home', label: '3D Stage', icon: Home },
              { id: 'chat', label: 'Chat Stream', icon: MessageSquare },
              { id: 'voice', label: 'Voice HUD', icon: Mic },
              { id: 'browser', label: 'In-App Browser', icon: Globe },
              { id: 'vision', label: 'Vision & Search', icon: Camera },
              { id: 'tools', label: 'Tools Matrix', icon: Wrench },
              { id: 'android', label: 'Android Phone', icon: Smartphone },
              { id: 'memory', label: 'Memory Vault', icon: Brain },
              { id: 'settings', label: 'Settings & APK', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = currentScreen === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentScreen(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-tech text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons & Telemetry */}
          <div className="flex items-center gap-2.5 text-xs font-mono">
            {/* Live Voice Button */}
            <button
              onClick={() => {
                VoiceService.playHologramTone('activate');
                setIsLiveVoiceOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-hud font-bold text-[10px] tracking-wider flex items-center gap-1.5 shadow-lg shadow-purple-900/40 ring-2 ring-purple-400/30 active:scale-95 transition-all"
              title="Start real-time two-way AYRA live chat by voice"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
              <span>LIVE CHAT</span>
            </button>

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-cyan-300 font-hud text-[11px]">{systemTime}</span>
              <span className="text-[10px] text-slate-400 font-tech">5G CONNECTED</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#08142E] border border-cyan-500/20 text-cyan-300 text-xs">
              <Battery className="w-3.5 h-3.5 text-cyan-400" />
              <span>{batteryLevel}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-3 sm:p-4 flex flex-col justify-between">
        {/* VIEW 0: 3D Stage / Home Cockpit Screen */}
        {currentScreen === 'home' && (
          <HomeHeroScreen
            emotion={emotion}
            isListening={isListening}
            isSpeaking={isSpeaking}
            onToggleListening={handleToggleListening}
            onStopSpeaking={handleStopSpeaking}
            interimTranscript={interimTranscript}
            lastReply={lastReply}
            activeLanguage={voiceSettings.language}
            onQuickCommand={handleSendMessage}
            onNavigate={(screen) => setCurrentScreen(screen as any)}
            avatarPose={avatarPose}
            onPoseChange={setAvatarPose}
          />
        )}

        {/* VIEW 1: Fullscreen Voice Assistant Screen */}
        {currentScreen === 'voice' && (
          <VoiceAssistantScreen
            emotion={emotion}
            isListening={isListening}
            isSpeaking={isSpeaking}
            onToggleListening={handleToggleListening}
            onStopSpeaking={handleStopSpeaking}
            interimTranscript={interimTranscript}
            lastReply={lastReply}
            activeLanguage={voiceSettings.language}
            onLanguageChange={(l) => setVoiceSettings({ ...voiceSettings, language: l })}
            onQuickCommand={handleSendMessage}
            onSwitchToChat={() => setCurrentScreen('chat')}
            onStartLiveMode={() => setIsLiveVoiceOpen(true)}
          />
        )}

        {/* VIEW 2: In-App Neural Browser */}
        {currentScreen === 'browser' && (
          <BrowserStudio
            onSpeak={(text) => {
              setIsSpeaking(true);
              VoiceService.speak(text, {
                rate: voiceSettings.rate,
                pitch: voiceSettings.pitch,
                volume: voiceSettings.volume,
                language: voiceSettings.language,
                onStart: () => setIsSpeaking(true),
                onEnd: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false),
              });
            }}
            onSendToChat={(text) => {
              handleSendMessage(text);
              setCurrentScreen('chat');
            }}
          />
        )}

        {/* VIEW 3: Optical Vision & Grounded Search Studio */}
        {currentScreen === 'vision' && (
          <VisionSearchStudio
            onSpeak={(text) => {
              setIsSpeaking(true);
              VoiceService.speak(text, {
                rate: voiceSettings.rate,
                pitch: voiceSettings.pitch,
                volume: voiceSettings.volume,
                voiceURI: voiceSettings.voiceURI,
                language: voiceSettings.language,
                onStart: () => setIsSpeaking(true),
                onEnd: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false),
              });
            }}
            onSendToChat={(text) => {
              handleSendMessage(text);
              setCurrentScreen('chat');
            }}
          />
        )}

        {/* VIEW 4: Chat Screen with Multi-Session Vault */}
        {currentScreen === 'chat' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-170px)] sm:h-[calc(100vh-160px)]">
            {/* Session Top Bar */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/20 px-1">
              <div className="flex items-center gap-2 truncate">
                <button
                  onClick={() => setIsSessionsDrawerOpen(true)}
                  className="px-3 py-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 font-tech text-xs flex items-center gap-1.5 transition-all shrink-0"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Chats ({sessions.length})</span>
                </button>
                <span className="text-xs font-tech text-slate-300 truncate font-semibold">
                  {activeSession?.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCreateSession}
                  className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-tech text-xs flex items-center gap-1 transition-all"
                  title="New Conversation"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              </div>
            </div>

            <ChatMessageList
              messages={messages}
              isSpeaking={isSpeaking}
              onExecuteAction={(act) => {
                if (act.requiresConfirmation) setPendingAction(act);
                else executeAndroidAction(act);
              }}
              onSelectSamplePrompt={handleSendMessage}
            />

            <div className="pt-3">
              <ChatInputBar
                onSendMessage={handleSendMessage}
                isListening={isListening}
                isSpeaking={isSpeaking}
                onToggleListening={handleToggleListening}
                onStopSpeaking={handleStopSpeaking}
                interimTranscript={interimTranscript}
                activeLanguage={voiceSettings.language}
                onLanguageChange={(l) => setVoiceSettings({ ...voiceSettings, language: l })}
              />
            </div>
          </div>
        )}

        {/* VIEW 5: Tools & Intelligence Matrix */}
        {currentScreen === 'tools' && (
          <div className="flex-1 flex flex-col space-y-4">
            {/* Tools Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'weather', label: 'Atmospheric Weather', icon: Compass },
                { id: 'calc', label: 'Quantum Calculator', icon: CalcIcon },
                { id: 'summarizer', label: 'Study & Document AI', icon: BookOpen },
                { id: 'translator', label: 'Universal Translator', icon: Languages },
              ].map((t) => {
                const Icon = t.icon;
                const isCurrent = toolsTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setToolsTab(t.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-tech text-xs transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                        : 'bg-[#08122B] border border-cyan-500/20 text-slate-300 hover:text-white hover:border-cyan-400/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tools Panels */}
            {toolsTab === 'weather' && <WeatherWidget defaultCity="Islamabad" />}
            {toolsTab === 'calc' && <FuturisticCalculator />}
            {toolsTab === 'summarizer' && <StudySummarizer />}
            {toolsTab === 'translator' && <NeuralTranslator />}
          </div>
        )}

        {/* VIEW 6: Android Subsystems & Actions */}
        {currentScreen === 'android' && (
          <AndroidActionCenter
            onRequestActionConfirm={(action) => setPendingAction(action)}
          />
        )}

        {/* VIEW 7: Memory & Notes Vault */}
        {currentScreen === 'memory' && (
          <MemoryNotesManager onClearHistory={handleClearHistory} />
        )}

        {/* VIEW 8: Settings & APK Studio */}
        {currentScreen === 'settings' && (
          <SettingsApkStudio
            settings={voiceSettings}
            onUpdateSettings={setVoiceSettings}
            activeTheme={activeTheme}
            onThemeChange={setActiveTheme}
            avatarPose={avatarPose}
            onPoseChange={setAvatarPose}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <footer className="xl:hidden sticky bottom-0 z-40 bg-[#050C1F]/95 border-t border-cyan-500/30 backdrop-blur-xl px-1 py-1.5">
        <div className="grid grid-cols-8 gap-0.5 max-w-lg mx-auto">
          {[
            { id: 'home', label: 'Stage', icon: Home },
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'voice', label: 'Voice', icon: Mic },
            { id: 'browser', label: 'Browser', icon: Globe },
            { id: 'vision', label: 'Vision', icon: Camera },
            { id: 'android', label: 'Device', icon: Smartphone },
            { id: 'tools', label: 'Tools', icon: Wrench },
            { id: 'settings', label: 'APK', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentScreen === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  VoiceService.playHologramTone('listening');
                  AndroidIntentService.vibrate(15);
                  setCurrentScreen(tab.id as any);
                }}
                className={`flex flex-col items-center justify-center py-1 rounded-lg transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 mb-0.5 ${isActive ? 'text-cyan-400' : ''}`} />
                <span className="text-[9px] font-tech">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
