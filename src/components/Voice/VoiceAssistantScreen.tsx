import React from 'react';
import { EmotionType, LanguageCode } from '../../types/assistant';
import { RealisticMayaAvatar } from '../Avatar/RealisticMayaAvatar';
import { VoiceWaveform } from './VoiceWaveform';
import { Mic, MicOff, Square, Sparkles, MessageSquare, Volume2, Shield, Radio } from 'lucide-react';
import { VoiceService } from '../../services/voiceService';

interface VoiceAssistantScreenProps {
  emotion: EmotionType;
  isListening: boolean;
  isSpeaking: boolean;
  onToggleListening: () => void;
  onStopSpeaking: () => void;
  interimTranscript: string;
  lastReply: string;
  activeLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onQuickCommand: (command: string) => void;
  onSwitchToChat: () => void;
}

export const VoiceAssistantScreen: React.FC<VoiceAssistantScreenProps> = ({
  emotion,
  isListening,
  isSpeaking,
  onToggleListening,
  onStopSpeaking,
  interimTranscript,
  lastReply,
  activeLanguage,
  onLanguageChange,
  onQuickCommand,
  onSwitchToChat,
}) => {
  const quickChips = [
    { text: 'How are you today?', label: 'General Check' },
    { text: 'اردو میں اپنا تعارف کروائیں', label: 'Urdu Intro', isUrdu: true },
    { text: 'What is the weather today?', label: 'Weather' },
    { text: 'Set an alarm for 07:00 AM', label: 'Alarm' },
    { text: 'Explain Quantum Computing simply', label: 'Study AI' },
    { text: 'नमस्ते, आप मेरी क्या मदद कर सकती हैं?', label: 'Hindi Check' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-3 max-w-xl mx-auto w-full relative">
      {/* HUD Telemetry Top Bar */}
      <div className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl bg-black/40 border border-cyan-500/20 backdrop-blur-md text-[10px] font-hud text-cyan-400">
        <div className="flex items-center gap-1.5">
          <Radio className={`w-3.5 h-3.5 ${isListening ? 'text-emerald-400 animate-ping' : 'text-cyan-400'}`} />
          <span>FREQ: 142.85 MHz • AUDIO BUFFER ACTIVE</span>
        </div>
        <div className="flex items-center gap-2">
          <span>NEURAL STATUS: OPTIMAL</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </div>
      </div>

      {/* Center 3D Realistic Maya Avatar */}
      <div className="w-full my-2 flex flex-col items-center justify-center">
        <RealisticMayaAvatar
          emotion={emotion}
          isListening={isListening}
          isSpeaking={isSpeaking}
          activePose={isListening ? 'talk' : isSpeaking ? 'talk' : 'sit'}
          size="hero"
          framing="upper"
          showControls={true}
        />
      </div>

      {/* Voice Status & Floating Transcript */}
      <div className="w-full flex flex-col items-center space-y-3">
        {/* Animated Waveform */}
        <VoiceWaveform isListening={isListening} isSpeaking={isSpeaking} height={50} />

        {/* Active Transcript / Last Spoken Text */}
        <div className="w-full min-h-[58px] p-3 rounded-2xl bg-[#060D1F]/90 border border-cyan-500/30 text-center flex flex-col items-center justify-center backdrop-blur-md shadow-xl transition-all">
          {interimTranscript ? (
            <div className="text-xs sm:text-sm font-tech text-cyan-200 animate-pulse leading-snug">
              <span className="text-[10px] font-hud uppercase text-cyan-400 block mb-0.5">Capturing Audio Transmission:</span>
              "{interimTranscript}"
            </div>
          ) : isSpeaking ? (
            <div className="text-xs sm:text-sm font-tech text-purple-200 leading-snug">
              <span className="text-[10px] font-hud uppercase text-purple-400 block mb-0.5">MAYA Articulating:</span>
              <p className="line-clamp-2">{lastReply || 'Synthesizing voice response...'}</p>
            </div>
          ) : (
            <div className="text-xs font-tech text-slate-400">
              <span className="text-[10px] font-hud text-cyan-400 uppercase tracking-widest block mb-0.5">Audio Standby</span>
              Tap the holographic microphone or say "Hey Maya" to initiate speech.
            </div>
          )}
        </div>

        {/* Microphone Controls */}
        <div className="flex items-center gap-4 pt-1">
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="p-3.5 rounded-2xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-tech font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Mute Voice</span>
            </button>
          )}

          {/* Central Glowing Mic Button */}
          <button
            onClick={onToggleListening}
            className={`p-5 rounded-full shadow-2xl transition-all active:scale-95 flex items-center justify-center ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/50 ring-4 ring-red-400/30'
                : 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 hover:from-cyan-300 hover:to-blue-500 shadow-cyan-500/40 hover:shadow-cyan-400/60 ring-4 ring-cyan-500/20'
            }`}
            title={isListening ? 'Stop Listening' : 'Speak to MAYA'}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>

          <button
            onClick={onSwitchToChat}
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-tech font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat View</span>
          </button>
        </div>

        {/* Quick Voice Prompt Chips */}
        <div className="w-full pt-2">
          <div className="text-[10px] font-hud text-slate-400 uppercase tracking-wider text-center mb-2">
            Instant Vocal Commands
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none justify-start sm:justify-center">
            {quickChips.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onQuickCommand(q.text)}
                className={`px-3 py-1.5 rounded-xl border border-white/10 hover:border-cyan-400/50 bg-[#060D1E] hover:bg-cyan-950/40 text-slate-300 hover:text-white text-xs whitespace-nowrap transition-all shrink-0 ${
                  q.isUrdu ? 'font-urdu' : 'font-tech'
                }`}
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
