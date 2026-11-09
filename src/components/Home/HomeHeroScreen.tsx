/**
 * MAYA AI — Master Home Cockpit & Hero Avatar Stage
 * Central 3D Avatar presentation, immediate voice dispatch, and system shortcuts
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { RealisticMayaAvatar } from '../Avatar/RealisticMayaAvatar';
import { EmotionType, AvatarPose, AvatarPosition, AvatarSize, AvatarFraming } from '../../types/assistant';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  PhoneCall, 
  Clock, 
  Camera, 
  Search, 
  Globe, 
  Compass, 
  Sparkles,
  MessageSquare,
  Wrench,
  Brain,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface HomeHeroScreenProps {
  emotion: EmotionType;
  isListening: boolean;
  isSpeaking: boolean;
  onToggleListening: () => void;
  onStopSpeaking: () => void;
  interimTranscript: string;
  lastReply: string;
  activeLanguage: string;
  onQuickCommand: (command: string) => void;
  onNavigate: (screen: 'home' | 'chat' | 'voice' | 'vision' | 'history' | 'settings') => void;
  avatarPose: AvatarPose;
  onPoseChange: (pose: AvatarPose) => void;
}

export const HomeHeroScreen: React.FC<HomeHeroScreenProps> = ({
  emotion,
  isListening,
  isSpeaking,
  onToggleListening,
  onStopSpeaking,
  interimTranscript,
  lastReply,
  activeLanguage,
  onQuickCommand,
  onNavigate,
  avatarPose,
  onPoseChange,
}) => {
  const [avatarPosition, setAvatarPosition] = useState<AvatarPosition>('center');
  const [avatarSize, setAvatarSize] = useState<AvatarSize>('hero');
  const [avatarFraming, setAvatarFraming] = useState<AvatarFraming>('upper');
  const [isAvatarVisible, setIsAvatarVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const quickShortcuts = [
    { label: 'Voice Command', icon: Mic, action: () => onToggleListening(), color: 'from-cyan-500 to-blue-600' },
    { label: 'Optical Vision', icon: Camera, action: () => onNavigate('vision'), color: 'from-purple-500 to-pink-600' },
    { label: 'Web Search', icon: Search, action: () => onNavigate('vision'), color: 'from-blue-500 to-indigo-600' },
    { label: 'Weather Telemetry', icon: Compass, action: () => onQuickCommand('What is the weather today?'), color: 'from-teal-500 to-emerald-600' },
    { label: 'Urdu Dialogue', icon: Globe, action: () => onQuickCommand('ہیلو مایا، کیسی ہو؟ اپنا تعارف کرواؤ۔'), color: 'from-amber-500 to-orange-600' },
    { label: 'Phone Dial Intent', icon: PhoneCall, action: () => onQuickCommand('Call emergency services or contact'), color: 'from-rose-500 to-red-600' },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between space-y-4 max-w-4xl mx-auto w-full pb-2">
      {/* Top Holographic Greeting Banner */}
      <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-[#061028]/80 border border-cyan-500/20 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-hud text-cyan-300 tracking-wider">
            JARVIS CORE ONLINE • PROTOCOL: {activeLanguage.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-tech text-slate-400">
          <span className="px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
            3D AVATAR ACTIVE
          </span>
        </div>
      </div>

      {/* CENTRAL 3D AVATAR HERO STAGE */}
      {isAvatarVisible ? (
        <div className="flex flex-col items-center justify-center">
          <RealisticMayaAvatar
            emotion={emotion}
            isListening={isListening}
            isSpeaking={isSpeaking}
            activePose={avatarPose}
            onPoseChange={onPoseChange}
            position={avatarPosition}
            size={avatarSize}
            framing={avatarFraming}
            showControls={true}
            interactive={true}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
            isExpanded={isExpanded}
          />
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-[#060E24]/60 border border-dashed border-cyan-500/30 flex flex-col items-center justify-center text-center">
          <Sparkles className="w-8 h-8 text-cyan-400 mb-2" />
          <h4 className="font-hud text-sm text-white mb-1">Avatar Minimized</h4>
          <p className="text-xs text-slate-400 font-tech mb-3">The 3D character is hidden to prioritize high-speed text stream.</p>
          <button
            onClick={() => setIsAvatarVisible(true)}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-hud text-xs font-bold shadow-md"
          >
            RESTORE AVATAR
          </button>
        </div>
      )}

      {/* Real-time Voice / Response HUD Bubble */}
      <div className="p-3.5 rounded-2xl bg-[#050C1F]/90 border border-cyan-500/30 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-hud text-cyan-400 uppercase tracking-widest">
              {isListening ? '🎙️ Listening to Voice Command...' : isSpeaking ? '🔊 MAYA Vocalizing...' : '💬 Assistant Status'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isSpeaking && (
              <button
                onClick={onStopSpeaking}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-[10px] font-tech transition-colors"
              >
                <VolumeX className="w-3 h-3" />
                <span>Stop Voice</span>
              </button>
            )}
            <button
              onClick={onToggleListening}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-tech transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300'
              }`}
            >
              <Mic className="w-3 h-3" />
              <span>{isListening ? 'Stop Mic' : 'Talk to MAYA'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Display Text */}
        <p className="text-xs text-slate-200 font-tech leading-relaxed min-h-6">
          {interimTranscript ? (
            <span className="text-cyan-300 italic font-mono animate-pulse">"{interimTranscript}..."</span>
          ) : (
            lastReply || "All cognitive matrices, voice synthesizers, and Android subsystems operational. How may I assist you, Commander?"
          )}
        </p>
      </div>

      {/* Quick Action Matrix Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {quickShortcuts.map((s, idx) => {
          const Icon = s.icon;
          return (
            <button
              key={idx}
              onClick={s.action}
              className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#060E22]/90 hover:bg-[#091536] border border-cyan-500/20 hover:border-cyan-400/50 transition-all text-left shadow-md group active:scale-98"
            >
              <div className={`p-2 rounded-xl bg-gradient-to-br ${s.color} text-slate-950 shadow-sm shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-tech font-bold text-slate-200 block truncate group-hover:text-cyan-300 transition-colors">
                  {s.label}
                </span>
                <span className="text-[10px] text-slate-500 font-tech block truncate">
                  Tap to execute
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
