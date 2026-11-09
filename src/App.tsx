/**
 * MAYA AI — Master Cockpit & Personal Assistant Coordinator
 * @license Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { EmotionType, LanguageCode, ChatMessage, AssistantAction, VoiceSettings } from './types/assistant';
import { MayaAvatar } from './components/Avatar/MayaAvatar';
import { VoiceWaveform } from './components/Voice/VoiceWaveform';
import { VoiceAssistantScreen } from './components/Voice/VoiceAssistantScreen';
import { ChatMessageList } from './components/Chat/ChatMessageList';
import { ChatInputBar } from './components/Chat/ChatInputBar';
import { AndroidActionCenter } from './components/Android/AndroidActionCenter';
import { ActionConfirmationModal } from './components/Android/ActionConfirmationModal';
import { WeatherWidget } from './components/Tools/WeatherWidget';
import { FuturisticCalculator } from './components/Tools/FuturisticCalculator';
import { StudySummarizer } from './components/Tools/StudySummarizer';
import { NeuralTranslator } from './components/Tools/NeuralTranslator';
import { MemoryNotesManager } from './components/Memory/MemoryNotesManager';
import { SettingsApkStudio } from './components/Settings/SettingsApkStudio';
import { VoiceService } from './services/voiceService';
import { AndroidIntentService } from './services/androidIntents';
import { 
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
  Languages
} from 'lucide-react';

export default function App() {
  // Navigation Screens
  const [currentScreen, setCurrentScreen] = useState<'voice' | 'chat' | 'tools' | 'android' | 'memory' | 'settings'>('voice');
  const [toolsTab, setToolsTab] = useState<'weather' | 'calc' | 'summarizer' | 'translator'>('weather');

  // Core Assistant States
  const [emotion, setEmotion] = useState<EmotionType>('happy');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastReply, setLastReply] = useState('Greetings! I am MAYA AI, your futuristic personal assistant. Ready for your command.');
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(null);
  const [activeTheme, setActiveTheme] = useState('navy');

  // Voice & Language Settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem('maya_voice_settings');
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

  // Conversation Stream
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('maya_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        text: "Systems online. Greetings Commander! I am MAYA AI (Modular Advanced Yield Assistant). I can answer complex queries, assist your studies, synthesize documents, translate between Urdu, English and Hindi, and dispatch Android phone tasks like calls, alarms, and app navigation. How may I serve you today?",
        emotion: 'excited',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: 'en',
      },
    ];
  });

  // Telemetry status
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isOnline, setIsOnline] = useState(true);
  const [systemTime, setSystemTime] = useState('');

  // Save settings & chat
  useEffect(() => {
    localStorage.setItem('maya_voice_settings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  useEffect(() => {
    localStorage.setItem('maya_chat_history', JSON.stringify(messages));
  }, [messages]);

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

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: voiceSettings.language,
    };

    setMessages((prev) => [...prev, userMsg]);
    setEmotion('thinking');

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-8),
          userLanguage: voiceSettings.language,
        }),
      });

      const data = await res.json();
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

      setMessages((prev) => [...prev, assistantMsg]);

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
      console.error(err);
      setEmotion('confused');
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: "I encountered a synchronization pause with my neural cloud. Verifying connectivity...",
        emotion: 'confused',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  // Toggle Microphone / Speech Recognition
  const handleToggleListening = () => {
    if (isListening) {
      VoiceService.stopListening();
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    VoiceService.stopSpeaking();
    setIsSpeaking(false);
    setIsListening(true);
    setEmotion('thinking');

    VoiceService.startListening(
      {
        language: voiceSettings.language,
        continuous: false,
        wakeWordMode: voiceSettings.wakeWordEnabled,
      },
      {
        onStart: () => {
          setIsListening(true);
        },
        onResult: (transcript, isFinal) => {
          setInterimTranscript(transcript);
          if (isFinal) {
            handleSendMessage(transcript);
          }
        },
        onError: (err) => {
          console.warn('Speech Rec Error:', err);
          setIsListening(false);
          setInterimTranscript('');
        },
        onEnd: () => {
          setIsListening(false);
        },
        onWakeWord: () => {
          setEmotion('excited');
        },
      }
    );
  };

  // Stop speaking
  const handleStopSpeaking = () => {
    VoiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  // Execute confirmed Android action
  const executeAndroidAction = (action: AssistantAction) => {
    VoiceService.playHologramTone('confirm');
    AndroidIntentService.vibrate([80, 40, 80]);

    switch (action.type) {
      case 'call': {
        const num = action.payload?.number;
        if (num) {
          AndroidIntentService.dialNumber(num);
        }
        break;
      }

      case 'alarm': {
        const time = action.payload?.time;
        AndroidIntentService.openApplication('alarm', time);
        AndroidIntentService.sendNotification('Alarm Scheduled', `MAYA scheduled alarm for ${time}`);
        break;
      }

      case 'reminder': {
        const title = action.payload?.title || action.title;
        AndroidIntentService.sendNotification('Reminder Alert', title);
        break;
      }

      case 'open_app': {
        const appName = action.payload?.appName;
        if (appName) {
          AndroidIntentService.openApplication(appName, action.payload?.query);
        }
        break;
      }

      case 'open_url': {
        const url = action.payload?.url;
        if (url) {
          AndroidIntentService.openURL(url);
        }
        break;
      }

      case 'search': {
        const query = action.payload?.query;
        if (query) {
          AndroidIntentService.searchWeb(query);
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
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        text: "Neural memory stream cleared. Contextual buffers reset. How may I assist you today, Commander?",
        emotion: 'happy',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    localStorage.removeItem('maya_chat_history');
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

      {/* TOP SCI-FI COCKPIT HEADER */}
      <header className="sticky top-0 z-40 bg-[#050C1F]/90 border-b border-cyan-500/30 backdrop-blur-xl px-4 py-2.5 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Mini Avatar */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setCurrentScreen('voice')}
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
                  MAYA AI
                </span>
                <span className="text-[9px] font-hud px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  v2.5
                </span>
              </div>
              <div className="text-[10px] font-tech text-cyan-400/80 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span>JARVIS CORE • {voiceSettings.language.toUpperCase()} PROTOCOL</span>
              </div>
            </div>
          </div>

          {/* Center Screen Switcher (HUD / Chat / Tools / Android / Vault / APK) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#040816] p-1 rounded-2xl border border-cyan-500/20 shadow-inner">
            {[
              { id: 'voice', label: 'Voice HUD', icon: Mic },
              { id: 'chat', label: 'Chat Stream', icon: MessageSquare },
              { id: 'tools', label: 'Tools Matrix', icon: Wrench },
              { id: 'android', label: 'Android Intents', icon: Smartphone },
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

          {/* Right System Telemetry */}
          <div className="flex items-center gap-3 text-xs font-mono">
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
      <main className="flex-1 max-w-5xl mx-auto w-full p-3 sm:p-4 flex flex-col justify-between">
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
          />
        )}

        {/* VIEW 2: Chat Screen */}
        {currentScreen === 'chat' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-170px)] sm:h-[calc(100vh-160px)]">
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

        {/* VIEW 3: Tools & Intelligence Matrix */}
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

        {/* VIEW 4: Android Subsystems & Actions */}
        {currentScreen === 'android' && (
          <AndroidActionCenter
            onRequestActionConfirm={(action) => setPendingAction(action)}
          />
        )}

        {/* VIEW 5: Memory & Notes Vault */}
        {currentScreen === 'memory' && (
          <MemoryNotesManager onClearHistory={handleClearHistory} />
        )}

        {/* VIEW 6: Settings & APK Studio */}
        {currentScreen === 'settings' && (
          <SettingsApkStudio
            settings={voiceSettings}
            onUpdateSettings={setVoiceSettings}
            activeTheme={activeTheme}
            onThemeChange={setActiveTheme}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <footer className="md:hidden sticky bottom-0 z-40 bg-[#050C1F]/95 border-t border-cyan-500/30 backdrop-blur-xl px-2 py-2">
        <div className="grid grid-cols-6 gap-1">
          {[
            { id: 'voice', label: 'HUD', icon: Mic },
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'tools', label: 'Tools', icon: Wrench },
            { id: 'android', label: 'Phone', icon: Smartphone },
            { id: 'memory', label: 'Memory', icon: Brain },
            { id: 'settings', label: 'APK', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentScreen === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  VoiceService.playHologramTone('listening');
                  AndroidIntentService.vibrate(20);
                  setCurrentScreen(tab.id as any);
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-cyan-400' : ''}`} />
                <span className="text-[10px] font-tech">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
