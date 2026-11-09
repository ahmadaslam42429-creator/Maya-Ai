import React, { useEffect, useState } from 'react';
import { EmotionType } from '../../types/assistant';
import { Sparkles, Activity, ShieldAlert, Heart, HelpCircle, Brain, Smile } from 'lucide-react';

interface MayaAvatarProps {
  emotion?: EmotionType;
  isListening?: boolean;
  isSpeaking?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  onClick?: () => void;
  interactive?: boolean;
}

export const MayaAvatar: React.FC<MayaAvatarProps> = ({
  emotion = 'happy',
  isListening = false,
  isSpeaking = false,
  size = 'hero',
  onClick,
  interactive = true,
}) => {
  const [blink, setBlink] = useState(false);
  const [speechStep, setSpeechStep] = useState(0);

  // Natural blinking cycle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Lip-sync / speaking pulse cycle
  useEffect(() => {
    if (!isSpeaking) {
      setSpeechStep(0);
      return;
    }
    const interval = setInterval(() => {
      setSpeechStep((prev) => (prev + 1) % 4);
    }, 140);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Color schemes based on emotion
  const emotionConfig: Record<
    EmotionType,
    {
      primary: string;
      secondary: string;
      accent: string;
      glowClass: string;
      label: string;
      icon: any;
    }
  > = {
    happy: {
      primary: '#00F0FF',
      secondary: '#00FF9D',
      accent: 'rgba(0, 255, 157, 0.3)',
      glowClass: 'glow-cyan',
      label: 'Happy & Optimistic',
      icon: Smile,
    },
    thinking: {
      primary: '#00D2FF',
      secondary: '#3A7BD5',
      accent: 'rgba(0, 210, 255, 0.3)',
      glowClass: 'glow-blue',
      label: 'Analyzing & Thinking',
      icon: Brain,
    },
    excited: {
      primary: '#00F0FF',
      secondary: '#FFB703',
      accent: 'rgba(255, 183, 3, 0.35)',
      glowClass: 'glow-cyan',
      label: 'Excited & Energized',
      icon: Sparkles,
    },
    caring: {
      primary: '#C77DFF',
      secondary: '#FF007F',
      accent: 'rgba(255, 0, 127, 0.35)',
      glowClass: 'glow-purple',
      label: 'Caring & Empathetic',
      icon: Heart,
    },
    confused: {
      primary: '#FFB703',
      secondary: '#FB8500',
      accent: 'rgba(251, 133, 0, 0.35)',
      glowClass: 'glow-cyan',
      label: 'Pondering & Clarifying',
      icon: HelpCircle,
    },
    serious: {
      primary: '#4361EE',
      secondary: '#3A0CA3',
      accent: 'rgba(67, 97, 238, 0.35)',
      glowClass: 'glow-blue',
      label: 'Tactical & Focused',
      icon: Activity,
    },
    sad: {
      primary: '#4CC9F0',
      secondary: '#4895EF',
      accent: 'rgba(76, 201, 240, 0.25)',
      glowClass: 'glow-blue',
      label: 'Gentle & Comforting',
      icon: ShieldAlert,
    },
  };

  const currentTheme = emotionConfig[emotion] || emotionConfig.happy;
  const EmotionIcon = currentTheme.icon;

  // Size dimensions
  const dimensions = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-44 h-44',
    hero: 'w-64 h-64 md:w-80 md:h-80',
  }[size];

  // Mouth path calculation depending on emotion and speech
  const renderMouth = () => {
    if (isSpeaking) {
      // Dynamic talking mouth states
      switch (speechStep) {
        case 1:
          return <path d="M 90 148 Q 100 162 110 148 Q 100 156 90 148" fill={currentTheme.primary} opacity="0.9" />;
        case 2:
          return <path d="M 88 147 Q 100 168 112 147 Z" fill={currentTheme.primary} opacity="0.8" />;
        case 3:
          return <ellipse cx="100" cy="150" rx="8" ry="6" fill={currentTheme.primary} opacity="0.85" />;
        default:
          return <path d="M 92 149 Q 100 156 108 149" stroke={currentTheme.primary} strokeWidth="3" strokeLinecap="round" fill="none" />;
      }
    }

    switch (emotion) {
      case 'happy':
        return <path d="M 88 147 Q 100 160 112 147" stroke={currentTheme.secondary} strokeWidth="3.2" strokeLinecap="round" fill="none" />;
      case 'excited':
        return <path d="M 86 146 Q 100 166 114 146 Z" fill={currentTheme.secondary} stroke={currentTheme.primary} strokeWidth="1.5" opacity="0.9" />;
      case 'caring':
        return <path d="M 90 148 Q 100 158 110 148" stroke={currentTheme.primary} strokeWidth="3" strokeLinecap="round" fill="none" />;
      case 'thinking':
        return <path d="M 93 150 Q 102 147 109 150" stroke={currentTheme.primary} strokeWidth="2.8" strokeLinecap="round" fill="none" />;
      case 'confused':
        return <path d="M 89 151 Q 96 146 104 152 Q 109 150 112 148" stroke={currentTheme.primary} strokeWidth="2.5" strokeLinecap="round" fill="none" />;
      case 'serious':
        return <line x1="91" y1="150" x2="109" y2="150" stroke={currentTheme.primary} strokeWidth="3" strokeLinecap="round" />;
      case 'sad':
        return <path d="M 89 154 Q 100 146 111 154" stroke={currentTheme.primary} strokeWidth="2.8" strokeLinecap="round" fill="none" />;
      default:
        return <path d="M 90 148 Q 100 157 110 148" stroke={currentTheme.primary} strokeWidth="3" strokeLinecap="round" fill="none" />;
    }
  };

  // Eyes rendering based on emotion & blinking
  const renderEyes = () => {
    if (blink) {
      return (
        <g stroke={currentTheme.primary} strokeWidth="3" strokeLinecap="round">
          <line x1="74" y1="104" x2="88" y2="104" />
          <line x1="112" y1="104" x2="126" y2="104" />
        </g>
      );
    }

    switch (emotion) {
      case 'happy':
        return (
          <g>
            <path d="M 72 105 Q 81 94 90 105" stroke={currentTheme.primary} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 110 105 Q 119 94 128 105" stroke={currentTheme.primary} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="81" cy="103" r="2.5" fill={currentTheme.secondary} />
            <circle cx="119" cy="103" r="2.5" fill={currentTheme.secondary} />
          </g>
        );
      case 'thinking':
        return (
          <g>
            {/* Eyes looking up/analyzing */}
            <ellipse cx="81" cy="101" rx="8" ry="7" fill="#061226" stroke={currentTheme.primary} strokeWidth="2" />
            <ellipse cx="119" cy="101" rx="8" ry="7" fill="#061226" stroke={currentTheme.primary} strokeWidth="2" />
            <circle cx="83" cy="98" r="3.8" fill={currentTheme.primary} />
            <circle cx="121" cy="98" r="3.8" fill={currentTheme.primary} />
            <circle cx="84" cy="97" r="1.5" fill="#FFFFFF" />
            <circle cx="122" cy="97" r="1.5" fill="#FFFFFF" />
            {/* Thinking HUD scan line */}
            <line x1="68" y1="91" x2="132" y2="91" stroke={currentTheme.primary} strokeWidth="1" strokeDasharray="3 2" opacity="0.8" />
          </g>
        );
      case 'excited':
        return (
          <g>
            <ellipse cx="81" cy="102" rx="9" ry="8.5" fill="#061226" stroke={currentTheme.secondary} strokeWidth="2.5" />
            <ellipse cx="119" cy="102" rx="9" ry="8.5" fill="#061226" stroke={currentTheme.secondary} strokeWidth="2.5" />
            <circle cx="81" cy="102" r="4.5" fill={currentTheme.primary} />
            <circle cx="119" cy="102" r="4.5" fill={currentTheme.primary} />
            <circle cx="83" cy="100" r="2" fill="#FFFFFF" />
            <circle cx="121" cy="100" r="2" fill="#FFFFFF" />
            <polygon points="81,90 83,94 88,95 84,98 85,102 81,100 77,102 78,98 74,95 79,94" fill={currentTheme.secondary} opacity="0.6" transform="scale(0.5) translate(81, 80)" />
          </g>
        );
      case 'caring':
        return (
          <g>
            <ellipse cx="81" cy="103" rx="8" ry="7.5" fill="#061226" stroke={currentTheme.primary} strokeWidth="2.2" />
            <ellipse cx="119" cy="103" rx="8" ry="7.5" fill="#061226" stroke={currentTheme.primary} strokeWidth="2.2" />
            <circle cx="81" cy="103" r="4" fill={currentTheme.secondary} />
            <circle cx="119" cy="103" r="4" fill={currentTheme.secondary} />
            <circle cx="83" cy="101" r="1.6" fill="#FFFFFF" />
            <circle cx="121" cy="101" r="1.6" fill="#FFFFFF" />
          </g>
        );
      case 'confused':
        return (
          <g>
            {/* Raised eyebrow on one side, lower on other */}
            <path d="M 72 92 Q 81 87 90 92" stroke={currentTheme.primary} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 110 95 Q 119 97 128 94" stroke={currentTheme.primary} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <ellipse cx="81" cy="102" rx="8" ry="7.5" fill="#061226" stroke={currentTheme.primary} strokeWidth="2" />
            <ellipse cx="119" cy="103" rx="7.5" ry="7" fill="#061226" stroke={currentTheme.primary} strokeWidth="2" />
            <circle cx="82" cy="101" r="3.5" fill={currentTheme.primary} />
            <circle cx="118" cy="103" r="3.5" fill={currentTheme.primary} />
          </g>
        );
      case 'serious':
        return (
          <g>
            {/* Tactical sharp eyes and visor */}
            <line x1="72" y1="94" x2="90" y2="97" stroke={currentTheme.primary} strokeWidth="3" strokeLinecap="round" />
            <line x1="110" y1="97" x2="128" y2="94" stroke={currentTheme.primary} strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="81" cy="104" rx="7" ry="5.5" fill="#061226" stroke={currentTheme.primary} strokeWidth="2" />
            <ellipse cx="119" cy="104" rx="7" ry="5.5" fill="#061226" stroke={currentTheme.primary} strokeWidth="2" />
            <circle cx="81" cy="104" r="3" fill={currentTheme.secondary} />
            <circle cx="119" cy="104" r="3" fill={currentTheme.secondary} />
            {/* HUD reticle target dots */}
            <circle cx="81" cy="104" r="1" fill="#FFFFFF" />
            <circle cx="119" cy="104" r="1" fill="#FFFFFF" />
          </g>
        );
      case 'sad':
        return (
          <g>
            <path d="M 72 96 Q 81 92 90 97" stroke={currentTheme.primary} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 110 97 Q 119 92 128 96" stroke={currentTheme.primary} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <ellipse cx="81" cy="104" rx="7.5" ry="7" fill="#061226" stroke={currentTheme.primary} strokeWidth="2" />
            <ellipse cx="119" cy="104" rx="7.5" ry="7" fill="#061226" stroke={currentTheme.primary} strokeWidth="2" />
            <circle cx="81" cy="105" r="3.8" fill={currentTheme.primary} />
            <circle cx="119" cy="105" r="3.8" fill={currentTheme.primary} />
            <circle cx="83" cy="103" r="1.3" fill="#FFFFFF" />
            <circle cx="121" cy="103" r="1.3" fill="#FFFFFF" />
          </g>
        );
      default:
        return (
          <g>
            <ellipse cx="81" cy="103" rx="8" ry="7" fill="#061226" stroke={currentTheme.primary} strokeWidth="2" />
            <ellipse cx="119" cy="103" rx="8" ry="7" fill="#061226" stroke={currentTheme.primary} strokeWidth="2" />
            <circle cx="81" cy="103" r="4" fill={currentTheme.primary} />
            <circle cx="119" cy="103" r="4" fill={currentTheme.primary} />
            <circle cx="83" cy="101" r="1.5" fill="#FFFFFF" />
            <circle cx="121" cy="101" r="1.5" fill="#FFFFFF" />
          </g>
        );
    }
  };

  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={`relative flex items-center justify-center ${dimensions} group transition-all duration-500 ${
        interactive ? 'cursor-pointer active:scale-95' : ''
      }`}
    >
      {/* Outer Holographic Energy Ring */}
      <div
        className={`absolute inset-0 rounded-full border border-dashed transition-all duration-700 animate-spin-slow opacity-60 ${
          isListening ? 'border-cyan-400 scale-110' : 'border-blue-500/40'
        }`}
        style={{ borderColor: currentTheme.primary }}
      />

      {/* Counter-rotating Segmented HUD Ring */}
      <div
        className="absolute inset-1 rounded-full border-2 border-t-transparent border-b-transparent animate-spin-reverse-slow opacity-75"
        style={{ borderColor: currentTheme.secondary }}
      />

      {/* Pulsing Aura Glow */}
      <div
        className={`absolute inset-3 rounded-full blur-xl transition-all duration-500 ${
          isSpeaking ? 'opacity-80 scale-105' : isListening ? 'opacity-90 scale-110' : 'opacity-40'
        }`}
        style={{ backgroundColor: currentTheme.accent }}
      />

      {/* Main Core HUD Chamber */}
      <div className="relative w-full h-full rounded-full bg-[#050D1F]/90 border border-cyan-500/30 flex items-center justify-center overflow-hidden shadow-2xl backdrop-blur-md">
        {/* Hologram Grid Backdrop */}
        <div className="absolute inset-0 bg-grid-pattern opacity-25" />

        {/* Scanlines Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent pointer-events-none animate-pulse-glow" />

        {/* SVG Female AI Avatar */}
        <svg viewBox="0 0 200 200" className="w-[88%] h-[88%] z-10 transition-transform duration-500">
          <defs>
            {/* Holographic Gradients */}
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B1C3D" />
              <stop offset="50%" stopColor="#122756" />
              <stop offset="100%" stopColor={currentTheme.primary} stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="faceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0A1836" />
              <stop offset="60%" stopColor="#0E2248" />
              <stop offset="100%" stopColor="#07142A" />
            </linearGradient>

            <linearGradient id="glowG" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentTheme.primary} stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Futuristic Cyber Hair / Holographic Helmet Halo */}
          <path
            d="M 50 110 C 45 70, 60 38, 100 38 C 140 38, 155 70, 150 110 C 158 135, 142 165, 138 175 C 130 162, 136 140, 134 118 C 132 80, 118 52, 100 52 C 82 52, 68 80, 66 118 C 64 140, 70 162, 62 175 C 58 165, 42 135, 50 110 Z"
            fill="url(#hairGrad)"
            stroke={currentTheme.primary}
            strokeWidth="1.2"
            opacity="0.95"
          />

          {/* Holographic Crown / Ear Piece Nodes */}
          <g>
            <rect x="42" y="98" width="8" height="22" rx="4" fill="#0D2248" stroke={currentTheme.primary} strokeWidth="1.5" />
            <circle cx="46" cy="109" r="2.5" fill={isSpeaking || isListening ? currentTheme.secondary : currentTheme.primary}>
              <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
            </circle>

            <rect x="150" y="98" width="8" height="22" rx="4" fill="#0D2248" stroke={currentTheme.primary} strokeWidth="1.5" />
            <circle cx="154" cy="109" r="2.5" fill={isSpeaking || isListening ? currentTheme.secondary : currentTheme.primary}>
              <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Sleek Female AI Face Structure */}
          <path
            d="M 64 92 C 64 68, 76 60, 100 60 C 124 60, 136 68, 136 92 C 136 122, 122 155, 100 165 C 78 155, 64 122, 64 92 Z"
            fill="url(#faceGrad)"
            stroke={currentTheme.primary}
            strokeWidth="1.5"
          />

          {/* Cybernetic Cheek Line Accents */}
          <path d="M 69 116 L 76 130" stroke={currentTheme.primary} strokeWidth="1.2" strokeDasharray="2 2" opacity="0.6" />
          <path d="M 131 116 L 124 130" stroke={currentTheme.primary} strokeWidth="1.2" strokeDasharray="2 2" opacity="0.6" />

          {/* Forehead Hologram Node */}
          <polygon points="100,68 103,73 100,78 97,73" fill={currentTheme.primary} opacity="0.8" />

          {/* Nose Accent */}
          <path d="M 100 116 L 98 132 L 102 132" stroke={currentTheme.primary} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.75" />

          {/* Eyes System */}
          {renderEyes()}

          {/* Animated Mouth System */}
          {renderMouth()}

          {/* Voice Wave Ring Indicator when listening */}
          {isListening && (
            <circle cx="100" cy="100" r="92" stroke={currentTheme.secondary} strokeWidth="2" fill="none" opacity="0.8">
              <animate attributeName="r" values="84;95;84" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>

        {/* Emotion Indicator Badge at bottom */}
        <div className="absolute bottom-2.5 z-20 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#050D1F]/90 border border-cyan-500/40 text-[10px] text-cyan-300 font-tech font-semibold tracking-wider shadow-lg">
          <EmotionIcon className="w-3 h-3 text-cyan-400" />
          <span className="capitalize">{emotion}</span>
        </div>
      </div>

      {/* Active State Badges */}
      {isListening && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border border-white"></span>
        </span>
      )}
      {isSpeaking && (
        <span className="absolute -top-1 -left-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500 border border-white"></span>
        </span>
      )}
    </div>
  );
};
