/**
 * AYRA AI — Real-Time Live Voice Conversational System
 * Implements continuous duplex two-way voice conversation with auto-turn detection,
 * immediate voice barge-in interruption, continuous context preservation,
 * and synchronized 3D avatar lip-sync and gestures.
 * @license Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { EmotionType, LanguageCode, ChatMessage } from '../../types/assistant';
import { RealisticMayaAvatar } from '../Avatar/RealisticMayaAvatar';
import { VoiceWaveform } from './VoiceWaveform';
import { VoiceService } from '../../services/voiceService';
import { 
  X, 
  Mic, 
  MicOff, 
  Radio, 
  Square, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Globe, 
  AlertCircle,
  PhoneOff
} from 'lucide-react';

interface LiveVoiceSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onDispatchAction?: (action: any) => void;
  onSaveMessage?: (msg: ChatMessage) => void;
}

export const LiveVoiceSessionModal: React.FC<LiveVoiceSessionModalProps> = ({
  isOpen,
  onClose,
  activeLanguage,
  onLanguageChange,
  onDispatchAction,
  onSaveMessage,
}) => {
  // Session States: 'connecting' | 'listening' | 'thinking' | 'speaking' | 'interrupted'
  const [liveState, setLiveState] = useState<'listening' | 'thinking' | 'speaking'>('listening');
  const [emotion, setEmotion] = useState<EmotionType>('happy');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [interimUserText, setInterimUserText] = useState('');
  const [lastAyraSpeech, setLastAyraSpeech] = useState('');
  const [sessionLogs, setSessionLogs] = useState<Array<{ role: 'user' | 'ayra'; text: string; time: string }>>([
    {
      role: 'ayra',
      text: 'Live voice connection established. I am listening continuously. You can speak freely or interrupt me at any time.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [micError, setMicError] = useState<string | null>(null);

  // Mutable refs to control async events and prevent race conditions
  const isSessionActiveRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      isSessionActiveRef.current = true;
      setMicError(null);
      VoiceService.playHologramTone('activate');
      startContinuousListening();
    } else {
      isSessionActiveRef.current = false;
      stopContinuousListening();
      VoiceService.stopSpeaking();
    }

    return () => {
      isSessionActiveRef.current = false;
      stopContinuousListening();
      VoiceService.stopSpeaking();
    };
  }, [isOpen]);

  // Keep speaking ref in sync
  useEffect(() => {
    isSpeakingRef.current = liveState === 'speaking';
  }, [liveState]);

  // Start continuous microphone listener
  const startContinuousListening = () => {
    if (!isSessionActiveRef.current) return;

    try {
      setLiveState('listening');
      recognitionRef.current = VoiceService.startListening(
        {
          language: activeLanguage,
          continuous: true,
          wakeWordMode: false, // Live mode listens to all spoken input directly
        },
        {
          onStart: () => {
            setMicError(null);
          },
          onResult: (transcript: string, isFinal: boolean) => {
            if (!isSessionActiveRef.current) return;

            // BARGE-IN INTERRUPTION: If user starts speaking while AYRA is speaking, interrupt immediately!
            if (isSpeakingRef.current && transcript.trim().length > 1) {
              VoiceService.stopSpeaking();
              isSpeakingRef.current = false;
              setLiveState('listening');
            }

            if (!isFinal) {
              setInterimUserText(transcript);
            } else {
              setInterimUserText('');
              const userSpeech = transcript.trim();
              if (userSpeech.length > 1) {
                handleUserUtterance(userSpeech);
              }
            }
          },
          onError: (err: string) => {
            if (isSessionActiveRef.current && !isSpeakingRef.current) {
              // Gracefully restart listener if speech recognition ends
              setTimeout(() => {
                if (isSessionActiveRef.current && !isSpeakingRef.current) {
                  startContinuousListening();
                }
              }, 600);
            }
          },
          onEnd: () => {
            // Automatically resume listening if session is active and not currently generating/speaking
            if (isSessionActiveRef.current && !isSpeakingRef.current) {
              setTimeout(() => {
                if (isSessionActiveRef.current && !isSpeakingRef.current) {
                  startContinuousListening();
                }
              }, 400);
            }
          },
        }
      );
    } catch (err: any) {
      setMicError('Microphone hardware access interrupted.');
    }
  };

  const stopContinuousListening = () => {
    VoiceService.stopListening();
    recognitionRef.current = null;
  };

  // Process user utterance through Gemini brain and speak reply
  const handleUserUtterance = async (speechText: string) => {
    if (!speechText || !isSessionActiveRef.current) return;

    // Log to session history
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSessionLogs((prev) => [...prev, { role: 'user', text: speechText, time: userTime }]);

    // Temporarily pause recognition while processing
    stopContinuousListening();
    setLiveState('thinking');
    setEmotion('thinking');

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: speechText,
          history: conversationHistoryRef.current.slice(-8),
          userLanguage: activeLanguage,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "Systems operational. I'm listening.";
      const detectedEmotion = (data.emotion as EmotionType) || 'happy';

      if (!isSessionActiveRef.current) return;

      // Update history
      conversationHistoryRef.current.push(
        { role: 'user', content: speechText },
        { role: 'model', content: reply }
      );

      // Save to main chat if callback provided
      if (onSaveMessage) {
        onSaveMessage({
          id: `live-usr-${Date.now()}`,
          role: 'user',
          text: speechText,
          timestamp: userTime,
          language: activeLanguage,
        });
        onSaveMessage({
          id: `live-asst-${Date.now() + 1}`,
          role: 'assistant',
          text: reply,
          emotion: detectedEmotion,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: data.detectedLanguage || activeLanguage,
        });
      }

      // Check actions
      if (data.action && onDispatchAction) {
        onDispatchAction(data.action);
      }

      setEmotion(detectedEmotion);
      setLastAyraSpeech(reply);
      setSessionLogs((prev) => [
        ...prev,
        {
          role: 'ayra',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Speak out loud with female voice
      setLiveState('speaking');
      VoiceService.speak(reply, {
        language: data.detectedLanguage || activeLanguage,
        rate: 1.05,
        onStart: () => {
          setLiveState('speaking');
        },
        onEnd: () => {
          if (!isSessionActiveRef.current) return;
          // Auto-resume continuous listening when speaking finishes
          setLiveState('listening');
          setEmotion('happy');
          startContinuousListening();
        },
        onError: () => {
          if (!isSessionActiveRef.current) return;
          setLiveState('listening');
          startContinuousListening();
        },
      });
    } catch (err) {
      if (!isSessionActiveRef.current) return;
      setLiveState('listening');
      startContinuousListening();
    }
  };

  // Immediate interrupt button
  const handleInterruptNow = () => {
    VoiceService.stopSpeaking();
    setLiveState('listening');
    startContinuousListening();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-3 sm:p-5 bg-[#030712]/95 backdrop-blur-2xl">
      {/* Top Session Status & Controls */}
      <div className="w-full max-w-2xl flex items-center justify-between py-2 px-4 rounded-2xl bg-black/60 border border-cyan-500/30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className={`w-4 h-4 ${liveState === 'speaking' ? 'text-purple-400 animate-pulse' : 'text-cyan-400'}`} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="text-xs font-hud font-bold text-white tracking-wider">
              AYRA LIVE VOICE MODE
            </div>
            <div className="text-[10px] font-tech text-cyan-400 flex items-center gap-1">
              <span>DUPLEX STREAM ACTIVE</span>
              <span>•</span>
              <span className="uppercase text-emerald-400 font-bold">{liveState}</span>
            </div>
          </div>
        </div>

        {/* Language selector & Close */}
        <div className="flex items-center gap-2">
          <select
            value={activeLanguage}
            onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
            className="bg-[#08132A] border border-cyan-500/30 rounded-xl px-2.5 py-1 text-xs font-tech text-cyan-300 focus:outline-none"
          >
            <option value="auto">Auto Language</option>
            <option value="en">English (US)</option>
            <option value="ur">اردو (Urdu)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white transition-all"
            title="End Live Voice Session"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center 3D Animated Hero Avatar with Dynamic Lip-sync */}
      <div className="flex-1 flex flex-col items-center justify-center my-2 w-full max-w-xl relative">
        <div className="w-full flex justify-center">
          <RealisticMayaAvatar
            emotion={emotion}
            isListening={liveState === 'listening'}
            isSpeaking={liveState === 'speaking'}
            activePose={liveState === 'speaking' ? 'talk' : liveState === 'thinking' ? 'think' : 'idle'}
            size="hero"
            framing="upper"
            showControls={false}
          />
        </div>

        {/* Audio Waveform visualization */}
        <div className="w-full max-w-md mt-2">
          <VoiceWaveform
            isListening={liveState === 'listening'}
            isSpeaking={liveState === 'speaking'}
            height={44}
          />
        </div>
      </div>

      {/* Floating Dynamic Transcripts & Barge-in Controls */}
      <div className="w-full max-w-2xl flex flex-col items-center space-y-3">
        {/* Dynamic Speech HUD Box */}
        <div className="w-full min-h-[70px] p-3 rounded-2xl bg-[#060E22]/90 border border-cyan-500/40 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center text-center">
          {interimUserText ? (
            <div className="text-xs sm:text-sm font-tech text-cyan-200 animate-pulse">
              <span className="text-[10px] font-hud uppercase text-cyan-400 block mb-0.5">Capturing Your Voice:</span>
              "{interimUserText}"
            </div>
          ) : liveState === 'thinking' ? (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-tech text-cyan-300">
              <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
              <span>AYRA Neural Core is processing response...</span>
            </div>
          ) : liveState === 'speaking' ? (
            <div className="text-xs sm:text-sm font-tech text-purple-200 leading-snug">
              <span className="text-[10px] font-hud uppercase text-purple-400 block mb-0.5">AYRA Articulating:</span>
              <p className="line-clamp-2">{lastAyraSpeech}</p>
            </div>
          ) : (
            <div className="text-xs font-tech text-slate-300">
              <span className="text-[10px] font-hud text-emerald-400 uppercase tracking-widest block mb-0.5">
                ● Listening Continuously (Duplex Active)
              </span>
              Speak freely without pressing any button. AYRA will auto-respond when you pause.
            </div>
          )}
        </div>

        {/* Action Controls: Interrupt & End Session */}
        <div className="flex items-center gap-3 w-full justify-center">
          {liveState === 'speaking' && (
            <button
              onClick={handleInterruptNow}
              className="px-5 py-3 rounded-2xl bg-purple-950/90 hover:bg-purple-900 border border-purple-500/50 text-purple-300 font-tech font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/40 transition-all active:scale-95"
            >
              <Square className="w-4 h-4 fill-current text-purple-400" />
              <span>Interrupt AYRA</span>
            </button>
          )}

          {/* End Live Session Button */}
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-hud font-bold text-xs tracking-wider flex items-center gap-2.5 shadow-xl shadow-red-900/50 transition-all active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Live Session</span>
          </button>
        </div>

        {/* Live Conversation Transcript Drawer (Expandable) */}
        <div className="w-full max-h-24 overflow-y-auto px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-tech text-slate-400 space-y-1 scrollbar-none">
          {sessionLogs.slice(-4).map((log, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className={`font-bold shrink-0 ${log.role === 'ayra' ? 'text-purple-400' : 'text-cyan-400'}`}>
                {log.role === 'ayra' ? 'AYRA:' : 'You:'}
              </span>
              <span className="truncate text-slate-300">{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
